"""YooKassa webhook handlers.

YooKassa webhook setup:
  - URL: https://<your-api>/webhooks/yookassa
  - Events: payment.succeeded, payment.canceled, refund.succeeded
"""

import logging
import ipaddress
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.subscription import (
    Payment,
    PaymentStatus,
    PlanType,
    Subscription,
    SubscriptionStatus,
    UsageCounter,
)
from app.schemas.subscription import YookassaWebhookEvent
from app.services.limits import get_usage_counter, get_user_subscription
from app.services.yookassa_service import verify_webhook_ip

logger = logging.getLogger("peaktalk.webhooks")

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# ---------------------------------------------------------------------------
# YooKassa webhook
# ---------------------------------------------------------------------------

_SUBSCRIPTION_PERIOD_DAYS = 30


def _resolve_yookassa_event_type(event: YookassaWebhookEvent) -> str:
    """Normalize YooKassa webhook envelope into an actionable event name."""
    event_type = event.event or event.type
    if event_type == "payment.canceled":
        return "payment.cancelled"
    return event_type


def _extract_plan_from_payment(payment_obj: dict) -> PlanType | None:
    """Derive PlanType from YooKassa payment metadata."""
    meta = payment_obj.get("metadata") or {}
    plan_value = meta.get("plan", "")
    try:
        return PlanType(plan_value)
    except ValueError:
        desc = (payment_obj.get("description") or "").lower()
        if "per_session" in desc or "одна полная сессия" in desc or "defense brief" in desc:
            return PlanType.per_session
        if "personal" in desc:
            return PlanType.personal
        if "pro" in desc:
            return PlanType.pro
        if "team" in desc:
            return PlanType.team
        logger.warning(
            "webhooks/yookassa: unable to resolve plan from metadata/description "
            "payment_id=%s plan=%r",
            payment_obj.get("id"),
            plan_value,
        )
        return None


def _request_origin_ip(request: Request) -> str:
    """Return the caller IP, trusting X-Forwarded-For only from local/private proxies."""
    client_host = request.client.host if request.client else ""
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if not forwarded_for:
        return client_host

    try:
        client_addr = ipaddress.ip_address(client_host)
    except ValueError:
        return client_host

    if client_addr.is_private or client_addr.is_loopback:
        return forwarded_for.split(",")[0].strip()
    return client_host


def _verify_yookassa_secret(request: Request) -> None:
    """Optionally verify a shared webhook secret if configured."""
    if not settings.yookassa_webhook_secret:
        return

    header_secret = (
        request.headers.get("X-Webhook-Secret")
        or request.headers.get("X-Yookassa-Webhook-Secret")
    )
    bearer = request.headers.get("Authorization")
    if header_secret == settings.yookassa_webhook_secret:
        return
    if bearer == f"Bearer {settings.yookassa_webhook_secret}":
        return
    logger.warning("webhooks/yookassa: invalid webhook secret")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid webhook secret",
    )


async def _handle_payment_succeeded(payment_obj: dict, db: AsyncSession) -> None:
    """Process a payment.succeeded event from YooKassa.

    Routing logic:
    - metadata.plan == "per_session"  →  increment session_credits by 1
                                          (do NOT touch subscription record)
    - all other plans                 →  activate/update subscription as before
    """
    yk_payment_id: str = payment_obj.get("id", "")
    if not yk_payment_id:
        logger.warning("webhooks/yookassa: payment.succeeded missing payment id")
        return

    # Idempotency check — skip if already processed
    existing = await db.execute(
        select(Payment).where(Payment.yookassa_payment_id == yk_payment_id)
    )
    if existing.scalar_one_or_none() is not None:
        logger.info("webhooks/yookassa: payment %s already processed, skipping", yk_payment_id)
        return

    # Extract user_id from metadata
    meta = payment_obj.get("metadata") or {}
    raw_user_id = meta.get("user_id", "")
    try:
        user_id = uuid.UUID(str(raw_user_id))
    except ValueError:
        logger.error("webhooks/yookassa: invalid user_id in metadata: %s", raw_user_id)
        return

    # Resolve plan from metadata
    plan = _extract_plan_from_payment(payment_obj)
    if plan is None:
        return

    # Extract payment amount
    amount_obj = payment_obj.get("amount") or {}
    try:
        amount = Decimal(str(amount_obj.get("value", "0")))
    except Exception:
        amount = Decimal("0")

    now = datetime.now(timezone.utc)

    # ── per_session: credit-based one-time payment ───────────────────────────
    if plan == PlanType.per_session:
        payment_record = Payment(
            user_id=user_id,
            amount=amount,
            currency=(amount_obj.get("currency") or "RUB"),
            status=PaymentStatus.succeeded,
            yookassa_payment_id=yk_payment_id,
            description=payment_obj.get("description"),
            subscription_id=None,  # No subscription linked for one-time payments
        )
        db.add(payment_record)

        # Increment session_credits on UsageCounter
        counter = await get_usage_counter(str(user_id), db)
        counter.session_credits += 1
        await db.flush()

        logger.info(
            "webhooks/yookassa: per_session payment.succeeded "
            "payment_id=%s user_id=%s session_credits=%d",
            yk_payment_id, user_id, counter.session_credits,
        )
        return

    # ── Subscription-based plans ─────────────────────────────────────────────

    # Extract saved payment method id for future recurrent charges
    pm_obj = payment_obj.get("payment_method") or {}
    payment_method_id: str | None = pm_obj.get("id") if pm_obj.get("saved") else None

    # Persist Payment record (subscription_id linked below)
    payment_record = Payment(
        user_id=user_id,
        amount=amount,
        currency=(amount_obj.get("currency") or "RUB"),
        status=PaymentStatus.succeeded,
        yookassa_payment_id=yk_payment_id,
        description=payment_obj.get("description"),
    )

    # Update or create Subscription
    subscription = await get_user_subscription(str(user_id), db)
    subscription.plan = plan
    subscription.status = SubscriptionStatus.active
    subscription.period_start = now
    subscription.period_end = now + timedelta(days=_SUBSCRIPTION_PERIOD_DAYS)
    if payment_method_id:
        subscription.yookassa_payment_method_id = payment_method_id

    payment_record.subscription_id = subscription.id
    db.add(payment_record)
    await db.flush()

    # Reset usage counters for the new billing period
    counter = await get_usage_counter(str(user_id), db)
    counter.simulations_used = 0
    counter.documents_uploaded = 0
    counter.period_start = now
    await db.flush()

    logger.info(
        "webhooks/yookassa: payment.succeeded processed "
        "payment_id=%s user_id=%s plan=%s period_end=%s",
        yk_payment_id, user_id, plan.value, subscription.period_end,
    )


