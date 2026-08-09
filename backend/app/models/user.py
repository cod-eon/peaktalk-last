import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Forward references to subscription models — imported at module level to allow
# SQLAlchemy to resolve relationships without circular import issues at runtime.
# The actual classes live in app.models.subscription.
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user_identity import UserIdentity
    from app.models.subscription import Payment, Subscription, UsageCounter


class UserSegment(str, enum.Enum):
    manager = "manager"
    head = "head"
    founder = "founder"
    customer_facing = "customer_facing"
    other = "other"


class UserGoal(str, enum.Enum):
    budget_defense = "budget_defense"
    pitch = "pitch"
    qbr = "qbr"
    stakeholder = "stakeholder"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Matches Supabase Auth user_id (sub claim)",
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    
    # Notification preferences
    notification_email_enabled: Mapped[bool] = mapped_column(default=True, server_default="true")
    notification_push_enabled: Mapped[bool] = mapped_column(default=True, server_default="true")

    # UTM tracking (first-touch attribution)
    utm_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_content: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_term: Mapped[str | None] = mapped_column(String(255), nullable=True)

    onboarding_profile: Mapped["OnboardingProfile | None"] = relationship(
        "OnboardingProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    identities: Mapped[list["UserIdentity"]] = relationship(
        "UserIdentity", back_populates="user", cascade="all, delete-orphan"
    )

    # Billing relationships
    subscription: Mapped["Subscription | None"] = relationship(
        "Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="user", cascade="all, delete-orphan",
        foreign_keys="Payment.user_id",
    )
    usage_counter: Mapped["UsageCounter | None"] = relationship(
        "UsageCounter", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
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
