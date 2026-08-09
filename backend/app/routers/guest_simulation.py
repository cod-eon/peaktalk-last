"""Guest simulation endpoints — no authentication required.

Allows unauthenticated users to run a short pressure scan against a meeting case.
After the free guest turns the response carries a paywall payload directing the user
to either buy a Defense Brief (299 ₽) or register to preserve the meeting material.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.limiter import limiter
from app.models.guest import GuestSession
from app.services.cloud_ru_ai import CloudRuAIError
from app.services.simulation_ai import generate_question

logger = logging.getLogger("peaktalk.guest_simulation")

router = APIRouter(prefix="/simulation", tags=["guest-simulation"])

# --------------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------------- #

GUEST_MAX_TURNS = 3
GUEST_SESSION_TTL_HOURS = 24

ALLOWED_PERSONAS = frozenset(
    ["cfo", "investor", "board_member", "client", "hr", "tech_lead", "ceo"]
)

PERSONA_ALIASES = {
    "board": "board_member",
    "board member": "board_member",
    "совет директоров": "board_member",
    "клиент": "client",
    "руководитель": "cfo",
    "финансовый директор": "cfo",
    "инвестор": "investor",
    "техлид": "tech_lead",
    "journalist": "board_member",
    "журналист": "board_member",
    "пресс-конференция": "board_member",
}

_PAYWALL_RESPONSE = {
    "message": "Быстрый pressure scan по материалу завершён",
    "cta_primary": {
        "text": "Собрать Defense Brief — 299 ₽",
        "action": "pay_per_session",
    },
    "cta_secondary": {
        "text": "Сохранить материал встречи и вернуться позже",
        "action": "register",
    },
}

# --------------------------------------------------------------------------- #
# Request / Response schemas
# --------------------------------------------------------------------------- #


class GuestStartRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)
    persona: str = Field(..., min_length=1, max_length=64)
    difficulty: int = Field(..., ge=1, le=5)

    @field_validator("persona")
    @classmethod
    def persona_must_be_allowed(cls, v: str) -> str:
        normalized = v.strip().lower().replace("-", "_")
        normalized = PERSONA_ALIASES.get(normalized, normalized)
        if normalized not in ALLOWED_PERSONAS:
            raise ValueError(
                f"persona must be one of: {', '.join(sorted(ALLOWED_PERSONAS))}"
            )
        return normalized


class GuestStartResponse(BaseModel):
    guest_session_id: str
    expires_at: str
    first_question: str
    turn: int
    max_turns: int
    remaining_turns: int


class GuestMessageRequest(BaseModel):
    guest_session_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1, max_length=8000)


class GuestMessageResponse(BaseModel):
    question: str | None
    turn: int
    max_turns: int
    remaining_turns: int
    limit_reached: bool
    paywall: dict | None


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


def _persona_config(persona: str, difficulty: int) -> dict:
    """Build a minimal persona_config dict compatible with generate_question()."""
    return {
        "role": persona,
        "difficulty": difficulty,
        "industry": "общий контекст",
    }


async def _load_guest_session(
    db: AsyncSession, session_token: str
) -> GuestSession:
    """Fetch a non-expired guest session or raise 404/410."""
    result = await db.execute(
        select(GuestSession).where(GuestSession.session_token == session_token)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Гостевая сессия не найдена.", "code": "guest_session_not_found"},
        )
    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"detail": "Гостевая сессия истекла.", "code": "guest_session_expired"},
        )
    return session


# --------------------------------------------------------------------------- #
# POST /simulation/guest-start
# --------------------------------------------------------------------------- #


@router.post(
    "/guest-start",
    response_model=GuestStartResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/hour")
async def guest_start(
    request: Request,
    body: GuestStartRequest,
    db: AsyncSession = Depends(get_db),
) -> GuestStartResponse:
    """Create a new guest session and return the first AI question."""
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=GUEST_SESSION_TTL_HOURS)
    session_token = str(uuid.uuid4())

    persona_config = _persona_config(body.persona, body.difficulty)

    try:
        turn = await generate_question(
            persona_config=persona_config,
            doc_text=body.text,
            history=[],
            user_context=None,
        )
    except CloudRuAIError as exc:
        logger.error("guest_start: Cloud.ru error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"detail": str(exc), "code": "ai_error"},
        ) from exc

    # Persist first AI question into messages history immediately so that
    # the follow-up endpoint can reconstruct context correctly.
    initial_messages = [{"role": "assistant", "content": turn.question}]

    session = GuestSession(
        session_token=session_token,
        text=body.text,
        persona=body.persona,
        difficulty=body.difficulty,
        messages=initial_messages,
        turn_count=1,
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()

    logger.info(
        "guest_start: session_id=%s persona=%s difficulty=%d",
        session.id,
        body.persona,
        body.difficulty,
    )

    return GuestStartResponse(
        guest_session_id=session_token,
        expires_at=expires_at.isoformat(),
        first_question=turn.question,
        turn=1,
        max_turns=GUEST_MAX_TURNS,
        remaining_turns=GUEST_MAX_TURNS - 1,
    )


# --------------------------------------------------------------------------- #
# POST /simulation/guest-message
# --------------------------------------------------------------------------- #


@router.post("/guest-message", response_model=GuestMessageResponse)
@limiter.limit("20/hour")
async def guest_message(
    request: Request,
    body: GuestMessageRequest,
    db: AsyncSession = Depends(get_db),
) -> GuestMessageResponse:
    """Submit an answer and receive the next AI question (or paywall when limit reached)."""
    session = await _load_guest_session(db, body.guest_session_id)

    current_turn = session.turn_count  # number of AI questions already asked

    # If all free AI questions were already asked, accept the answer to the
    # final question once and return paywall without burning another AI call.
    if current_turn >= GUEST_MAX_TURNS:
        updated_messages: list[dict] = list(session.messages)
        if not updated_messages or updated_messages[-1].get("role") != "user":
            updated_messages.append({"role": "user", "content": body.content})
            session.messages = updated_messages
            await db.flush()

        return GuestMessageResponse(
            question=None,
            turn=current_turn,
            max_turns=GUEST_MAX_TURNS,
            remaining_turns=0,
            limit_reached=True,
            paywall=_PAYWALL_RESPONSE,
        )

    # Append user answer to history
    updated_messages: list[dict] = list(session.messages) + [
        {"role": "user", "content": body.content}
    ]

    new_turn = current_turn + 1  # this will be the turn number after we respond

    # Still within limit — generate the next question
    persona_config = _persona_config(session.persona, session.difficulty)

    try:
        ai_turn = await generate_question(
            persona_config=persona_config,
            doc_text=session.text,
            history=updated_messages,
            user_context=None,
        )
    except CloudRuAIError as exc:
        logger.error("guest_message: Cloud.ru error session_id=%s: %s", session.id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"detail": str(exc), "code": "ai_error"},
        ) from exc

    # Append AI question to history and persist
    updated_messages.append({"role": "assistant", "content": ai_turn.question})
    session.messages = updated_messages
    session.turn_count = new_turn
    await db.flush()

    remaining = GUEST_MAX_TURNS - new_turn

    logger.info(
        "guest_message: session_id=%s turn=%d remaining=%d",
        session.id,
        new_turn,
        remaining,
    )

    return GuestMessageResponse(
        question=ai_turn.question,
        turn=new_turn,
        max_turns=GUEST_MAX_TURNS,
        remaining_turns=remaining,
        limit_reached=False,
        paywall=None,
    )
