import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, BackgroundTasks
from app.limiter import limiter

logger = logging.getLogger("peaktalk.simulation")
from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.cache import cache_get, cache_set, cache_invalidate_prefix

from app.database import get_db
from app.dependencies import get_current_user
from app.models.document import Document
from app.models.scenario import Scenario
from app.models.guest import GuestSession
from app.models.draft import SpeechDraft
from app.models.meeting import MeetingStatus, UpcomingMeeting
from app.models.simulation import (
    ArtifactType,
    MessageRole,
    SessionArtifact,
    SessionStatus,
    SimulationMessage,
    SimulationSession,
    SkillMetric,
)
from app.models.personalized_persona import PersonalizedPersona
from app.models.user import User
from app.schemas.simulation import (
    ArtifactPaywall,
    ArtifactPaywallTeaser,
    PrepCardContent,
    SendMessageRequest,
    SendMessageResponse,
    SessionArtifactResponse,
    SimulationReportResponse,
    SimulationRerunResponse,
    SimulationSessionListItem,
    SimulationSessionListResponse,
    SimulationSessionResponse,
    StartFromScenarioRequest,
    StartFromGuestRequest,
    StartFromGuestResponse,
    StartFromScenarioResponse,
    SimulationStartRequest,
)
from app.services.cloud_ru_ai import CloudRuAIError, detect_ai_content
from app.services.limits import (
    check_simulation_limit,
    consume_session_credit,
    get_can_use_pdf,
    get_plan_limits_for_user,
    get_user_subscription,
    increment_simulation_counter,
)
from app.services.simulation_ai import evaluate_session, generate_prep_card, generate_question

