"""Webhook handlers: Supabase auth events + YooKassa payment events.

Supabase webhook setup:
  - Table: auth.users, Events: DELETE
  - URL: https://<your-api>/webhooks/supabase/user-deleted
  - HTTP headers: Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>

YooKassa webhook setup:
  - URL: https://<your-api>/webhooks/yookassa
  - Events: payment.succeeded, payment.cancelled, refund.succeeded
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import delete as sa_delete, select
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
from app.models.user import User
from app.schemas.subscription import YookassaWebhookEvent
from app.services.limits import get_usage_counter, get_user_subscription
from app.services.yookassa_service import verify_webhook_ip

logger = logging.getLogger("peaktalk.webhooks")

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_webhook_secret(authorization: str | None = Header(default=None)) -> None:
    """Verify the Authorization header matches the configured webhook secret."""
    if not settings.supabase_webhook_secret:
        # Secret not configured — skip verification (dev mode)
        return
    expected = f"Bearer {settings.supabase_webhook_secret}"
    if authorization != expected:
        logger.warning("webhooks: invalid authorization header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")


@router.post(
    "/supabase/user-deleted",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(_verify_webhook_secret)],
)
async def supabase_user_deleted(
    payload: dict,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Receives Supabase Database Webhook on auth.users DELETE.

    Payload structure:
    {
        "type": "DELETE",
        "table": "users",
        "schema": "auth",
        "record": null,
        "old_record": {"id": "<uuid>", "email": "...", ...}
    }
    """
    old_record = payload.get("old_record") or {}
    raw_id = old_record.get("id")

    if not raw_id:
        logger.warning("webhooks: user-deleted payload missing old_record.id")
        return {"status": "ignored", "reason": "no user id in payload"}

    try:
        user_id = uuid.UUID(str(raw_id))
    except ValueError:
        logger.warning("webhooks: invalid uuid in payload: %s", raw_id)
        return {"status": "ignored", "reason": "invalid uuid"}

    result = await db.execute(sa_delete(User).where(User.id == user_id))
    deleted_count = result.rowcount
    await db.flush()

    if deleted_count:
        logger.info("webhooks: deleted local user user_id=%s", user_id)
    else:
        logger.info("webhooks: user not found locally user_id=%s (already clean)", user_id)

    return {"status": "ok", "deleted": str(deleted_count)}


# ---------------------------------------------------------------------------
# YooKassa webhook
# ---------------------------------------------------------------------------

_SUBSCRIPTION_PERIOD_DAYS = 30


def _resolve_yookassa_event_type(event: YookassaWebhookEvent) -> str:
    """Normalize YooKassa webhook envelope into an actionable event name."""
    return event.event or event.type


def _extract_plan_from_payment(payment_obj: dict) -> PlanType:
    """Derive PlanType from YooKassa payment metadata."""
    meta = payment_obj.get("metadata") or {}
    plan_value = meta.get("plan", "")
    try:
        return PlanType(plan_value)
    except ValueError:
        # Fallback: inspect description
        desc = (payment_obj.get("description") or "").lower()
        if "team" in desc:
            return PlanType.team
        return PlanType.pro


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
    """Process a payment.cancelled event from YooKassa."""
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
    if subscription is not None and subscription.status != SubscriptionStatus.active:
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
      - payment.cancelled  → mark payment failed, set subscription past_due
      - refund.succeeded   → logged only (no subscription changes in MVP)
    """
    # IP allowlist verification
    client_host = request.client.host if request.client else ""
    # X-Forwarded-For header is set by Nginx reverse proxy
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    real_ip = forwarded_for.split(",")[0].strip() if forwarded_for else client_host

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
