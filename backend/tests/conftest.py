import os
import uuid
from collections.abc import AsyncGenerator

# Set test environment variables BEFORE importing any app modules
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.dependencies import get_current_user
from app.main import app
# Rate limiting is bypassed in tests via APP_ENV=test in the key_func
# (see app/limiter.py — each request gets a unique UUID key).
from app.models.user import User

TEST_ENGINE = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestSessionLocal = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)

TEST_USER_ID = uuid.uuid4()
TEST_USER_EMAIL = "test@peaktalk.io"


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def override_get_current_user() -> User:
    async with TestSessionLocal() as session:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        result = await session.execute(
            select(User)
            .options(selectinload(User.onboarding_profile))
            .where(User.id == TEST_USER_ID)
        )
        user = result.scalar_one_or_none()
        if user is None:
            user = User(id=TEST_USER_ID, email=TEST_USER_EMAIL)
            session.add(user)
            await session.commit()
            await session.refresh(user)
        return user


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