router = APIRouter(prefix="/simulation", tags=["simulation"])


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def _background_generate_prep_card(session_id: uuid.UUID) -> None:
    # Get a fresh DB session for the background task
    from app.database import async_session_maker
    async with async_session_maker() as db:
        # Load the session with messages
        stmt = select(SimulationSession).options(selectinload(SimulationSession.messages)).where(SimulationSession.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            logger.error("prep_card_bg: session not found session=%s", session_id)
            return

        await _ensure_prep_card_artifact(session, db)
        await db.commit()

async def _ensure_prep_card_artifact(session: SimulationSession, db: AsyncSession) -> None:
    existing = await db.execute(
        select(SessionArtifact).where(
            SessionArtifact.session_id == session.id,
            SessionArtifact.artifact_type == ArtifactType.prep_card,
        )
    )
    if existing.scalar_one_or_none() is not None:
        logger.debug("prep_card: already exists session=%s", session.id)
        return

    doc_text = await _get_session_source_text(db, session)
    messages = [{"role": m.role.value, "content": m.content} for m in session.messages]
    content = await generate_prep_card(doc_text=doc_text, messages=messages)

    artifact = SessionArtifact(
        session_id=session.id,
        artifact_type=ArtifactType.prep_card,
        content=content,
    )
    db.add(artifact)
    await db.flush()
    logger.info("prep_card: stored artifact session=%s", session.id)


async def _user_has_artifact_access(user_id: uuid.UUID, db: AsyncSession) -> bool:
    """Return True if the user has an active paid plan or session credits."""
    subscription, counter, limits = await get_plan_limits_for_user(str(user_id), db)
    if counter.session_credits > 0:
        return True
    # Any plan that is not free gives artifact access
    from app.services.limits import _effective_plan  # local import — private helper
    from app.models.subscription import PlanType
    effective = _effective_plan(subscription)
    return effective not in (PlanType.free,)


async def _session_has_artifact_access(
    session: SimulationSession,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> bool:
    if bool((session.persona_config or {}).get("paid_access")):
        return True
    return await _user_has_artifact_access(user_id, db)

# Cache TTL for simulation list (seconds)
_SIM_LIST_TTL = 60

SESSION_STATUS_LABELS = {
    "active": "активна",
    "completed": "завершена",
    "cancelled": "отменена",
}


def _sim_cache_prefix(user_id: uuid.UUID) -> str:
    return f"sim_list:{user_id}"


def _sim_cache_key(user_id: uuid.UUID, limit: int, offset: int) -> str:
    return f"sim_list:{user_id}:{limit}:{offset}"


def _status_label(status_value: str) -> str:
    return SESSION_STATUS_LABELS.get(status_value, status_value)

_BASE_TURNS = 8
_MAX_TURNS_CAP = 15


def _build_initial_max_turns(difficulty: int, doc_text: str = "") -> int:
    turns = _BASE_TURNS + 2
    if doc_text and len(doc_text.split()) > 2000:
        turns += 2
    if difficulty >= 4:
        turns += 2
    return min(turns, _MAX_TURNS_CAP)


def _calculate_max_turns(session: "SimulationSession", doc_text: str = "") -> int:
    turns = _BASE_TURNS

    word_count = len(doc_text.split()) if doc_text else 0
    if word_count > 2000:
        turns += 2

    user_messages = [m for m in session.messages if m.role == MessageRole.user]
    high_quality_answers = sum(
        1
        for m in user_messages
        if len(m.content.split()) > 150 and any(c.isdigit() for c in m.content)
    )
    if high_quality_answers < 3:
        turns += 2

    difficulty = int((session.persona_config or {}).get("difficulty", 3))
    if difficulty >= 4:
        turns += 2

    return min(turns, _MAX_TURNS_CAP)


async def _get_doc_text(
    db: AsyncSession,
    document_id: uuid.UUID | None,
    draft_id: uuid.UUID | None,
    user_id: uuid.UUID | None = None,
) -> str:
    """Resolve source document text. Ownership check enforced when user_id provided."""
    if document_id:
        stmt = select(Document).where(Document.id == document_id)
        if user_id is not None:
            stmt = stmt.where(Document.owner_id == user_id)
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()
        if doc and doc.extracted_text:
            return doc.extracted_text
    if draft_id:
        stmt = select(SpeechDraft).where(SpeechDraft.id == draft_id)
        if user_id is not None:
            stmt = stmt.where(SpeechDraft.user_id == user_id)
        result = await db.execute(stmt)
        draft = result.scalar_one_or_none()
        if draft:
            return draft.raw_text
    return ""


async def _get_scenario_source(
    db: AsyncSession,
    scenario_id: uuid.UUID | str | None,
) -> tuple[str, str | None]:
    if scenario_id is None:
        return "", None

    if not isinstance(scenario_id, uuid.UUID):
        try:
            scenario_id = uuid.UUID(str(scenario_id))
        except (TypeError, ValueError):
            return "", None

    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if scenario is None:
        return "", None
    return scenario.simulation_context, scenario.title


async def _get_session_source_text(
    db: AsyncSession,
    session: SimulationSession,
    user_id: uuid.UUID | None = None,
) -> str:
    doc_text = await _get_doc_text(
        db,
        session.document_id,
        session.draft_id,
        user_id,
    )
    if doc_text:
        return doc_text

    scenario_text, _ = await _get_scenario_source(
        db,
        (session.persona_config or {}).get("scenario_id"),
    )
    return scenario_text


async def _get_session_context_title(
    db: AsyncSession,
    session: SimulationSession,
) -> str | None:
    if session.document_id:
        doc_res = await db.execute(
            select(Document.name).where(Document.id == session.document_id)
        )
        return doc_res.scalar_one_or_none()

    if session.draft_id:
        draft_res = await db.execute(
            select(SpeechDraft.title).where(SpeechDraft.id == session.draft_id)
        )
        return draft_res.scalar_one_or_none()

    _, scenario_title = await _get_scenario_source(
        db,
        (session.persona_config or {}).get("scenario_id"),
    )
    return scenario_title


async def _load_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
    populate_existing: bool = False,
) -> SimulationSession:
    stmt = (
        select(SimulationSession)
        .options(
            selectinload(SimulationSession.messages),
            selectinload(SimulationSession.skill_metrics),
        )
        .where(SimulationSession.id == session_id, SimulationSession.user_id == user_id)
    )
    if populate_existing:
        stmt = stmt.execution_options(populate_existing=True)
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сессия не найдена.")
    return session


@router.get("", response_model=SimulationSessionListResponse)
async def list_sessions(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSessionListResponse:
    # ── Cache-aside: try Redis first ─────────────────────────────────────────
    cache_key = _sim_cache_key(current_user.id, limit, offset)
    cached = await cache_get(cache_key)
    if cached:
        return SimulationSessionListResponse.model_validate(cached)

    # ── Correlated subqueries: compute counts/avg in DB, no Python iteration ─
    # Counts all messages for each session
    msg_count_sub = (
        select(sqlfunc.count(SimulationMessage.id))
        .where(SimulationMessage.session_id == SimulationSession.id)
        .correlate(SimulationSession)
        .scalar_subquery()
    )
    # Averages all skill metric scores (0.0–1.0) for each session
    avg_score_sub = (
        select(sqlfunc.avg(SkillMetric.score))
        .where(SkillMetric.session_id == SimulationSession.id)
        .correlate(SimulationSession)
        .scalar_subquery()
    )

    # Single query: sessions + aggregates + total via window function
    total_res = await db.execute(
        select(sqlfunc.count()).select_from(SimulationSession)
        .where(SimulationSession.user_id == current_user.id)
    )
    total = total_res.scalar_one()

    res = await db.execute(
        select(
            SimulationSession,
            msg_count_sub.label("message_count"),
            avg_score_sub.label("avg_score"),
        )
        .where(SimulationSession.user_id == current_user.id)
        .order_by(SimulationSession.created_at.desc())
        .limit(limit).offset(offset)
    )
    rows = res.all()

    # ── Batch-load document names and draft titles ───────────────────────────
    doc_ids = list({r.SimulationSession.document_id for r in rows if r.SimulationSession.document_id})
    doc_names: dict = {}
    if doc_ids:
        docs_res = await db.execute(
            select(Document.id, Document.name).where(Document.id.in_(doc_ids))
        )
        doc_names = {row.id: row.name for row in docs_res}

    draft_ids = list({r.SimulationSession.draft_id for r in rows if r.SimulationSession.draft_id})
    draft_titles: dict = {}
    if draft_ids:
        drafts_res = await db.execute(
            select(SpeechDraft.id, SpeechDraft.title).where(SpeechDraft.id.in_(draft_ids))
        )
        draft_titles = {row.id: row.title for row in drafts_res}

    # ── Build response ───────────────────────────────────────────────────────
    items = []
    for row in rows:
        s = row.SimulationSession
        raw_avg = row.avg_score
        avg_score = round(float(raw_avg), 2) if raw_avg is not None else None
        context_title = (
            doc_names.get(s.document_id) if s.document_id
            else draft_titles.get(s.draft_id) if s.draft_id
            else (s.persona_config or {}).get("scenario_title")
        )
        items.append(SimulationSessionListItem(
            id=s.id,
            persona_config=s.persona_config,
            status=s.status,
            created_at=s.created_at,
            completed_at=s.completed_at,
            message_count=int(row.message_count or 0),
            avg_score=avg_score,
            document_title=context_title,
        ))

    result = SimulationSessionListResponse(items=items, total=total)

    # ── Populate cache ───────────────────────────────────────────────────────
    await cache_set(cache_key, result.model_dump(mode="json"), ttl=_SIM_LIST_TTL)
    logger.debug("list_sessions cached key=%s items=%d", cache_key, len(items))

    return result


@router.get("/personas")
async def get_personas(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.services.simulation_ai import get_available_personas, get_default_difficulty, get_industries_for_segment
    from app.models.personalized_persona import PersonalizedPersona

    profile = current_user.onboarding_profile
    segment = profile.segment.value if profile else None

    # Fetch user's personalized personas
    personas_result = await db.execute(
        select(PersonalizedPersona)
        .where(PersonalizedPersona.user_id == current_user.id)
        .order_by(PersonalizedPersona.usage_count.desc(), PersonalizedPersona.created_at.desc())
    )
    user_personas = [
        {
            "id": str(p.id),
            "name": p.name,
            "role": p.role,
            "communication_style": p.communication_style,
            "difficulty_hint": p.difficulty_hint,
            "usage_count": p.usage_count,
        }
        for p in personas_result.scalars().all()
    ]

    return {
        "segment": segment or "other",
        "default_difficulty": get_default_difficulty(segment),
        "personas": get_available_personas(segment),
        "industries": get_industries_for_segment(segment),
        "user_personas": user_personas,
    }


@router.post("/start", response_model=SimulationSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def start_simulation(
    request: Request,
    body: SimulationStartRequest,
    _limit_check: None = Depends(check_simulation_limit),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSession:
    doc_text = await _get_doc_text(db, body.document_id, body.draft_id, current_user.id) if (body.document_id or body.draft_id) else ""
    has_paid_access = await _user_has_artifact_access(current_user.id, db)

    custom_persona_payload: dict | None = None
    if body.source_type == "custom":
        persona_res = await db.execute(
            select(PersonalizedPersona).where(PersonalizedPersona.id == body.persona_id)
        )
        persona = persona_res.scalar_one_or_none()
        if persona is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Персона не найдена.")
        if persona.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к этой персоне.")

        difficulty = int(persona.difficulty_hint)
        persona_config_data = {
            "source_type": "custom",
            "role": persona.role,
            "persona_id": str(persona.id),
            "persona_name": persona.name,
            "persona_role_label": persona.role,
            "industry": body.industry,
            "difficulty": difficulty,
            "background": persona.background,
            "communication_style": persona.communication_style,
            "focus_areas": persona.focus_areas or [],
            "catch_phrases": persona.catch_phrases or [],
            "age": persona.age,
            "paid_access": has_paid_access,
        }
        persona_config_data["max_turns"] = _build_initial_max_turns(difficulty, doc_text)
        custom_persona_payload = {
            "name": persona.name,
            "communication_style": persona.communication_style,
            "focus_areas": persona.focus_areas or [],
            "background": persona.background,
            "age": persona.age,
            "catch_phrases": persona.catch_phrases or [],
        }
    else:
        difficulty = int(body.difficulty or 3)
        persona_config_data = {
            "source_type": "system",
            "role": body.persona_config.role if body.persona_config else None,
            "industry": body.industry,
            "difficulty": difficulty,
            "paid_access": has_paid_access,
        }
        persona_config_data["max_turns"] = _build_initial_max_turns(difficulty, doc_text)

    session = SimulationSession(
        user_id=current_user.id,
        document_id=body.document_id,
        draft_id=body.draft_id,
        persona_config=persona_config_data,
        status=SessionStatus.active,
    )
    db.add(session)
    await db.flush()

    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None

    try:
        turn = await generate_question(
            persona_config=persona_config_data,
            doc_text=doc_text,
            history=[],
            user_context=user_context,
            custom_persona=custom_persona_payload,
        )
    except CloudRuAIError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    first_message = SimulationMessage(
        session_id=session.id,
        role=MessageRole.assistant,
        content=turn.question,
        internal_reasoning=turn.internal_reasoning,
        turn_index=0,
    )
    db.add(first_message)
    await db.flush()

    if body.source_type == "custom":
        persona_res = await db.execute(
            select(PersonalizedPersona).where(
                PersonalizedPersona.id == body.persona_id,
                PersonalizedPersona.user_id == current_user.id,
            )
        )
        started_persona = persona_res.scalar_one_or_none()
        if started_persona is not None:
            started_persona.usage_count += 1
            await db.flush()

    await consume_session_credit(str(current_user.id), db)
    await increment_simulation_counter(str(current_user.id), db)

    # Link session to meeting if meeting_id provided
    if body.meeting_id:
        meeting_res = await db.execute(
            select(UpcomingMeeting).where(
                UpcomingMeeting.id == body.meeting_id,
                UpcomingMeeting.user_id == current_user.id,
            )
        )
        meeting = meeting_res.scalar_one_or_none()
        if meeting:
            meeting.simulation_session_id = session.id
            meeting.status = MeetingStatus.prepared
            await db.flush()
            logger.info("Simulation linked to meeting user=%s session=%s meeting=%s", current_user.id, session.id, body.meeting_id)

    await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))
    logger.info(
        "Simulation started user=%s session=%s source=%s persona=%s",
        current_user.id,
        session.id,
        body.source_type,
        persona_config_data.get("role"),
    )
    return await _load_session(db, session.id, current_user.id)


@router.post(
    "/start-from-scenario",
    response_model=StartFromScenarioResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def start_simulation_from_scenario(
    request: Request,
    body: StartFromScenarioRequest,
    _limit_check: None = Depends(check_simulation_limit),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StartFromScenarioResponse:
    scenario_res = await db.execute(
        select(Scenario).where(
            Scenario.id == body.scenario_id,
            Scenario.is_active.is_(True),
        )
    )
    scenario = scenario_res.scalar_one_or_none()
    if scenario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сценарий не найден.",
        )

    persona_config_data = {
        "source_type": "scenario",
        "role": scenario.recommended_persona,
        "industry": scenario.category.value,
        "difficulty": body.difficulty,
        "scenario_id": str(scenario.id),
        "scenario_slug": scenario.slug,
        "scenario_title": scenario.title,
        "paid_access": await _user_has_artifact_access(current_user.id, db),
    }

    initial_turns = _BASE_TURNS + 2
    if body.difficulty >= 4:
        initial_turns += 2
    persona_config_data["max_turns"] = min(initial_turns, _MAX_TURNS_CAP)

    session = SimulationSession(
        user_id=current_user.id,
        persona_config=persona_config_data,
        status=SessionStatus.active,
    )
    db.add(session)
    await db.flush()

    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None

    try:
        turn = await generate_question(
            persona_config=persona_config_data,
            doc_text=scenario.simulation_context,
            history=[],
            user_context=user_context,
        )
    except CloudRuAIError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    db.add(
        SimulationMessage(
            session_id=session.id,
            role=MessageRole.assistant,
            content=turn.question,
            internal_reasoning=turn.internal_reasoning,
            turn_index=0,
        )
    )
    await db.flush()

    await consume_session_credit(str(current_user.id), db)
    await increment_simulation_counter(str(current_user.id), db)
    await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))
    logger.info(
        "Simulation started from scenario user=%s session=%s scenario=%s",
        current_user.id,
        session.id,
        scenario.slug,
    )
    return StartFromScenarioResponse(id=session.id)


@router.post(
    "/{session_id}/rerun",
    response_model=SimulationRerunResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def rerun_simulation(
    request: Request,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationRerunResponse:
    stmt = (
        select(SimulationSession)
        .options(selectinload(SimulationSession.messages))
        .where(
            SimulationSession.id == session_id,
            SimulationSession.user_id == current_user.id,
        )
        .with_for_update()
    )
    result = await db.execute(stmt)
    source_session = result.scalar_one_or_none()
    if source_session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сессия не найдена.")

    source_config = dict(source_session.persona_config or {})
    if source_session.status != SessionStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "Повторный прогон доступен только после завершения исходного стресс-теста.",
                "code": "rerun_source_not_completed",
            },
        )

    if source_config.get("rerun_source_session_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "Повторный прогон уже является производной сессией. Запустите новый Defense Pack для следующего цикла.",
                "code": "rerun_chain_not_allowed",
            },
        )

    existing_rerun_id = source_config.get("rerun_session_id")
    if existing_rerun_id:
        try:
            existing_id = uuid.UUID(str(existing_rerun_id))
        except (TypeError, ValueError):
            existing_id = None
        if existing_id is not None:
            existing_rerun = await db.get(SimulationSession, existing_id)
            if existing_rerun is not None and existing_rerun.user_id == current_user.id:
                return SimulationRerunResponse(id=existing_rerun.id)

    if not bool(source_config.get("paid_access")):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": "Повторный прогон по тем же материалам входит только в оплаченный Defense Pack.",
                "code": "rerun_paid_access_required",
                "plan": "per_session",
            },
        )

    doc_text = await _get_session_source_text(db, source_session, current_user.id)
    try:
        difficulty = int(source_config.get("difficulty", 3))
    except (TypeError, ValueError):
        difficulty = 3

    rerun_config = {
        **source_config,
        "paid_access": True,
        "rerun_source_session_id": str(source_session.id),
        "max_turns": _build_initial_max_turns(difficulty, doc_text),
    }
    rerun_config.pop("rerun_session_id", None)

    rerun_session = SimulationSession(
        user_id=current_user.id,
        document_id=source_session.document_id,
        draft_id=source_session.draft_id,
        persona_config=rerun_config,
        status=SessionStatus.active,
    )
    db.add(rerun_session)
    await db.flush()

    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None

    try:
        turn = await generate_question(
            persona_config=rerun_config,
            doc_text=doc_text,
            history=[],
            user_context=user_context,
            custom_persona=rerun_config if rerun_config.get("source_type") == "custom" else None,
        )
    except CloudRuAIError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    db.add(
        SimulationMessage(
            session_id=rerun_session.id,
            role=MessageRole.assistant,
            content=turn.question,
            internal_reasoning=turn.internal_reasoning,
            turn_index=0,
        )
    )

    source_config["rerun_session_id"] = str(rerun_session.id)
    source_session.persona_config = source_config

    await db.flush()
    await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))
    logger.info(
        "Simulation rerun started user=%s source_session=%s rerun_session=%s",
        current_user.id,
        source_session.id,
        rerun_session.id,
    )
    return SimulationRerunResponse(id=rerun_session.id)


