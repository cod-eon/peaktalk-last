import uuid

import pytest
from sqlalchemy import select

from app.config import settings
from app.models.notification import Notification, PushSubscription
from app.models.user import User
from tests.conftest import TEST_USER_EMAIL, TEST_USER_ID


@pytest.mark.asyncio
async def test_get_vapid_returns_503_when_not_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "vapid_public_key", "")

    response = await client.get("/api/notifications/vapid")

    assert response.status_code == 503
    assert response.json()["detail"] == "Публичный VAPID-ключ не настроен."


@pytest.mark.asyncio
async def test_get_vapid_returns_public_key(client, monkeypatch):
    monkeypatch.setattr(settings, "vapid_public_key", "test-public-key")

    response = await client.get("/api/notifications/vapid")

    assert response.status_code == 200
    assert response.json() == {"public_key": "test-public-key"}


@pytest.mark.asyncio
async def test_subscribe_push_saves_subscription(client, db_session):
    response = await client.post(
        "/api/notifications/subscribe",
        json={
            "endpoint": "https://push.example/subscription-1",
            "keys": {"p256dh": "p256dh-value", "auth": "auth-value"},
        },
    )

    assert response.status_code == 201

    result = await db_session.execute(
        select(PushSubscription).where(PushSubscription.endpoint == "https://push.example/subscription-1")
    )
    subscription = result.scalar_one()

    assert subscription.p256dh == "p256dh-value"
    assert subscription.auth == "auth-value"


@pytest.mark.asyncio
async def test_send_test_notification_persists_and_triggers_delivery(client, db_session, monkeypatch):
    broadcast_calls: list[dict] = []
    push_task_calls: list[str] = []

    async def fake_broadcast_to_user_across_workers(*, user_id, message):
        broadcast_calls.append({"user_id": user_id, "message": message})

    class FakePushTask:
        @staticmethod
        def delay(notification_id: str):
            push_task_calls.append(notification_id)

    monkeypatch.setattr(
        "app.routers.notifications.manager.broadcast_to_user_across_workers",
        fake_broadcast_to_user_across_workers,
    )
    monkeypatch.setattr("app.worker.send_web_push_task", FakePushTask)

    response = await client.post("/api/notifications/test")

    assert response.status_code == 200
    notification_id = response.json()["id"]

    result = await db_session.execute(select(Notification).where(Notification.id == uuid.UUID(notification_id)))
    notification = result.scalar_one()

    assert notification.title == "Тестовый сигнал"
    assert notification.target_url == "/settings?tab=notifications"
    assert len(broadcast_calls) == 1
    assert broadcast_calls[0]["message"]["id"] == notification_id
    assert broadcast_calls[0]["message"]["target_url"] == "/settings?tab=notifications"
    assert push_task_calls == [notification_id]


@pytest.mark.asyncio
async def test_mark_all_notifications_read_marks_only_current_user_notifications(client, db_session):
    user = await db_session.get(User, TEST_USER_ID)
    if user is None:
        user = User(id=TEST_USER_ID, email=TEST_USER_EMAIL)
        db_session.add(user)
        await db_session.flush()

    own_unread = Notification(
        user_id=user.id,
        title="Unread one",
        message="Unread message",
        type="success",
        is_read=False,
    )
    own_read = Notification(
        user_id=user.id,
        title="Read one",
        message="Read message",
        type="success",
        is_read=True,
    )
    other_user_unread = Notification(
        user_id=uuid.uuid4(),
        title="Other unread",
        message="Other message",
        type="success",
        is_read=False,
    )
    db_session.add_all([own_unread, own_read, other_user_unread])
    await db_session.commit()

    response = await client.post("/api/notifications/read-all")

    assert response.status_code == 200
    assert response.json()["updated"] == 1

    await db_session.refresh(own_unread)
    await db_session.refresh(own_read)
    await db_session.refresh(other_user_unread)

    assert own_unread.is_read is True
    assert own_read.is_read is True
    assert other_user_unread.is_read is False
