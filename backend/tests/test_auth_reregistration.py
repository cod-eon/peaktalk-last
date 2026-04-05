import uuid
from types import SimpleNamespace

import pytest
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user
from app.models.user import OnboardingProfile, User, UserGoal, UserSegment


class _FakeSupabaseAuth:
    def __init__(self, user):
        self._user = user

    def get_user(self, _token: str):
        return SimpleNamespace(user=self._user)


class _FakeSupabaseClient:
    def __init__(self, user):
        self.auth = _FakeSupabaseAuth(user)


@pytest.mark.asyncio
async def test_reregistration_replaces_stale_local_user_without_supabase_created_at(
    db_session,
    monkeypatch,
) -> None:
    stale_user_id = uuid.uuid4()
    new_supabase_user_id = uuid.uuid4()
    email = "founder@peaktalk.io"

    await db_session.execute(delete(OnboardingProfile))
    await db_session.execute(delete(User))
    await db_session.commit()

    stale_user = User(id=stale_user_id, email=email)
    db_session.add(stale_user)
    await db_session.flush()

    db_session.add(
        OnboardingProfile(
            user_id=stale_user_id,
            segment=UserSegment.founder,
            primary_goal=UserGoal.pitch,
        )
    )
    await db_session.commit()

    supabase_user = SimpleNamespace(
        id=str(new_supabase_user_id),
        email=email,
        user_metadata={"email": email},
        created_at=None,
    )
    monkeypatch.setattr(
        "app.dependencies._get_supabase",
        lambda: _FakeSupabaseClient(supabase_user),
    )

    current_user = await get_current_user(
        credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-token"),
        db=db_session,
    )

    assert current_user.id == new_supabase_user_id
    assert current_user.email == email

    result = await db_session.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(User.email == email)
    )
    users = result.scalars().all()

    assert len(users) == 1
    assert users[0].id == new_supabase_user_id
    assert users[0].onboarding_profile is None