@router.post("/{session_id}/message", response_model=SendMessageResponse)
@limiter.limit("15/minute")
async def send_message(
    request: Request,
    session_id: uuid.UUID,
    body: SendMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SendMessageResponse:
    session = await _load_session(db, session_id, current_user.id)

    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Сессия находится в статусе «{_status_label(session.status.value)}», а не активна.",
        )

    # AI-generated content detection — fail open (never blocks on error)
    if await detect_ai_content(body.content):
        logger.info("AI-generated content detected session=%s", session_id)
        return SendMessageResponse(ai_detected=True)

    next_turn_index = len(session.messages)

    user_msg = SimulationMessage(
        session_id=session.id,
        role=MessageRole.user,
        content=body.content,
        turn_index=next_turn_index,
    )
    db.add(user_msg)
    await db.flush()

    doc_text = await _get_session_source_text(db, session)

    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in session.messages
    ] + [{"role": "user", "content": body.content}]

    # Count AI messages already asked (before this user answer)
    ai_turn_count = sum(1 for m in session.messages if m.role == MessageRole.assistant)

    max_turns = int((session.persona_config or {}).get("max_turns", _BASE_TURNS))

    # Auto-complete when the session-specific turn limit has been reached
    if ai_turn_count >= max_turns:
        try:
            await _finalize_session(session, db)
            background_tasks.add_task(_background_generate_prep_card, session.id)
        except CloudRuAIError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        await db.refresh(user_msg)

        await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))
        logger.info("Session auto-completed at max_turns=%d session=%s", max_turns, session_id)
        return SendMessageResponse(user_message=user_msg, assistant_message=None, session_completed=True)

    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None

    try:
        turn = await generate_question(
            persona_config=session.persona_config,
            doc_text=doc_text,
            history=history,
            user_context=user_context,
            custom_persona=session.persona_config if (session.persona_config or {}).get("source_type") == "custom" else None,
        )
    except CloudRuAIError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    assistant_msg = SimulationMessage(
        session_id=session.id,
        role=MessageRole.assistant,
        content=turn.question,
        internal_reasoning=turn.internal_reasoning,
        turn_index=next_turn_index + 1,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(user_msg)
    await db.refresh(assistant_msg)

    # Invalidate list cache (message_count changed)
    await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))

    return SendMessageResponse(user_message=user_msg, assistant_message=assistant_msg)


