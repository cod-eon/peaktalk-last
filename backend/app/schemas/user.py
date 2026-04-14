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
    notification_email_enabled: bool
    notification_push_enabled: bool
    onboarding_profile: OnboardingProfileResponse | None = None

    model_config = {"from_attributes": True}


class OnboardingProfileCreate(BaseModel):
    segment: UserSegment
    primary_goal: UserGoal


class UserUpdate(BaseModel):
    notification_email_enabled: bool | None = None
    notification_push_enabled: bool | None = None
