import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from supabase import create_client

from app.config import settings
from app.database import get_db
from app.models.user import User

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
            raise credentials_exception
        user_id = uuid.UUID(sb_user.id)
        email: str | None = sb_user.email
    except Exception:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-provision user on first authenticated request
        if not email:
            raise credentials_exception
        try:
            user = User(id=user_id, email=email)
            db.add(user)
            await db.flush()
            await db.refresh(user)
        except Exception:
            await db.rollback()
            # Another concurrent request already created the user — just fetch it
            result = await db.execute(
                select(User)
                .options(selectinload(User.onboarding_profile))
                .where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            if user is None:
                raise credentials_exception

    return user