@router.get("/{session_id}/history", response_model=SimulationSessionResponse)
async def get_history(
    request: Request,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSession:
    return await _load_session(db, session_id, current_user.id)


async def _finalize_session(session: SimulationSession, db: AsyncSession) -> None:
    """Run evaluation and mark session as completed. Shared by endpoint and auto-complete."""
    doc_text = await _get_session_source_text(db, session)
    history = [{"role": m.role.value, "content": m.content} for m in session.messages]
    evaluation = await evaluate_session(doc_text=doc_text, messages=history)
    for metric in evaluation.metrics:
        db.add(SkillMetric(
            session_id=session.id,
            metric_name=metric["name"],
            score=metric["score"],
            comment=metric.get("comment"),
        ))
    session.status = SessionStatus.completed
    session.completed_at = datetime.now(timezone.utc)
    await db.flush()
    logger.info("Session finalized session=%s metrics=%d", session.id, len(evaluation.metrics))


@router.post("/{session_id}/complete", response_model=SimulationSessionResponse)
async def complete_session(
    request: Request,
    session_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSession:
    session = await _load_session(db, session_id, current_user.id)

    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Сессия уже находится в статусе «{_status_label(session.status.value)}».",
        )

    user_messages = [m for m in session.messages if m.role == MessageRole.user]
    if not user_messages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Нельзя завершить сессию без ответов пользователя.",
        )

    try:
        await _finalize_session(session, db)
        background_tasks.add_task(_background_generate_prep_card, session.id)
    except CloudRuAIError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))
    logger.info("Session completed by user user=%s session=%s", current_user.id, session_id)
    return await _load_session(db, session.id, current_user.id, populate_existing=True)


