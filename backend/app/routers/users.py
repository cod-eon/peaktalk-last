from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import OnboardingProfile, User
from app.schemas.user import OnboardingProfileCreate, UserResponse

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
