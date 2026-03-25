import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.limiter import limiter

logger = logging.getLogger("peaktalk.simulation")
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.document import Document
from app.models.draft import SpeechDraft
from app.models.simulation import MessageRole, SessionStatus, SimulationMessage, SimulationSession, SkillMetric
from app.models.user import User
from app.schemas.simulation import (
    SendMessageRequest,
    SendMessageResponse,
    SimulationSessionListItem,
    SimulationSessionListResponse,
    SimulationSessionResponse,
    SimulationStartRequest,
)
from app.services.gemini import GeminiError
from app.services.simulation_ai import evaluate_session, generate_question

router = APIRouter(prefix="/simulation", tags=["simulation"])

MAX_TURNS = 10  # Maximum AI questions per session


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.get("", response_model=SimulationSessionListResponse)
async def list_sessions(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSessionListResponse:
    from sqlalchemy import func as sqlfunc
    from app.models.simulation import SkillMetric

    total_res = await db.execute(
        select(sqlfunc.count()).select_from(SimulationSession)
        .where(SimulationSession.user_id == current_user.id)
    )
    total = total_res.scalar_one()

    res = await db.execute(
        select(SimulationSession)
        .options(selectinload(SimulationSession.messages), selectinload(SimulationSession.skill_metrics))
        .where(SimulationSession.user_id == current_user.id)
        .order_by(SimulationSession.created_at.desc())
        .limit(limit).offset(offset)
    )
    sessions = list(res.scalars().all())

    items = []
    for s in sessions:
        scores = [m.score for m in s.skill_metrics] if s.skill_metrics else []
        items.append(SimulationSessionListItem(
            id=s.id,
            persona_config=s.persona_config,
            status=s.status,
            created_at=s.created_at,
            completed_at=s.completed_at,
            message_count=len(s.messages),
            avg_score=round(sum(scores) / len(scores), 2) if scores else None,
        ))

    return SimulationSessionListResponse(items=items, total=total)


@router.get("/personas")
async def get_personas(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict:
    from app.services.simulation_ai import get_available_personas, get_default_difficulty, get_industries_for_segment
    profile = current_user.onboarding_profile
    segment = profile.segment.value if profile else None
    return {
        "segment": segment or "other",
        "default_difficulty": get_default_difficulty(segment),
        "personas": get_available_personas(segment),
        "industries": get_industries_for_segment(segment),
    }


@router.post("/start", response_model=SimulationSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def start_simulation(
    request: Request,
    body: SimulationStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSession:
    doc_text = await _get_doc_text(db, body.document_id, body.draft_id, current_user.id) if (body.document_id or body.draft_id) else ""

    session = SimulationSession(
        user_id=current_user.id,
        document_id=body.document_id,
        draft_id=body.draft_id,
        persona_config=body.persona_config.model_dump(),
        status=SessionStatus.active,
    )
    db.add(session)
    await db.flush()

    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None

    try:
        turn = await generate_question(
            persona_config=body.persona_config.model_dump(),
            doc_text=doc_text,
            history=[],
            user_context=user_context,
        )
    except GeminiError as exc:
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

    logger.info("Simulation started user=%s session=%s persona=%s", current_user.id, session.id, body.persona_config.role)
    return await _load_session(db, session.id, current_user.id)


@router.post("/{session_id}/message", response_model=SendMessageResponse)
@limiter.limit("15/minute")
async def send_message(
    request: Request,
    session_id: uuid.UUID,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SendMessageResponse:
    session = await _load_session(db, session_id, current_user.id)

    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Session is {session.status.value}, not active",
        )

    next_turn_index = len(session.messages)

    user_msg = SimulationMessage(
        session_id=session.id,
        role=MessageRole.user,
        content=body.content,
        turn_index=next_turn_index,
    )
    db.add(user_msg)
    await db.flush()

    doc_text = await _get_doc_text(db, session.document_id, session.draft_id)

    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in session.messages
    ] + [{"role": "user", "content": body.content}]

    # Count AI messages already asked (before this user answer)
    ai_turn_count = sum(1 for m in session.messages if m.role == MessageRole.assistant)

    # Auto-complete when MAX_TURNS questions have been asked and answered
    if ai_turn_count >= MAX_TURNS:
        try:
            await _finalize_session(session, db)
        except GeminiError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        await db.refresh(user_msg)
        logger.info("Session auto-completed at MAX_TURNS=%d session=%s", MAX_TURNS, session_id)
        return SendMessageResponse(user_message=user_msg, assistant_message=None, session_completed=True)

    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None

    try:
        turn = await generate_question(
            persona_config=session.persona_config,
            doc_text=doc_text,
            history=history,
            user_context=user_context,
        )
    except GeminiError as exc:
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
    doc_text = await _get_doc_text(db, session.document_id, session.draft_id)
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSession:
    session = await _load_session(db, session_id, current_user.id)

    if session.status != SessionStatus.active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Session already {session.status.value}",
        )

    user_messages = [m for m in session.messages if m.role == MessageRole.user]
    if not user_messages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot complete session with no answers from user",
        )

    try:
        await _finalize_session(session, db)
    except GeminiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    logger.info("Session completed by user user=%s session=%s", current_user.id, session_id)
    return await _load_session(db, session.id, current_user.id, populate_existing=True)


@router.get("/{session_id}/report", response_model=SimulationSessionResponse)
async def get_report(
    request: Request,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SimulationSession:
    session = await _load_session(db, session_id, current_user.id)
    if session.status != SessionStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Report is only available after session is completed",
        )
    return session


@router.post("/{session_id}/abandon", status_code=status.HTTP_204_NO_CONTENT)
async def abandon_session(
    request: Request,
    session_id: uuid.UUID,
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

    if user_messages:
        try:
            await _finalize_session(session, db)
        except GeminiError:
            # Evaluation failed — at least mark cancelled to avoid orphan active session
            session.status = SessionStatus.cancelled
            session.completed_at = datetime.now(timezone.utc)
            await db.flush()
    else:
        session.status = SessionStatus.cancelled
        session.completed_at = datetime.now(timezone.utc)
        await db.flush()

    await db.commit()
    logger.info(
        "Session abandoned user=%s session=%s had_answers=%s final_status=%s",
        current_user.id, session_id, bool(user_messages), session.status.value,
    )