@router.get("/{session_id}/report", response_model=SimulationReportResponse)
async def get_report(
    request: Request,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationReportResponse:
    session = await _load_session(db, session_id, current_user.id)
    if session.status != SessionStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Отчет доступен только после завершения сессии.",
        )
    context_title = await _get_session_context_title(db, session)

    # Determine PDF availability based on user's current plan
    subscription = await get_user_subscription(str(current_user.id), db)
    pdf_available = bool(
        (session.persona_config or {}).get("paid_access") or get_can_use_pdf(subscription)
    )

    base = SimulationSessionResponse.model_validate(session)
    return SimulationReportResponse(
        **base.model_dump(),
        document_title=context_title,
        pdf_available=pdf_available,
    )


@router.get("/{session_id}/artifact", response_model=SessionArtifactResponse)
async def get_artifact(
    request: Request,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionArtifactResponse:
    """Return the prep card artifact for a completed session.

    - paid user + artifact ready    → available=True, full content
    - free user                     → available=False, teaser + paywall
    - session not completed         → 422
    """
    session = await _load_session(db, session_id, current_user.id)
    if session.status != SessionStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Defense Brief доступен только после завершения сессии.",
        )

    has_access = await _session_has_artifact_access(session, current_user.id, db)

    # Look up existing artifact
    artifact_res = await db.execute(
        select(SessionArtifact).where(
            SessionArtifact.session_id == session_id,
            SessionArtifact.artifact_type == ArtifactType.prep_card,
        )
    )
    artifact = artifact_res.scalar_one_or_none()

    if has_access:
        if artifact is not None:
            return SessionArtifactResponse(
                available=True,
                artifact=PrepCardContent.model_validate(artifact.content),
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Defense Brief отсутствует в сохраненных артефактах сессии.",
        )

    # Free user: return teaser with partial info
    # If no artifact exists we can still build teaser from session data counts
    if artifact is not None:
        content = artifact.content
        top_count = len(content.get("top_arguments", []))
        danger_count = len(content.get("danger_zones", []))
        all_phrases = content.get("anchor_phrases", [])
        preview = all_phrases[:1]
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Defense Brief отсутствует в сохраненных артефактах сессии.",
        )

    return SessionArtifactResponse(
        available=False,
        teaser=ArtifactPaywallTeaser(
            top_arguments_count=top_count,
            anchor_phrases_preview=preview,
            danger_zones_count=danger_count,
        ),
        paywall=ArtifactPaywall(
            message="Defense Brief доступен в платной сессии",
            cta="Получить Defense Brief — 299 ₽",
            action="pay_per_session",
        ),
    )


