"""Plan limits enforcement for PeakTalk.

Functions here act as FastAPI dependencies injected into routers to gate
feature access based on the user's active subscription plan.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.subscription import (
    PlanType,
    Subscription,
    SubscriptionStatus,
    UsageCounter,
)
from app.models.user import User
from app.schemas.subscription import PlanLimits

logger = logging.getLogger("peaktalk.limits")

# ---------------------------------------------------------------------------
# Plan definitions
# ---------------------------------------------------------------------------

STARTER_PERSONAS = ["hr", "investor", "tech_lead"]

PLAN_LIMITS: dict[PlanType, PlanLimits] = {
    PlanType.starter: PlanLimits(
        simulations_per_month=3,
        documents_total=3,
        personas_allowed=STARTER_PERSONAS,
        pdf_reports=False,
    ),
    PlanType.pro: PlanLimits(
        simulations_per_month=None,
        documents_total=None,
        personas_allowed=None,
        pdf_reports=True,
    ),
    PlanType.team: PlanLimits(
        simulations_per_month=None,
        documents_total=None,
        personas_allowed=None,
        pdf_reports=True,
    ),
}

# Grace period: user stays on paid plan N days after period_end expires
GRACE_PERIOD_DAYS = 3

# Billing period length for counter resets
BILLING_PERIOD_DAYS = 30


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _effective_plan(subscription: Subscription) -> PlanType:
    """Return the plan the user effectively has, respecting grace period."""
    if subscription.plan == PlanType.starter:
        return PlanType.starter

    if subscription.period_end is None:
        return subscription.plan

    now = datetime.now(timezone.utc)
    grace_deadline = subscription.period_end + timedelta(days=GRACE_PERIOD_DAYS)

    if now > grace_deadline:
        # Period ended and grace period passed — treat as starter
        return PlanType.starter

    return subscription.plan


def _is_subscription_active(subscription: Subscription) -> bool:
    """Return True if the subscription is still usable (active or cancelled-but-valid)."""
    if subscription.status in (SubscriptionStatus.active, SubscriptionStatus.trialing):
        return True
    if subscription.status == SubscriptionStatus.cancelled:
        # Cancelled but paid period still valid
        if subscription.period_end is None:
            return True
        now = datetime.now(timezone.utc)
        return now <= subscription.period_end + timedelta(days=GRACE_PERIOD_DAYS)
    return False


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


async def get_user_subscription(user_id: str, db: AsyncSession) -> Subscription:
    """Get or auto-create a Subscription for the user (default: starter)."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = result.scalar_one_or_none()

    if subscription is None:
        now = datetime.now(timezone.utc)
        subscription = Subscription(
            user_id=user_id,
            plan=PlanType.starter,
            status=SubscriptionStatus.active,
            period_start=now,
            period_end=None,
        )
        db.add(subscription)
        await db.flush()
        logger.info("limits: auto-created starter subscription user_id=%s", user_id)

    return subscription


async def get_usage_counter(user_id: str, db: AsyncSession) -> UsageCounter:
    """Get or auto-create a UsageCounter. Resets simulation counter if new billing period."""
    result = await db.execute(
        select(UsageCounter).where(UsageCounter.user_id == user_id)
    )
    counter = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if counter is None:
        counter = UsageCounter(
            user_id=user_id,
            simulations_used=0,
            documents_uploaded=0,
            period_start=now,
        )
        db.add(counter)
        await db.flush()
        logger.info("limits: auto-created usage counter user_id=%s", user_id)
        return counter

    # Reset simulation counter if billing period has rolled over
    period_start = counter.period_start
    if period_start.tzinfo is None:
        period_start = period_start.replace(tzinfo=timezone.utc)

    if now > period_start + timedelta(days=BILLING_PERIOD_DAYS):
        logger.info(
            "limits: billing period rolled over, resetting sim counter user_id=%s "
            "old_period_start=%s simulations_used=%d",
            user_id, period_start, counter.simulations_used,
        )
        counter.simulations_used = 0
        counter.period_start = now
        await db.flush()

    return counter


async def get_plan_limits_for_user(user_id: str, db: AsyncSession) -> tuple[Subscription, UsageCounter, PlanLimits]:
    """Convenience: fetch subscription + counter + effective limits in one call."""
    subscription = await get_user_subscription(user_id, db)
    counter = await get_usage_counter(user_id, db)
    effective_plan = _effective_plan(subscription)
    limits = PLAN_LIMITS[effective_plan]
    return subscription, counter, limits


# ---------------------------------------------------------------------------
# FastAPI dependency: limit checks (raise 402 on violation)
# ---------------------------------------------------------------------------


async def check_simulation_limit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """FastAPI Dependency. Raises HTTP 402 if monthly simulation limit is exceeded."""
    subscription, counter, limits = await get_plan_limits_for_user(str(current_user.id), db)

    if limits.simulations_per_month is None:
        return  # Unlimited

    if counter.simulations_used >= limits.simulations_per_month:
        effective_plan = _effective_plan(subscription)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": (
                    f"Достигнут лимит симуляций на тарифе "
                    f"{effective_plan.value.capitalize()} "
                    f"({limits.simulations_per_month}/мес). Перейдите на PRO."
                ),
                "code": "simulation_limit_exceeded",
                "limit_type": "simulations",
                "plan": effective_plan.value,
                "used": counter.simulations_used,
                "limit": limits.simulations_per_month,
            },
        )


async def check_document_limit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """FastAPI Dependency. Raises HTTP 402 if total document limit is exceeded."""
    subscription, counter, limits = await get_plan_limits_for_user(str(current_user.id), db)

    if limits.documents_total is None:
        return  # Unlimited

    if counter.documents_uploaded >= limits.documents_total:
        effective_plan = _effective_plan(subscription)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": (
                    f"Достигнут лимит документов на тарифе "
                    f"{effective_plan.value.capitalize()} "
                    f"({limits.documents_total} всего). Перейдите на PRO."
                ),
                "code": "document_limit_exceeded",
                "limit_type": "documents",
                "plan": effective_plan.value,
                "used": counter.documents_uploaded,
                "limit": limits.documents_total,
            },
        )


async def check_persona_access(
    persona: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Raises HTTP 402 if the requested persona is not available on the user's plan."""
    subscription, _, limits = await get_plan_limits_for_user(str(current_user.id), db)

    if limits.personas_allowed is None:
        return  # All personas allowed

    if persona not in limits.personas_allowed:
        effective_plan = _effective_plan(subscription)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": (
                    f"Персона '{persona}' недоступна на тарифе "
                    f"{effective_plan.value.capitalize()}. Перейдите на PRO."
                ),
                "code": "persona_not_available",
                "limit_type": "personas",
                "plan": effective_plan.value,
                "persona": persona,
                "allowed": limits.personas_allowed,
            },
        )


# ---------------------------------------------------------------------------
# Counter increment helpers (called after successful operations)
# ---------------------------------------------------------------------------


async def increment_simulation_counter(user_id: str, db: AsyncSession) -> None:
    """Increment simulation usage counter for the user."""
    counter = await get_usage_counter(user_id, db)
    counter.simulations_used += 1
    await db.flush()
    logger.debug("limits: simulation counter incremented user_id=%s total=%d", user_id, counter.simulations_used)


async def increment_document_counter(user_id: str, db: AsyncSession) -> None:
    """Increment document upload counter for the user."""
    counter = await get_usage_counter(user_id, db)
    counter.documents_uploaded += 1
    await db.flush()
    logger.debug("limits: document counter incremented user_id=%s total=%d", user_id, counter.documents_uploaded)