async def _handle_payment_cancelled(payment_obj: dict, db: AsyncSession) -> None:
    """Process a payment.canceled/payment.cancelled event from YooKassa."""
    yk_payment_id: str = payment_obj.get("id", "")
    if not yk_payment_id:
        logger.warning("webhooks/yookassa: payment.cancelled missing payment id")
        return

    # Update existing Payment record if present
    result = await db.execute(
        select(Payment).where(Payment.yookassa_payment_id == yk_payment_id)
    )
    payment_record = result.scalar_one_or_none()
    if payment_record is not None:
        payment_record.status = PaymentStatus.failed
        await db.flush()

    # Mark subscription as past_due if it wasn't already active via another payment
    meta = payment_obj.get("metadata") or {}
    raw_user_id = meta.get("user_id", "")
    try:
        user_id = uuid.UUID(str(raw_user_id))
    except ValueError:
        logger.warning("webhooks/yookassa: payment.cancelled missing user_id metadata")
        return

    result2 = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = result2.scalar_one_or_none()
    is_recurrent_failure = (
        (meta.get("type") == "recurrent")
        or bool(meta.get("subscription_id"))
    )
    if subscription is not None and (
        is_recurrent_failure or subscription.status != SubscriptionStatus.active
    ):
        subscription.status = SubscriptionStatus.past_due
        await db.flush()
        logger.info(
            "webhooks/yookassa: subscription set to past_due user_id=%s", user_id
        )

    logger.info("webhooks/yookassa: payment.cancelled processed payment_id=%s", yk_payment_id)


@router.post("/yookassa", status_code=status.HTTP_200_OK)
async def yookassa_webhook(
    event: YookassaWebhookEvent,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Receive and process YooKassa payment webhook events.

    IP verification is performed against the official YooKassa IP ranges.
    Events handled:
      - payment.succeeded  → activate subscription, save payment method
      - payment.canceled   → mark payment failed, set subscription past_due
      - refund.succeeded   → logged only (no subscription changes in MVP)
    """
    _verify_yookassa_secret(request)

    # IP allowlist verification
    real_ip = _request_origin_ip(request)

    if settings.app_env != "development" and not verify_webhook_ip(real_ip):
        logger.warning("webhooks/yookassa: request from untrusted IP %s rejected", real_ip)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Untrusted IP address",
        )

    event_type = _resolve_yookassa_event_type(event)

    logger.info(
        "webhooks/yookassa: received envelope_type=%s event_type=%s ip=%s",
        event.type,
        event_type,
        real_ip,
    )

    if event_type == "payment.succeeded":
        await _handle_payment_succeeded(event.object, db)
    elif event_type == "payment.cancelled":
        await _handle_payment_cancelled(event.object, db)
    elif event_type == "refund.succeeded":
        logger.info(
            "webhooks/yookassa: refund.succeeded refund_id=%s — logged only",
            event.object.get("id"),
        )
    else:
        logger.info(
            "webhooks/yookassa: unhandled event envelope_type=%s event_type=%s",
            event.type,
            event_type,
        )

    return {"status": "ok"}
