"""Pydantic v2 schemas for the admin panel API."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.subscription import PlanType, SubscriptionStatus, PaymentStatus


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------


class AdminStatsResponse(BaseModel):
    users_total: int
    users_pro: int
    users_starter: int
    simulations_total: int
    simulations_today: int
    payments_total_rub: Decimal
    payments_this_month_rub: Decimal
    payments_count_total: int
    active_subs_count: int


# ---------------------------------------------------------------------------
# Charts (time-series)
# ---------------------------------------------------------------------------


class DayPoint(BaseModel):
    date: str   # ISO date "YYYY-MM-DD"
    value: float


class AdminChartsResponse(BaseModel):
    revenue_by_day: list[DayPoint]
    simulations_by_day: list[DayPoint]
    users_by_day: list[DayPoint]


# ---------------------------------------------------------------------------
# User list
# ---------------------------------------------------------------------------


class AdminUserItem(BaseModel):
    """Single user entry returned by the paginated user list."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    created_at: datetime
    plan: PlanType
    subscription_status: SubscriptionStatus
    period_end: datetime | None
    simulations_used: int
    documents_uploaded: int
    simulations_total: int


class AdminUsersResponse(BaseModel):
    items: list[AdminUserItem]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# User detail
# ---------------------------------------------------------------------------


class AdminUserDetail(BaseModel):
    """Full user record with subscription, counters, and payment summary."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    created_at: datetime

    # Subscription
    plan: PlanType
    subscription_status: SubscriptionStatus
    period_start: datetime | None
    period_end: datetime | None
    subscription_created_at: datetime | None
    cancelled_at: datetime | None

    # Usage
    simulations_used: int
    documents_uploaded: int
    simulations_total: int

    # Payments summary
    payments_count: int
    payments_total_rub: Decimal


# ---------------------------------------------------------------------------
# Set-plan
# ---------------------------------------------------------------------------


class SetPlanRequest(BaseModel):
    plan: PlanType = Field(..., description="Target plan: starter, pro, or team")
    period_days: int | None = Field(
        30,
        ge=1,
        description="How many days the plan stays active. None = indefinite.",
    )


class SetPlanResponse(BaseModel):
    model_config = {"from_attributes": True}

    user_id: uuid.UUID
    plan: PlanType
    status: SubscriptionStatus
    period_start: datetime
    period_end: datetime | None


# ---------------------------------------------------------------------------
# Payments (admin)
# ---------------------------------------------------------------------------


class AdminPaymentItem(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    description: str | None
    yookassa_payment_id: str
    created_at: datetime


class AdminPaymentsResponse(BaseModel):
    items: list[AdminPaymentItem]
    total: int
    page: int
    per_page: int


# ---------------------------------------------------------------------------
# Subscriptions (admin)
# ---------------------------------------------------------------------------


class AdminSubscriptionItem(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    plan: PlanType
    status: SubscriptionStatus
    period_start: datetime
    period_end: datetime | None
    cancelled_at: datetime | None
    created_at: datetime


class AdminSubscriptionsResponse(BaseModel):
    items: list[AdminSubscriptionItem]
    total: int
    page: int
    per_page: int
