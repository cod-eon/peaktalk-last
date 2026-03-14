import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer()


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
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
        email: str | None = payload.get("email")
    except (JWTError, ValueError):
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
        user = User(id=user_id, email=email)
        db.add(user)
        await db.flush()
        await db.refresh(user)

    return user