async def _background_finalize_and_prep_card(session_id: uuid.UUID) -> None:
    from app.database import async_session_maker
    async with async_session_maker() as db:
        stmt = select(SimulationSession).options(selectinload(SimulationSession.messages)).where(SimulationSession.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        if not session:
            return

        try:
            await _finalize_session(session, db)
            await _ensure_prep_card_artifact(session, db)
            await db.commit()
        except Exception as exc:
            logger.error("background_finalize failed session=%s error=%s", session_id, exc)

@router.post("/{session_id}/abandon", status_code=status.HTTP_204_NO_CONTENT)
async def abandon_session(
    request: Request,
    session_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Called when user closes the tab mid-simulation (beforeunload beacon).
    - No user answers yet → cancelled (no AI evaluation needed)
    - Has at least one answer → finalize with evaluation (status = completed)
    - Already completed/cancelled → no-op (idempotent)
    """
    try:
        session = await _load_session(db, session_id, current_user.id)
    except HTTPException:
        return  # Not found or wrong owner — ignore silently

    if session.status != SessionStatus.active:
        return  # Already finalized — idempotent

    user_messages = [m for m in session.messages if m.role == MessageRole.user]

    session.completed_at = datetime.now(timezone.utc)
    if user_messages:
        session.status = SessionStatus.completed
        await db.flush()
        background_tasks.add_task(_background_finalize_and_prep_card, session.id)
    else:
        session.status = SessionStatus.cancelled
        await db.flush()

    await db.commit()
    await cache_invalidate_prefix(_sim_cache_prefix(current_user.id))
    logger.info(
        "Session abandoned user=%s session=%s had_answers=%s final_status=%s",
        current_user.id, session_id, bool(user_messages), session.status.value,
    )

@router.post("/from-guest", response_model=StartFromGuestResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def start_from_guest(
    request: Request,
    body: StartFromGuestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StartFromGuestResponse:
    # Load guest session
    guest_res = await db.execute(
        select(GuestSession).where(GuestSession.session_token == body.guest_session_id)
        .with_for_update()
    )
    guest = guest_res.scalar_one_or_none()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest session not found",
        )

    if guest.migrated_session_id is not None:
        migrated_session = await db.get(SimulationSession, guest.migrated_session_id)
        if migrated_session is not None and migrated_session.user_id == current_user.id:
            return StartFromGuestResponse(id=migrated_session.id)

        logger.warning(
            "guest migration reuse rejected token=%s current_user=%s migrated_session=%s",
            body.guest_session_id,
            current_user.id,
            guest.migrated_session_id,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "Гостевая сессия уже была перенесена в другой аккаунт.",
                "code": "guest_session_already_migrated",
            },
        )

    if _as_utc(guest.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={
                "detail": "Гостевая сессия истекла. Начните новый стресс-тест перед оплатой.",
                "code": "guest_session_expired",
            },
        )

    # 1. Consume limits
    consumed_credit = await consume_session_credit(str(current_user.id), db)
    if not consumed_credit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": "Для продолжения гостевого стресс-теста нужна оплаченная разовая сессия.",
                "code": "session_credit_required",
                "limit_type": "session_credits",
                "plan": "per_session",
            },
        )

    await increment_simulation_counter(str(current_user.id), db)

    # 2. Transfer session
    persona_config = {
        "role": guest.persona,
        "industry": "general",
        "difficulty": body.difficulty,
        "paid_access": consumed_credit,
    }

    session = SimulationSession(
        user_id=current_user.id,
        persona_config=persona_config,
        status=SessionStatus.active,
    )
    db.add(session)
    await db.flush()

    # 3. Create Draft linked to the simulation
    # If the user has long text, save it as a draft so PrepCard works properly
    draft = SpeechDraft(
        user_id=current_user.id,
        title="Guest Session Upload",
        raw_text=guest.text,
    )
    db.add(draft)
    await db.flush()

    session.draft_id = draft.id
    guest.migrated_session_id = session.id
    guest.migrated_at = datetime.now(timezone.utc)

    # 4. Transfer messages
    for idx, msg in enumerate(guest.messages):
        role_str = msg.get("role", "system")
        if role_str == "system":
            continue
        elif role_str == "assistant":
            mapped_role = MessageRole.assistant
        elif role_str == "user":
            mapped_role = MessageRole.user
        else:
            continue

        sim_message = SimulationMessage(
            session_id=session.id,
            role=mapped_role,
            content=msg.get("content", ""),
            turn_index=idx,
        )
        db.add(sim_message)

    await db.commit()

    return StartFromGuestResponse(id=session.id)


@router.get("/compare")
async def compare_sessions(
    request: Request,
    ids: str = Query(..., description="Comma-separated session UUIDs"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_ids = [uuid.UUID(sid.strip()) for sid in ids.split(",") if sid.strip()]
    if len(session_ids) < 2:
        raise HTTPException(status_code=422, detail="Нужно минимум 2 сессии для сравнения")

    result = await db.execute(
        select(SimulationSession)
        .options(selectinload(SimulationSession.skill_metrics))
        .where(
            SimulationSession.id.in_(session_ids),
            SimulationSession.user_id == current_user.id,
            SimulationSession.status == SessionStatus.completed,
        )
    )
    sessions = result.scalars().all()

    if len(sessions) < 2:
        raise HTTPException(status_code=422, detail="Недостаточно завершённых сессий для сравнения")

    comparison = []
    all_metrics = set()
    for s in sessions:
        metrics_map = {}
        for m in s.skill_metrics:
            metrics_map[m.metric_name] = m.score
            all_metrics.add(m.metric_name)
        comparison.append({
            "session_id": str(s.id),
            "created_at": s.created_at.isoformat(),
            "persona": (s.persona_config or {}).get("role", ""),
            "metrics": metrics_map,
        })

    metric_names = sorted(all_metrics)
    diffs = []
    if len(comparison) >= 2:
        latest = comparison[0]
        previous = comparison[-1]
        for metric in metric_names:
            curr = latest["metrics"].get(metric)
            prev = previous["metrics"].get(metric)
            if curr is not None and prev is not None:
                change = round(curr - prev, 3)
                diffs.append({"metric": metric, "previous": round(prev, 2), "current": round(curr, 2), "change": change})

    return {"sessions": comparison, "metric_names": metric_names, "diffs": diffs}


@router.get("/progress/narrative")
async def get_narrative_progress(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(SimulationSession)
        .options(selectinload(SimulationSession.skill_metrics))
        .where(
            SimulationSession.user_id == current_user.id,
            SimulationSession.status == SessionStatus.completed,
        )
        .order_by(SimulationSession.created_at.asc())
    )
    sessions = result.scalars().all()

    if not sessions:
        return {"total_sessions": 0, "trajectory": [], "summary": None}

    trajectory = []
    all_metrics = {}
    for s in sessions:
        metrics = {}
        for m in s.skill_metrics:
            metrics[m.metric_name] = round(m.score, 2)
            if m.metric_name not in all_metrics:
                all_metrics[m.metric_name] = []
            all_metrics[m.metric_name].append(m.score)

        trajectory.append({
            "session_id": str(s.id),
            "created_at": s.created_at.isoformat(),
            "metrics": metrics,
        })

    metric_trends = {}
    for metric, scores in all_metrics.items():
        if len(scores) >= 2:
            trend = "up" if scores[-1] > scores[0] else ("down" if scores[-1] < scores[0] else "stable")
        else:
            trend = "baseline"
        metric_trends[metric] = {
            "latest": round(scores[-1], 2),
            "average": round(sum(scores) / len(scores), 2),
            "trend": trend,
            "sessions_count": len(scores),
        }

    strongest = max(metric_trends.items(), key=lambda x: x[1]["latest"]) if metric_trends else (None, None)
    weakest = min(metric_trends.items(), key=lambda x: x[1]["latest"]) if metric_trends else (None, None)

    return {
        "total_sessions": len(sessions),
        "trajectory": trajectory,
        "metric_trends": metric_trends,
        "summary": {
            "strongest_skill": strongest[0],
            "strongest_score": strongest[1]["latest"] if strongest[1] else None,
            "weakest_skill": weakest[0],
            "weakest_score": weakest[1]["latest"] if weakest[1] else None,
        },
    }
