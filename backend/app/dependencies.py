import logging
import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.user_identity import UserIdentity
from app.services.better_auth import (
    BetterAuthError,
    BetterAuthProfile,
    get_better_auth_profile,
    validate_unsafe_request_origin,
)

logger = logging.getLogger("peaktalk.auth")


def _credentials_exception(code: str = "authentication_required") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": code, "message": "Authentication required."},
    )


async def _resolve_better_auth_user(profile: BetterAuthProfile, db: AsyncSession) -> User:
    result = await db.execute(
        select(UserIdentity)
        .options(selectinload(UserIdentity.user).selectinload(User.onboarding_profile))
        .where(UserIdentity.provider == "better-auth", UserIdentity.subject == profile.subject)
    )
    identity = result.scalar_one_or_none()
    if identity is not None:
        if identity.email != profile.email:
            identity.email = profile.email
        return identity.user

    # Decision 0017 established an empty local identity inventory. Do not email-link:
    # a new verified Better Auth subject always receives a new PeakTalk UUID.
    user = User(id=uuid.uuid4(), email=profile.email)
    db.add(user)
    await db.flush()
    db.add(UserIdentity(user_id=user.id, provider="better-auth", subject=profile.subject, email=profile.email))
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        result = await db.execute(
            select(UserIdentity)
            .options(selectinload(UserIdentity.user).selectinload(User.onboarding_profile))
            .where(UserIdentity.provider == "better-auth", UserIdentity.subject == profile.subject)
        )
        identity = result.scalar_one_or_none()
        if identity is None:
            logger.warning("auth_rejected category=identity_provisioning_race")
            raise _credentials_exception("identity_provisioning_failed") from exc
        return identity.user
    return user


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    try:
        validate_unsafe_request_origin(request)
        profile = await get_better_auth_profile(request.headers.get("cookie"))
    except BetterAuthError as exc:
        logger.warning("auth_rejected category=%s", exc.code)
        if exc.code == "email_verification_required":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": exc.code, "message": "Email verification required."},
            )
        raise _credentials_exception(exc.code)
    return await _resolve_better_auth_user(profile, db)
