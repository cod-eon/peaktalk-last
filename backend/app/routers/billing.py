"""Billing router: plan info, subscription management, and payment creation."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.subscription import (
    Payment,
    PlanType,
    Subscription,
    SubscriptionStatus,
    UsageCounter,
)
from app.models.user import User
from app.schemas.subscription import (
    BillingStatusResponse,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentResponse,
    PlanInfo,
    PlanLimits,
    SubscriptionResponse,
    TestSetPlanRequest,
    UsageStats,
)
from app.services.limits import (
    PLAN_LIMITS,
    _effective_plan,
    get_plan_limits_for_user,
    get_usage_counter,
    get_user_subscription,
)
from app.services.yookassa_service import create_payment
from sqlalchemy import select

logger = logging.getLogger("peaktalk.billing")

router = APIRouter(prefix="/billing", tags=["billing"])

# ---------------------------------------------------------------------------
# Plan catalogue (static, no auth required)
# ---------------------------------------------------------------------------

_PLAN_CATALOGUE: list[PlanInfo] = [
    PlanInfo(
        plan=PlanType.starter,
        name="Starter",
        price_rub=0,
        limits=PLAN_LIMITS[PlanType.starter],
    ),
    PlanInfo(
        plan=PlanType.pro,
        name="PRO",
        price_rub=990,
        limits=PLAN_LIMITS[PlanType.pro],
    ),
    PlanInfo(
        plan=PlanType.team,
        name="Team",
        price_rub=2490,
        limits=PLAN_LIMITS[PlanType.team],
    ),
]


@router.get("/plans", response_model=list[PlanInfo])
async def list_plans() -> list[PlanInfo]:
    """Return all available plans. Public — no authentication required."""
    return _PLAN_CATALOGUE


# ---------------------------------------------------------------------------
# Billing status
# ---------------------------------------------------------------------------


@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BillingStatusResponse:
    """Return current subscription, usage counters, and capability flags."""
    subscription, counter, limits = await get_plan_limits_for_user(
        str(current_user.id), db
    )

    effective = _effective_plan(subscription)
    eff_limits = PLAN_LIMITS[effective]

    can_sim = (
        eff_limits.simulations_per_month is None
        or counter.simulations_used < eff_limits.simulations_per_month
    )
    can_doc = (
        eff_limits.documents_total is None
        or counter.documents_uploaded < eff_limits.documents_total
    )

    return BillingStatusResponse(
        subscription=SubscriptionResponse(
            plan=subscription.plan,
            status=subscription.status,
            period_end=subscription.period_end,
        ),
        usage=UsageStats(
            simulations_used=counter.simulations_used,
            documents_uploaded=counter.documents_uploaded,
            period_start=counter.period_start,
        ),
        limits=eff_limits,
        can_start_simulation=True if not settings.payments_enabled else can_sim,
        can_upload_document=True if not settings.payments_enabled else can_doc,
        payments_enabled=settings.payments_enabled,
    )


# ---------------------------------------------------------------------------
# Payment creation
# ---------------------------------------------------------------------------


@router.post("/payment", response_model=CreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription_payment(
    body: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreatePaymentResponse:
    """Initiate a YooKassa payment to upgrade to PRO or TEAM plan.

    Returns a redirect URL that the frontend should open for the user to complete payment.
    """
    if not settings.payments_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"detail": "Платёжная система временно отключена. Скоро заработает.", "code": "payments_disabled"},
        )

    if body.plan == PlanType.starter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Нельзя оплатить тариф Starter.", "code": "invalid_plan"},
        )

    try:
        result = await create_payment(
            user_id=str(current_user.id),
            plan=body.plan,
            return_url=body.return_url,
        )
    except RuntimeError as exc:
        logger.error("billing: YooKassa create_payment failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"detail": "Платёжный сервис временно недоступен.", "code": "payment_service_unavailable"},
        ) from exc

    logger.info(
        "billing: payment initiated user_id=%s plan=%s payment_id=%s",
        current_user.id, body.plan.value, result["payment_id"],
    )

    return CreatePaymentResponse(
        payment_url=result["confirmation_url"],
        payment_id=result["payment_id"],
    )


# ---------------------------------------------------------------------------
# Cancel subscription
# ---------------------------------------------------------------------------


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionResponse:
    """Cancel the active paid subscription.

    The plan stays active until period_end (or grace period expiry).
    """
    subscription = await get_user_subscription(str(current_user.id), db)

    if subscription.plan == PlanType.starter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Нет активной платной подписки для отмены.", "code": "no_paid_subscription"},
        )

    if subscription.status == SubscriptionStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Подписка уже отменена.", "code": "already_cancelled"},
        )

    subscription.status = SubscriptionStatus.cancelled
    subscription.cancelled_at = datetime.now(timezone.utc)
    await db.flush()

    logger.info(
        "billing: subscription cancelled user_id=%s plan=%s period_end=%s",
        current_user.id, subscription.plan.value, subscription.period_end,
    )

    return SubscriptionResponse(
        plan=subscription.plan,
        status=subscription.status,
        period_end=subscription.period_end,
    )


# ---------------------------------------------------------------------------
# Payment history
# ---------------------------------------------------------------------------


@router.get("/payments", response_model=list[PaymentResponse])
async def list_payments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PaymentResponse]:
    """Return the authenticated user's payment history, newest first."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .limit(100)
    )
    payments = list(result.scalars().all())

    return [
        PaymentResponse(
            id=str(p.id),
            amount=p.amount,
            currency=p.currency,
            status=p.status,
            description=p.description,
            created_at=p.created_at,
        )
        for p in payments
    ]


# ---------------------------------------------------------------------------
# Test helpers (only available when payments_enabled=False)
# ---------------------------------------------------------------------------


@router.post("/test/set-plan", response_model=SubscriptionResponse)
async def test_set_plan(
    body: TestSetPlanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionResponse:
    """Directly set the current user's plan without payment.

    Only available when PAYMENTS_ENABLED=false (development / staging).
    Use this to test subscription limits and UI flows locally.
    """
    if settings.payments_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Тест-режим недоступен при включённой платёжной системе.", "code": "test_mode_disabled"},
        )

    subscription = await get_user_subscription(str(current_user.id), db)
    now = datetime.now(timezone.utc)

    subscription.plan = body.plan
    subscription.status = SubscriptionStatus.active
    subscription.cancelled_at = None

    if body.plan == PlanType.starter:
        subscription.period_end = None
    else:
        days = body.period_days if body.period_days is not None else 30
        subscription.period_end = now + timedelta(days=days)

    subscription.period_start = now
    await db.flush()

    logger.info(
        "billing[test]: plan set user_id=%s plan=%s period_days=%s",
        current_user.id, body.plan.value, body.period_days,
    )

    return SubscriptionResponse(
        plan=subscription.plan,
        status=subscription.status,
        period_end=subscription.period_end,
    )
