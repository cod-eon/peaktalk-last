import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

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
    SimulationSessionResponse,
    SimulationStartRequest,
)
from app.services.gemini import GeminiError
from app.services.simulation_ai import evaluate_session, generate_question

router = APIRouter(prefix="/simulation", tags=["simulation"])


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

    try:
        turn = await generate_question(
            persona_config=body.persona_config.model_dump(),
            doc_text=doc_text,
            history=[],
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

    try:
        turn = await generate_question(
            persona_config=session.persona_config,
            doc_text=doc_text,
            history=history,
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

    doc_text = await _get_doc_text(db, session.document_id, session.draft_id)
    history = [{"role": m.role.value, "content": m.content} for m in session.messages]

    try:
        evaluation = await evaluate_session(doc_text=doc_text, messages=history)
    except GeminiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

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

    logger.info("Session completed user=%s session=%s metrics=%d", current_user.id, session_id, len(evaluation.metrics))
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
