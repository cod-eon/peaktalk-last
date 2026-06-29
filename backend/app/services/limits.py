"""Plan limits enforcement for PeakTalk.

Functions here act as FastAPI dependencies injected into routers to gate
feature access based on the user's active subscription plan.

Priority order for simulation access:
  1. session_credits > 0  →  consume one credit and allow (any plan)
  2. Subscription plan limits  →  free/personal/pro/team rules
"""

import logging
import uuid as _uuid_module
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.config import settings
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

# All plans now grant access to all personas.
# Persona restriction was removed in M1.2 pricing update.
ALL_PERSONAS: list[str] | None = None  # None = unrestricted

PLAN_LIMITS: dict[PlanType, PlanLimits] = {
    # Legacy alias — treated identically to personal for backward compat
    PlanType.starter: PlanLimits(
        simulations_per_month=10,
        documents_total=None,
        personas_allowed=ALL_PERSONAS,
        pdf_reports=True,
    ),
    # New free tier: 1 lifetime simulation total (not monthly)
    PlanType.free: PlanLimits(
        simulations_per_month=1,   # enforced as lifetime via free-plan logic
        documents_total=1,
        personas_allowed=ALL_PERSONAS,
        pdf_reports=False,
    ),
    # per_session is not a subscription plan — credits are tracked on UsageCounter.
    # This entry exists only so PLAN_LIMITS lookups never KeyError on this enum value.
    PlanType.per_session: PlanLimits(
        simulations_per_month=0,   # credits must be purchased; plan alone allows none
        documents_total=None,
        personas_allowed=ALL_PERSONAS,
        pdf_reports=True,
    ),
    PlanType.personal: PlanLimits(
        simulations_per_month=10,
        documents_total=None,
        personas_allowed=ALL_PERSONAS,
        pdf_reports=True,
    ),
    PlanType.pro: PlanLimits(
        simulations_per_month=None,
        documents_total=None,
        personas_allowed=ALL_PERSONAS,
        pdf_reports=True,
    ),
    PlanType.team: PlanLimits(
        simulations_per_month=None,
        documents_total=None,
        personas_allowed=ALL_PERSONAS,
        pdf_reports=True,
    ),
}

# Grace period: user stays on paid plan N days after period_end expires
GRACE_PERIOD_DAYS = 3

# Billing period length for counter resets (subscription plans)
BILLING_PERIOD_DAYS = 30

# Plans that are subscription-based and have a monthly billing period
_SUBSCRIPTION_PLANS = {PlanType.personal, PlanType.pro, PlanType.team, PlanType.starter}

# Plans that do NOT expire / have no period_end (free + legacy starter with no period)
_INDEFINITE_PLANS = {PlanType.free, PlanType.starter}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _normalize_plan(plan: PlanType) -> PlanType:
    """Normalize legacy plan aliases to their current equivalents."""
    # starter maps to personal for all limit logic
    if plan == PlanType.starter:
        return PlanType.personal
    return plan


def _effective_plan(subscription: Subscription) -> PlanType:
    """Return the plan the user effectively has, respecting grace period.

    - free / per_session: always effective (no expiry concept)
    - personal / pro / team: subject to period_end + grace
    - starter (legacy): treated as personal for limits purposes
    """
    plan = subscription.plan

    # Plans without expiry
    if plan in (PlanType.free, PlanType.per_session):
        return plan

    # Subscription-based plans
    if subscription.period_end is None:
        # No period_end set: still active (legacy starter rows or newly created)
        return plan

    now = datetime.now(timezone.utc)
    period_end = subscription.period_end
    if period_end.tzinfo is None:
        period_end = period_end.replace(tzinfo=timezone.utc)

    grace_deadline = period_end + timedelta(days=GRACE_PERIOD_DAYS)

    if now > grace_deadline:
        # Subscription expired beyond grace period — fall back to free
        return PlanType.free

    return plan


