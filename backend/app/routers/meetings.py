import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.meeting import MeetingStatus, UpcomingMeeting
from app.models.scenario import Scenario
from app.models.simulation import SimulationSession, SessionStatus
from app.models.user import User

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=list)
async def list_meetings(
    request: Request,
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    stmt = select(UpcomingMeeting).where(UpcomingMeeting.user_id == current_user.id)
    if status_filter:
        try:
            ms = MeetingStatus(status_filter)
            stmt = stmt.where(UpcomingMeeting.status == ms)
        except ValueError:
            pass
    stmt = stmt.order_by(UpcomingMeeting.meeting_date.asc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    meetings = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "title": m.title,
            "description": m.description,
            "meeting_date": m.meeting_date.isoformat(),
            "meeting_type": m.meeting_type,
            "scenario_id": str(m.scenario_id) if m.scenario_id else None,
            "simulation_session_id": str(m.simulation_session_id) if m.simulation_session_id else None,
            "status": m.status.value,
            "reminder_sent": m.reminder_sent,
            "created_at": m.created_at.isoformat(),
        }
        for m in meetings
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meeting(
    request: Request,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    required = ["title", "meeting_date"]
    for f in required:
        if f not in body:
            raise HTTPException(status_code=422, detail=f"Missing field: {f}")

    try:
        meeting_date = datetime.fromisoformat(body["meeting_date"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Invalid meeting_date format")

    meeting = UpcomingMeeting(
        user_id=current_user.id,
        title=body["title"][:256],
        description=body.get("description"),
        meeting_date=meeting_date,
        meeting_type=body.get("meeting_type", "other"),
        scenario_id=uuid.UUID(body["scenario_id"]) if body.get("scenario_id") else None,
    )
    db.add(meeting)
    await db.flush()

    return {
        "id": str(meeting.id),
        "title": meeting.title,
        "meeting_date": meeting.meeting_date.isoformat(),
        "status": meeting.status.value,
    }


@router.patch("/{meeting_id}")
async def update_meeting(
    request: Request,
    meeting_id: uuid.UUID,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(UpcomingMeeting).where(
            UpcomingMeeting.id == meeting_id,
            UpcomingMeeting.user_id == current_user.id,
        )
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Встреча не найдена")

    for field in ("title", "description", "meeting_type"):
        if field in body:
            setattr(meeting, field, body[field])

    if "meeting_date" in body:
        try:
            meeting.meeting_date = datetime.fromisoformat(body["meeting_date"])
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="Invalid meeting_date")

    if "status" in body:
        try:
            meeting.status = MeetingStatus(body["status"])
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid status")

    if "scenario_id" in body:
        meeting.scenario_id = uuid.UUID(body["scenario_id"]) if body["scenario_id"] else None

    await db.flush()
    return {"id": str(meeting.id), "status": meeting.status.value}


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    request: Request,
    meeting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(UpcomingMeeting).where(
            UpcomingMeeting.id == meeting_id,
            UpcomingMeeting.user_id == current_user.id,
        )
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Встреча не найдена")
    await db.delete(meeting)


# Mapping from meeting_type to suggested system persona role
_MEETING_TYPE_TO_PERSONA: dict[str, str] = {
    "budget_defense": "investor",
    "qbr": "client_meeting",
    "pitch": "investor",
    "client_meeting": "client_meeting",
    "roadmap_review": "tech_lead",
    "other": "audience",
}


@router.post("/{meeting_id}/prepare-simulation")
async def prepare_simulation_from_meeting(
    request: Request,
    meeting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Prepare a simulation suggestion based on an upcoming meeting.

    Returns the existing session if it is still active, otherwise returns a
    suggested persona role mapped from the meeting type.
    """
    result = await db.execute(
        select(UpcomingMeeting).where(
            UpcomingMeeting.id == meeting_id,
            UpcomingMeeting.user_id == current_user.id,
        )
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Встреча не найдена")

    # If a simulation session is already linked, check its status
    if meeting.simulation_session_id:
        session_res = await db.execute(
            select(SimulationSession).where(SimulationSession.id == meeting.simulation_session_id)
        )
        linked_session = session_res.scalar_one_or_none()
        if linked_session and linked_session.status == SessionStatus.active:
            return {
                "existing_session_id": str(linked_session.id),
                "status": "active",
            }

    # Map meeting_type to a suggested persona role
    suggested_role = _MEETING_TYPE_TO_PERSONA.get(meeting.meeting_type, "audience")

    return {
        "suggested_role": suggested_role,
        "meeting_title": meeting.title,
        "meeting_id": str(meeting.id),
        "status": "ready",
    }


@router.get("/upcoming/reminders")
async def get_pending_reminders(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    now = datetime.now(timezone.utc)
    stmt = (
        select(UpcomingMeeting)
        .where(
            UpcomingMeeting.user_id == current_user.id,
            UpcomingMeeting.status == MeetingStatus.upcoming,
            UpcomingMeeting.reminder_sent.is_(False),
            UpcomingMeeting.meeting_date > now,
        )
        .order_by(UpcomingMeeting.meeting_date.asc())
    )
    result = await db.execute(stmt)
    meetings = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "title": m.title,
            "meeting_date": m.meeting_date.isoformat(),
            "meeting_type": m.meeting_type,
            "scenario_id": str(m.scenario_id) if m.scenario_id else None,
        }
        for m in meetings
    ]
