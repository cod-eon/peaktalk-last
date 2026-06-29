from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.routers import billing as billing_router
from app.models.subscription import Payment, PaymentStatus, PlanType, Subscription, SubscriptionStatus
from app.models.user import User


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "return_url",
    [
        "https://evil.example/billing/success",
        "http://localhost:3000/billing/success?return=https%3A%2F%2Fevil.example%2Fsteal",
        "http://localhost:3000/auth/callback",
    ],
)
async def test_create_payment_rejects_unsafe_return_url(
    return_url: str,
    client: AsyncClient,
    monkeypatch,
) -> None:
    create_payment_mock = AsyncMock(return_value={
        "payment_id": "yk_test_payment",
        "confirmation_url": "https://yookassa.test/confirm",
    })
    monkeypatch.setattr(billing_router.settings, "payments_enabled", True)
    monkeypatch.setattr(billing_router, "create_payment", create_payment_mock)

    response = await client.post("/billing/payment", json={
        "plan": "per_session",
        "return_url": return_url,
    })

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_return_url"
    create_payment_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_payment_accepts_configured_billing_success_return_url(
    client: AsyncClient,
    monkeypatch,
) -> None:
    create_payment_mock = AsyncMock(return_value={
        "payment_id": "yk_test_payment",
        "confirmation_url": "https://yookassa.test/confirm",
    })
    monkeypatch.setattr(billing_router.settings, "payments_enabled", True)
    monkeypatch.setattr(billing_router, "create_payment", create_payment_mock)

    return_url = "http://localhost:3000/billing/success?return=%2Fsimulation%2Ffrom-guest"
    response = await client.post("/billing/payment", json={
        "plan": "per_session",
        "return_url": return_url,
    })

    assert response.status_code == 201
    assert response.json() == {
        "payment_url": "https://yookassa.test/confirm",
        "payment_id": "yk_test_payment",
    }
    create_payment_mock.assert_awaited_once()
    assert create_payment_mock.await_args.kwargs["return_url"] == return_url


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
        amount=Decimal("1490.00"),
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


@pytest.mark.asyncio
async def test_yookassa_notification_webhook_activates_subscription(
    client: AsyncClient,
    db_session,
) -> None:
    await client.get("/billing/status")

    user = (await db_session.execute(select(User).where(User.email == "test@peaktalk.io"))).scalar_one()

    payload = {
        "type": "notification",
        "event": "payment.succeeded",
        "object": {
            "id": "yk_notification_payment_1",
            "description": "PeakTalk PRO — месячная подписка",
            "amount": {"value": "1490.00", "currency": "RUB"},
            "metadata": {
                "user_id": str(user.id),
                "plan": "pro",
            },
            "payment_method": {
                "id": "pm_saved_123",
                "saved": True,
                "type": "bank_card",
                "card": {"last4": "4242", "card_type": "visa"},
            },
        },
    }

    response = await client.post(
        "/webhooks/yookassa",
        json=payload,
        headers={"X-Forwarded-For": "77.75.153.78"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    subscription = (
        await db_session.execute(select(Subscription).where(Subscription.user_id == user.id))
    ).scalar_one()
    payment = (
        await db_session.execute(
            select(Payment).where(Payment.yookassa_payment_id == "yk_notification_payment_1")
        )
    ).scalar_one()

    assert subscription.plan == PlanType.pro
    assert subscription.status == SubscriptionStatus.active
    assert subscription.yookassa_payment_method_id == "pm_saved_123"
    assert subscription.period_end is not None
    assert payment.status == PaymentStatus.succeeded
    assert payment.subscription_id == subscription.id


@pytest.mark.asyncio
@pytest.mark.parametrize("event_name", ["payment.canceled", "payment.cancelled"])
async def test_yookassa_recurrent_canceled_marks_active_subscription_past_due(
    event_name: str,
    client: AsyncClient,
    db_session,
) -> None:
    await client.get("/billing/status")

    user = (await db_session.execute(select(User).where(User.email == "test@peaktalk.io"))).scalar_one()
    subscription = (
        await db_session.execute(select(Subscription).where(Subscription.user_id == user.id))
    ).scalar_one()
    subscription.plan = PlanType.personal
    subscription.status = SubscriptionStatus.active
    subscription.period_start = datetime.now(timezone.utc) - timedelta(days=30)
    subscription.period_end = datetime.now(timezone.utc)
    subscription.yookassa_payment_method_id = "pm_saved_personal"
    await db_session.commit()

    payload = {
        "type": "notification",
        "event": event_name,
        "object": {
            "id": "yk_recurrent_cancelled_1",
            "description": "PeakTalk Personal — месячная подписка (автопродление)",
            "amount": {"value": "790.00", "currency": "RUB"},
            "metadata": {
                "user_id": str(user.id),
                "subscription_id": str(subscription.id),
                "plan": "personal",
                "type": "recurrent",
            },
        },
    }

    response = await client.post(
        "/webhooks/yookassa",
        json=payload,
        headers={"X-Forwarded-For": "77.75.153.78"},
    )

    assert response.status_code == 200
    await db_session.refresh(subscription)
    assert subscription.status == SubscriptionStatus.past_due
