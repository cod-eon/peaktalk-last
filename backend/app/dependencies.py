import logging
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from supabase import create_client

from app.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger("peaktalk.auth")

bearer_scheme = HTTPBearer()

_supabase_client = None


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        response = _get_supabase().auth.get_user(token)
        sb_user = response.user
        if sb_user is None:
            logger.warning("auth: get_user returned None")
            raise credentials_exception
        user_id = uuid.UUID(sb_user.id)
        # For OAuth users email may live in user_metadata if top-level is None
        email: str | None = sb_user.email or (sb_user.user_metadata or {}).get("email")
        logger.debug("auth: sb_user id=%s email=%s", user_id, email)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("auth: get_user failed: %s", exc, exc_info=True)
        raise credentials_exception

    # Parse Supabase account creation time for re-registration detection
    sb_created_at: datetime | None = None
    try:
        raw = sb_user.created_at
        if isinstance(raw, str):
            sb_created_at = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        elif isinstance(raw, datetime):
            sb_created_at = raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    except Exception:
        pass

    result = await db.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    # Re-registration detection: if the Supabase account was created AFTER our local
    # user record, the user was deleted from Supabase and signed up again.
    # Delete stale local data so they get a clean slate (onboarding, etc.).
    if user is not None and sb_created_at is not None:
        local_created = user.created_at
        if local_created.tzinfo is None:
            local_created = local_created.replace(tzinfo=timezone.utc)
        if sb_created_at > local_created + timedelta(seconds=60):
            logger.info(
                "auth: re-registration detected for user_id=%s (sb=%s local=%s) — wiping stale data",
                user_id, sb_created_at, local_created,
            )
            await db.delete(user)
            await db.flush()
            user = None  # will be provisioned fresh below

    if user is None:
        # Auto-provision user on first authenticated request
        if not email:
            logger.warning("auth: no email for user_id=%s, cannot provision", user_id)
            raise credentials_exception
        try:
            user = User(id=user_id, email=email)
            db.add(user)
            await db.flush()
            await db.refresh(user)
            logger.info("auth: provisioned new user id=%s email=%s", user_id, email)
        except Exception as exc:
            logger.warning("auth: provision failed (race/conflict): %s", exc)
            await db.rollback()
            # Fallback 1: same UUID (concurrent request created the user)
            # Fallback 2: same email but different UUID (OAuth account not yet linked in Supabase)
            from sqlalchemy import or_
            result = await db.execute(
                select(User)
                .options(selectinload(User.onboarding_profile))
                .where(or_(User.id == user_id, User.email == email))
            )
            user = result.scalar_one_or_none()
            if user is None:
                logger.error("auth: user not found after rollback, user_id=%s email=%s", user_id, email)
                raise credentials_exception
            # If UUID mismatch (different OAuth provider / re-registration via Google),
            # do NOT attempt UPDATE users SET id=... — child tables reference users.id
            # without ON UPDATE CASCADE, so that would raise ForeignKeyViolationError.
            # The user is authenticated correctly using their existing record.
            if user.id != user_id:
                logger.info(
                    "auth: UUID mismatch for email=%s — local=%s supabase=%s; "
                    "keeping local UUID to avoid FK violation",
                    email, user.id, user_id,
                )

    return user
