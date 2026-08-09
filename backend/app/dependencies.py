import logging
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.user_identity import UserIdentity
from app.services.logto_auth import LogtoAuthError, validate_access_token

logger = logging.getLogger("peaktalk.auth")

bearer_scheme = HTTPBearer()


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def _get_logto_user(
    token: str,
    db: AsyncSession,
    credentials_exception: HTTPException,
) -> User:
    try:
        profile = await validate_access_token(token)
    except LogtoAuthError as exc:
        logger.warning("auth: Logto token rejected: %s", exc)
        raise credentials_exception

    profile_email = profile.email.strip().lower()

    result = await db.execute(
        select(UserIdentity)
        .options(selectinload(UserIdentity.user).selectinload(User.onboarding_profile))
        .where(
            UserIdentity.provider == "logto",
            UserIdentity.subject == profile.subject,
        )
    )
    identity = result.scalar_one_or_none()
    if identity is not None:
        if identity.email != profile_email:
            identity.email = profile_email
        return identity.user

    # Email linking is allowed only after Logto's userinfo endpoint has
    # confirmed email_verified=true. Never link an unverified account by email.
    result = await db.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(func.lower(User.email) == profile_email)
    )
    user = result.scalar_one_or_none()
    if user is None:
        user = User(id=uuid.uuid4(), email=profile_email)
        db.add(user)
        await db.flush()

    db.add(
        UserIdentity(
            user_id=user.id,
            provider="logto",
            subject=profile.subject,
            email=profile_email,
        )
    )
    try:
        await db.flush()
    except IntegrityError as exc:
        # A concurrent first request may have created the same identity. Do
        # not leave a partially-created local user in the transaction.
        await db.rollback()
        result = await db.execute(
            select(UserIdentity)
            .options(selectinload(UserIdentity.user).selectinload(User.onboarding_profile))
            .where(
                UserIdentity.provider == "logto",
                UserIdentity.subject == profile.subject,
            )
        )
        identity = result.scalar_one_or_none()
        if identity is None:
            logger.warning("auth: Logto identity provisioning race failed: %s", type(exc).__name__)
            raise credentials_exception
        return identity.user

    return user


async def get_user_from_token(token: str, db: AsyncSession) -> User:
    """Validate one Logto bearer token and resolve its local PeakTalk user."""

    return await _get_logto_user(token, db, _credentials_exception())


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await get_user_from_token(credentials.credentials, db)
