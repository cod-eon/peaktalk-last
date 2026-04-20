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
    PaymentStatus,
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
    PaymentMethodSummaryResponse,
    PlanInfo,
    PlanLimits,
    SubscriptionResponse,
    TestSetPlanRequest,
    UsageStats,
)
from app.services.limits import (
    PLAN_LIMITS,
    _effective_plan,
    _normalize_plan,
    get_can_use_pdf,
    get_plan_limits_for_user,
    get_usage_counter,
    get_user_subscription,
)
from app.services.yookassa_service import create_payment, get_saved_payment_method_summary
from sqlalchemy import select

logger = logging.getLogger("peaktalk.billing")

router = APIRouter(prefix="/billing", tags=["billing"])

# ---------------------------------------------------------------------------
# Plan catalogue (static, no auth required)
# ---------------------------------------------------------------------------

_PLAN_CATALOGUE: list[PlanInfo] = [
    PlanInfo(
        id="free",
        name="Бесплатно",
        price=0,
        billing="once",
        simulations="1 сессия",
        documents="1 документ",
        features=["Все персоны", "3 вопроса в демо"],
    ),
    PlanInfo(
        id="per_session",
        name="За сессию",
        price=299,
        billing="once",
        simulations="1 полная сессия",
        documents="включено",
        features=["PDF-отчёт", "Шпаргалка", "Все персоны"],
        primary=True,
    ),
    PlanInfo(
        id="personal",
        name="Personal",
        price=790,
        billing="month",
        simulations="10 сессий/мес",
        features=["PDF + sharing", "История прогресса"],
    ),
    PlanInfo(
        id="pro",
        name="PRO",
        price=1490,
        billing="month",
        simulations="безлимит",
        features=["История", "Аналитика"],
    ),
    PlanInfo(
        id="team",
        name="Team",
        price=4990,
        billing="month",
        simulations="безлимит",
        seats=5,
        features=["5 мест", "Общая библиотека", "Командный dashboard"],
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
    eff_limits = PLAN_LIMITS[_normalize_plan(effective)]

    # Can start simulation: session_credits bypass plan limits
    has_credits = counter.session_credits > 0
    plan_allows_sim = (
        eff_limits.simulations_per_month is None
        or counter.simulations_used < eff_limits.simulations_per_month
    )
    can_sim = has_credits or plan_allows_sim

    can_doc = (
        eff_limits.documents_total is None
        or counter.documents_uploaded < eff_limits.documents_total
    )

    can_pdf = get_can_use_pdf(subscription) or has_credits

    return BillingStatusResponse(
        subscription=SubscriptionResponse(
            plan=subscription.plan,
            status=subscription.status,
            period_end=subscription.period_end,
        ),
        usage=UsageStats(
            simulations_used=counter.simulations_used,
            documents_uploaded=counter.documents_uploaded,
            session_credits=counter.session_credits,
            period_start=counter.period_start,
        ),
        limits=eff_limits,
        can_start_simulation=True if not settings.payments_enabled else can_sim,
        can_upload_document=True if not settings.payments_enabled else can_doc,
        can_use_pdf=True if not settings.payments_enabled else can_pdf,
        payments_enabled=settings.payments_enabled,
    )


@router.get("/payment-method", response_model=PaymentMethodSummaryResponse)
async def get_payment_method(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaymentMethodSummaryResponse:
    """Return masked saved payment method info for the billing page."""
    subscription = await get_user_subscription(str(current_user.id), db)

    paid_subscription_plans = (PlanType.personal, PlanType.pro, PlanType.team, PlanType.starter)
    is_paid_plan = subscription.plan in paid_subscription_plans
    has_saved_method = bool(subscription.yookassa_payment_method_id)
    auto_renew_enabled = (
        is_paid_plan
        and has_saved_method
        and subscription.status == SubscriptionStatus.active
    )

    if not is_paid_plan or not has_saved_method:
        return PaymentMethodSummaryResponse(
            is_bound=False,
            type=None,
            display_label=None,
            auto_renew_enabled=False,
        )

    result = await db.execute(
        select(Payment)
        .where(
            Payment.user_id == current_user.id,
            Payment.subscription_id == subscription.id,
            Payment.status == PaymentStatus.succeeded,
        )
        .order_by(Payment.created_at.desc())
        .limit(1)
    )
    latest_payment = result.scalar_one_or_none()

    display_label = "Привязанный способ оплаты"
    payment_type: str | None = None

    if latest_payment is not None:
        try:
            payment_summary = await get_saved_payment_method_summary(
                latest_payment.yookassa_payment_id
            )
        except Exception as exc:
            logger.warning(
                "billing: failed to fetch saved payment method payment_id=%s err=%s",
                latest_payment.yookassa_payment_id,
                exc,
            )
        else:
            if payment_summary is not None:
                payment_type = payment_summary.get("type")
                display_label = payment_summary.get("display_label") or display_label

    return PaymentMethodSummaryResponse(
        is_bound=True,
        type=payment_type,
        display_label=display_label,
        auto_renew_enabled=auto_renew_enabled,
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
    """Initiate a YooKassa payment.

    - plan == "per_session": one-time 299 RUB charge. On webhook success,
      session_credits += 1 for the user. No subscription record is created/updated.
    - Other paid plans: recurring monthly subscription flow (unchanged).

    Returns a redirect URL for the frontend to send the user to YooKassa.
    """
    if not settings.payments_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"detail": "Платёжная система временно отключена. Скоро заработает.", "code": "payments_disabled"},
        )

    # Unpayable plans
    if body.plan in (PlanType.free, PlanType.starter):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Этот тариф нельзя оплатить.", "code": "invalid_plan"},
        )

    try:
        result = await create_payment(
            user_id=str(current_user.id),
            plan=body.plan,
            return_url=body.return_url,
            customer_email=current_user.email,
        )
    except (ValueError, RuntimeError) as exc:
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
    per_session credits are NOT affected by cancellation.
    """
    subscription = await get_user_subscription(str(current_user.id), db)

    non_cancellable = (PlanType.free, PlanType.per_session)
    if subscription.plan in non_cancellable:
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

    indefinite_plans = (PlanType.free, PlanType.starter, PlanType.per_session)
    if body.plan in indefinite_plans:
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