def _is_subscription_active(subscription: Subscription) -> bool:
    """Return True if the subscription is still usable (active or cancelled-but-valid)."""
    if subscription.status in (SubscriptionStatus.active, SubscriptionStatus.trialing):
        return True
    if subscription.status == SubscriptionStatus.cancelled:
        if subscription.period_end is None:
            return True
        now = datetime.now(timezone.utc)
        period_end = subscription.period_end
        if period_end.tzinfo is None:
            period_end = period_end.replace(tzinfo=timezone.utc)
        return now <= period_end + timedelta(days=GRACE_PERIOD_DAYS)
    return False


def get_can_use_pdf(subscription: Subscription) -> bool:
    """Return whether the user's current plan includes PDF report generation."""
    effective = _effective_plan(subscription)
    limits = PLAN_LIMITS.get(effective)
    if limits is None:
        return False
    return limits.pdf_reports


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


async def get_user_subscription(user_id: str, db: AsyncSession) -> Subscription:
    """Get or auto-create a Subscription for the user (default: free)."""
    uid = _uuid_module.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == uid)
    )
    subscription = result.scalar_one_or_none()

    if subscription is None:
        now = datetime.now(timezone.utc)
        subscription = Subscription(
            user_id=uid,
            plan=PlanType.free,
            status=SubscriptionStatus.active,
            period_start=now,
            period_end=None,
        )
        db.add(subscription)
        await db.flush()
        logger.info("limits: auto-created free subscription user_id=%s", user_id)

    return subscription


async def get_usage_counter(user_id: str, db: AsyncSession) -> UsageCounter:
    """Get or auto-create a UsageCounter. Resets simulation counter if new billing period."""
    uid = _uuid_module.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await db.execute(
        select(UsageCounter).where(UsageCounter.user_id == uid)
    )
    counter = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if counter is None:
        counter = UsageCounter(
            user_id=uid,
            simulations_used=0,
            documents_uploaded=0,
            session_credits=0,
            period_start=now,
        )
        db.add(counter)
        await db.flush()
        logger.info("limits: auto-created usage counter user_id=%s", user_id)
        return counter

    # Reset simulation counter if billing period has rolled over.
    # Only applies to subscription-based plans; free plan is lifetime.
    period_start = counter.period_start
    if period_start.tzinfo is None:
        period_start = period_start.replace(tzinfo=timezone.utc)

    subscription = await get_user_subscription(user_id, db)
    effective_plan = _effective_plan(subscription)
    should_reset_period = (
        effective_plan in _SUBSCRIPTION_PLANS
        and now > period_start + timedelta(days=BILLING_PERIOD_DAYS)
    )

    if should_reset_period:
        logger.info(
            "limits: billing period rolled over, resetting sim counter user_id=%s "
            "old_period_start=%s simulations_used=%d",
            user_id, period_start, counter.simulations_used,
        )
        counter.simulations_used = 0
        counter.period_start = now
        await db.flush()

    return counter


async def get_plan_limits_for_user(
    user_id: str, db: AsyncSession
) -> tuple[Subscription, UsageCounter, PlanLimits]:
    """Convenience: fetch subscription + counter + effective limits in one call."""
    subscription = await get_user_subscription(user_id, db)
    counter = await get_usage_counter(user_id, db)
    effective_plan = _effective_plan(subscription)
    # Normalize legacy starter to personal for limits lookup
    lookup_plan = _normalize_plan(effective_plan)
    limits = PLAN_LIMITS[lookup_plan]
    return subscription, counter, limits


# ---------------------------------------------------------------------------
# FastAPI dependency: limit checks (raise 402 on violation)
# ---------------------------------------------------------------------------


