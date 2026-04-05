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

    from sqlalchemy import or_
    result = await db.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(or_(User.id == user_id, User.email == email))
    )
    user = result.scalar_one_or_none()

    # Re-registration detection: if Supabase returns a different UUID for the same
    # email, or a clearly newer account timestamp, the old local row is stale and
    # must be wiped so onboarding starts from a clean state.
    if user is not None:
        is_new_uuid = user.id != user_id
        is_newer_sb = False

        if sb_created_at is not None:
            local_created = user.created_at
            if local_created.tzinfo is None:
                local_created = local_created.replace(tzinfo=timezone.utc)
            is_newer_sb = sb_created_at > local_created + timedelta(seconds=60)

        if is_new_uuid or is_newer_sb:
            reason = "new UUID" if is_new_uuid else "newer account"
            logger.info(
                "auth: stale data detected for email=%s (reason: %s) — wiping local record",
                email,
                reason,
            )
            await db.delete(user)
            await db.commit()
            user = None

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
            # This block is now mostly for race conditions during provisioning
            result = await db.execute(
                select(User)
                .options(selectinload(User.onboarding_profile))
                .where(or_(User.id == user_id, User.email == email))
            )
            user = result.scalar_one_or_none()
            if user is None:
                logger.error("auth: user not found after provision failure, user_id=%s email=%s", user_id, email)
                raise credentials_exception
            
            # If we STILL have a record but different UUID here, it means deletion failed
            # or it's a very specific race. We just log and use it.
            if user.id != user_id:
                logger.info("auth: using existing user %s for new supabase user %s", user.id, user_id)

    return user
