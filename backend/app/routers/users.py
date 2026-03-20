import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import _get_supabase, get_current_user
from app.models.user import OnboardingProfile, User
from app.schemas.user import OnboardingProfileCreate, UserResponse

logger = logging.getLogger("peaktalk.users")

router = APIRouter(prefix="/me", tags=["users"])


@router.get("", response_model=UserResponse)
async def get_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(User.id == current_user.id)
    )
    return result.scalar_one()


@router.post("/onboarding", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def save_onboarding(
    request: Request,
    body: OnboardingProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(
        select(OnboardingProfile).where(OnboardingProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = OnboardingProfile(
            user_id=current_user.id,
            segment=body.segment,
            primary_goal=body.primary_goal,
        )
        db.add(profile)
    else:
        profile.segment = body.segment
        profile.primary_goal = body.primary_goal

    await db.flush()

    result = await db.execute(
        select(User)
        .options(selectinload(User.onboarding_profile))
        .where(User.id == current_user.id)
    )
    return result.scalar_one()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    user_id = str(current_user.id)

    # Delete from Supabase Auth first (best-effort)
    try:
        _get_supabase().auth.admin.delete_user(user_id)
        logger.info("delete_me: supabase user deleted user_id=%s", user_id)
    except Exception as exc:
        logger.warning("delete_me: supabase delete failed user_id=%s: %s", user_id, exc)

    # Delete from local DB — cascade handles all child tables
    await db.delete(current_user)
    await db.flush()
    logger.info("delete_me: local user deleted user_id=%s", user_id)
