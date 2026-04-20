import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.feedback import MeetingOutcome, PostMeetingFeedback
from app.models.simulation import SessionStatus, SimulationSession
from app.models.user import User

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/{session_id}", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: Request,
    session_id: uuid.UUID,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    session_res = await db.execute(
        select(SimulationSession).where(
            SimulationSession.id == session_id,
            SimulationSession.user_id == current_user.id,
        )
    )
    session = session_res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    if session.status != SessionStatus.completed:
        raise HTTPException(status_code=422, detail="Обратная связь доступна только для завершённых сессий")

    existing = await db.execute(
        select(PostMeetingFeedback).where(PostMeetingFeedback.session_id == session_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Обратная связь уже оставлена")

    if "outcome" not in body:
        raise HTTPException(status_code=422, detail="Поле outcome обязательно")

    try:
        outcome = MeetingOutcome(body["outcome"])
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Недопустимое значение outcome. Допустимые: {[e.value for e in MeetingOutcome]}")

    feedback = PostMeetingFeedback(
        session_id=session_id,
        user_id=current_user.id,
        outcome=outcome,
        what_helped=body.get("what_helped"),
        what_didnt=body.get("what_didnt"),
        notes=body.get("notes"),
        rating=body.get("rating"),
    )
    db.add(feedback)
    await db.flush()

    return {
        "id": str(feedback.id),
        "outcome": feedback.outcome.value,
        "created_at": feedback.created_at.isoformat(),
    }


@router.get("/{session_id}")
async def get_feedback(
    request: Request,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict | None:
    result = await db.execute(
        select(PostMeetingFeedback).where(
            PostMeetingFeedback.session_id == session_id,
            PostMeetingFeedback.user_id == current_user.id,
        )
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        return None

    return {
        "id": str(feedback.id),
        "session_id": str(feedback.session_id),
        "outcome": feedback.outcome.value,
        "what_helped": feedback.what_helped,
        "what_didnt": feedback.what_didnt,
        "notes": feedback.notes,
        "rating": feedback.rating,
        "created_at": feedback.created_at.isoformat(),
    }
