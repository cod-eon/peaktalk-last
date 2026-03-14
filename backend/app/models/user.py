import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserSegment(str, enum.Enum):
    student = "student"
    junior = "junior"
    founder = "founder"
    manager = "manager"
    other = "other"


class UserGoal(str, enum.Enum):
    interview = "interview"
    pitch = "pitch"
    conference = "conference"
    defense = "defense"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Matches Supabase Auth user_id (sub claim)",
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    onboarding_profile: Mapped["OnboardingProfile | None"] = relationship(
        "OnboardingProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    segment: Mapped[UserSegment] = mapped_column(
        Enum(UserSegment, name="user_segment"), nullable=False
    )
    primary_goal: Mapped[UserGoal] = mapped_column(
        Enum(UserGoal, name="user_goal"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="onboarding_profile")
