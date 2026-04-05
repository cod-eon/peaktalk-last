"""Pydantic v2 schemas for billing and subscriptions."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, HttpUrl

from app.models.subscription import PaymentStatus, PlanType, SubscriptionStatus


class PlanLimits(BaseModel):
    simulations_per_month: int | None  # None = unlimited
    documents_total: int | None        # None = unlimited
    personas_allowed: list[str] | None  # None = all personas
    pdf_reports: bool


class PlanInfo(BaseModel):
    plan: PlanType
    name: str
    price_rub: int
    limits: PlanLimits


class SubscriptionResponse(BaseModel):
    model_config = {"from_attributes": True}

    plan: PlanType
    status: SubscriptionStatus
    period_end: datetime | None


class UsageStats(BaseModel):
    simulations_used: int
    documents_uploaded: int
    period_start: datetime


class BillingStatusResponse(BaseModel):
    subscription: SubscriptionResponse
    usage: UsageStats
    limits: PlanLimits
    can_start_simulation: bool
    can_upload_document: bool
    payments_enabled: bool = True


class PaymentMethodSummaryResponse(BaseModel):
    is_bound: bool
    type: str | None = None
    display_label: str | None = None
    auto_renew_enabled: bool = False


class CreatePaymentRequest(BaseModel):
    plan: PlanType = Field(..., description="Target plan: pro or team")
    return_url: str = Field(..., description="URL to redirect after payment")


class CreatePaymentResponse(BaseModel):
    payment_url: str
    payment_id: str


class PaymentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    description: str | None
    created_at: datetime


class TestSetPlanRequest(BaseModel):
    plan: PlanType = Field(..., description="Plan to set: starter, pro, or team")
    period_days: int | None = Field(
        None,
        description=(
            "Days until period_end (pro/team). Defaults to 30. Ignored for starter. "
            "Negative value = already expired by that many days ago."
        ),
        ge=-365,
        le=365,
    )


class YookassaWebhookEvent(BaseModel):
    """YooKassa webhook event envelope."""

    type: str   # payment.succeeded / payment.cancelled / refund.succeeded
    object: dict  # Raw Payment or Refund object from YooKassa