async def check_simulation_limit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """FastAPI Dependency. Raises HTTP 402 if the user cannot start a simulation.

    Priority:
      1. session_credits > 0  →  consume one credit, allow regardless of plan
      2. pro / team plan      →  unlimited, allow
      3. personal / starter   →  monthly counter check
      4. free plan            →  lifetime counter check (simulations_used >= 1)
      5. per_session plan     →  no credits and no subscription → deny
    """
    if not settings.payments_enabled:
        return  # Payments disabled — no limits enforced

    subscription, counter, limits = await get_plan_limits_for_user(
        str(current_user.id), db
    )

    # Priority 1: session_credits override everything
    if counter.session_credits > 0:
        # Credit will be consumed by consume_session_credit() after session starts
        return

    effective_plan = _effective_plan(subscription)

    # Priority 2: unlimited plans
    if limits.simulations_per_month is None:
        return

    # Priority 3/4: counter-based limit
    if counter.simulations_used >= limits.simulations_per_month:
        plan_label = _normalize_plan(effective_plan).value.capitalize()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": (
                    f"Достигнут лимит стресс-тестов на тарифе {plan_label} "
                    f"({limits.simulations_per_month}"
                    + ("/мес" if effective_plan != PlanType.free else " всего")
                    + f"). Пополните баланс или перейдите на Personal."
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
    if not settings.payments_enabled:
        return  # Payments disabled — no limits enforced

    subscription, counter, limits = await get_plan_limits_for_user(
        str(current_user.id), db
    )

    if limits.documents_total is None:
        return  # Unlimited

    if counter.documents_uploaded >= limits.documents_total:
        effective_plan = _effective_plan(subscription)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "detail": (
                    f"Достигнут лимит документов на тарифе "
                    f"{_normalize_plan(effective_plan).value.capitalize()} "
                    f"({limits.documents_total} всего). Перейдите на Personal."
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
    """Raises HTTP 402 if the requested persona is not available on the user's plan.

    Under M1.2 all plans allow all personas, so this is a no-op.
    Kept for API compatibility.
    """
    # All personas are available on all plans — no check needed.
    return


# ---------------------------------------------------------------------------
# Counter increment / credit helpers (called after successful operations)
# ---------------------------------------------------------------------------


async def increment_simulation_counter(user_id: str, db: AsyncSession) -> None:
    """Increment simulation usage counter for the user.

    Does NOT consume session_credits — call consume_session_credit() for that.
    """
    uid = _uuid_module.UUID(user_id) if isinstance(user_id, str) else user_id
    await get_usage_counter(user_id, db)
    await db.execute(
        update(UsageCounter)
        .where(UsageCounter.user_id == uid)
        .values(
            simulations_used=UsageCounter.simulations_used + 1,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.flush()
    logger.debug(
        "limits: simulation counter incremented user_id=%s",
        user_id,
    )


async def consume_session_credit(user_id: str, db: AsyncSession) -> bool:
    """Consume one session credit if available.

    Returns True if a credit was consumed, False if none were available.
    Should be called at simulation start when the user has session_credits > 0.
    """
    uid = _uuid_module.UUID(user_id) if isinstance(user_id, str) else user_id
    counter = await get_usage_counter(user_id, db)
    if counter.session_credits <= 0:
        return False
    result = await db.execute(
        update(UsageCounter)
        .where(UsageCounter.user_id == uid, UsageCounter.session_credits > 0)
        .values(
            session_credits=UsageCounter.session_credits - 1,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.flush()
    if result.rowcount == 0:
        return False
    logger.info(
        "limits: session credit consumed user_id=%s",
        user_id,
    )
    return True


async def increment_document_counter(user_id: str, db: AsyncSession) -> None:
    """Increment document upload counter for the user."""
    uid = _uuid_module.UUID(user_id) if isinstance(user_id, str) else user_id
    await get_usage_counter(user_id, db)
    await db.execute(
        update(UsageCounter)
        .where(UsageCounter.user_id == uid)
        .values(
            documents_uploaded=UsageCounter.documents_uploaded + 1,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.flush()
    logger.debug(
        "limits: document counter incremented user_id=%s",
        user_id,
    )
