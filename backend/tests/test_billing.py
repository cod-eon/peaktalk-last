from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.subscription import Payment, PaymentStatus, PlanType, Subscription, SubscriptionStatus
from app.models.user import User


@pytest.mark.asyncio
async def test_payment_method_summary_for_active_subscription(
    client: AsyncClient,
    db_session,
    monkeypatch,
) -> None:
    await client.get("/billing/status")

    user = (await db_session.execute(select(User).where(User.email == "test@peaktalk.io"))).scalar_one()
    subscription = (
        await db_session.execute(select(Subscription).where(Subscription.user_id == user.id))
    ).scalar_one()
    subscription.plan = PlanType.pro
    subscription.status = SubscriptionStatus.active
    subscription.period_start = datetime.now(timezone.utc)
    subscription.period_end = datetime.now(timezone.utc) + timedelta(days=30)
    subscription.yookassa_payment_method_id = "pm_test_123"
    await db_session.flush()

    payment = Payment(
        user_id=user.id,
        subscription_id=subscription.id,
        amount=Decimal("990.00"),
        currency="RUB",
        status=PaymentStatus.succeeded,
        yookassa_payment_id="yk_payment_1",
        description="PeakTalk PRO — месячная подписка",
    )
    db_session.add(payment)
    await db_session.commit()

    monkeypatch.setattr(
        "app.routers.billing.get_saved_payment_method_summary",
        AsyncMock(return_value={"type": "bank_card", "display_label": "Visa •••• 4242"}),
    )

    response = await client.get("/billing/payment-method")

    assert response.status_code == 200
    data = response.json()
    assert data["is_bound"] is True
    assert data["type"] == "bank_card"
    assert data["display_label"] == "Visa •••• 4242"
    assert data["auto_renew_enabled"] is True


@pytest.mark.asyncio
async def test_payment_method_summary_for_cancelled_subscription(
    client: AsyncClient,
    db_session,
) -> None:
    await client.get("/billing/status")

    user = (await db_session.execute(select(User).where(User.email == "test@peaktalk.io"))).scalar_one()
    subscription = (
        await db_session.execute(select(Subscription).where(Subscription.user_id == user.id))
    ).scalar_one()
    subscription.plan = PlanType.team
    subscription.status = SubscriptionStatus.cancelled
    subscription.period_start = datetime.now(timezone.utc)
    subscription.period_end = datetime.now(timezone.utc) + timedelta(days=10)
    subscription.yookassa_payment_method_id = "pm_test_456"
    await db_session.commit()

    response = await client.get("/billing/payment-method")

    assert response.status_code == 200
    data = response.json()
    assert data["is_bound"] is True
    assert data["display_label"] == "Привязанный способ оплаты"
    assert data["auto_renew_enabled"] is False