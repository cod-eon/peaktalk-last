import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserGoal, UserSegment


class OnboardingProfileResponse(BaseModel):
    segment: UserSegment
    primary_goal: UserGoal
    created_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    created_at: datetime
    onboarding_profile: OnboardingProfileResponse | None = None

    model_config = {"from_attributes": True}


class OnboardingProfileCreate(BaseModel):
    segment: UserSegment
    primary_goal: UserGoal
