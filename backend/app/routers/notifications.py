import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user, get_user_from_token
from app.models.notification import Notification, PushSubscription
from app.models.user import User
from app.services.notification_payloads import serialize_notification
from app.ws_manager import manager
from app.config import settings

router = APIRouter()

class SubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict

class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str | None
    target_url: str | None
    is_read: bool
    created_at: Any

@router.get("/vapid", status_code=200)
async def get_vapid_key():
    """Return the VAPID public key for frontend subscription."""
    if not settings.vapid_public_key:
        raise HTTPException(status_code=503, detail="Публичный VAPID-ключ не настроен.")
    return {"public_key": settings.vapid_public_key}

@router.post("/subscribe", status_code=201)
async def subscribe_push(
    sub_data: SubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Save user's Web Push subscription."""
    # Check if exists
    stmt = select(PushSubscription).where(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == sub_data.endpoint
    )
    result = await db.execute(stmt)
    existing = result.scalars().first()
    
    if existing:
        existing.p256dh = sub_data.keys.get("p256dh", "")
        existing.auth = sub_data.keys.get("auth", "")
    else:
        new_sub = PushSubscription(
            user_id=current_user.id,
            endpoint=sub_data.endpoint,
            p256dh=sub_data.keys.get("p256dh", ""),
            auth=sub_data.keys.get("auth", "")
        )
        db.add(new_sub)
        
    await db.commit()
    return {"message": "Подписка сохранена."}


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get user's notifications."""
    stmt = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc())
    result = await db.execute(stmt)
    notifications = result.scalars().all()
    
    return notifications


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark a notification as read."""
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    result = await db.execute(stmt)
    notification = result.scalars().first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено.")
        
    notification.is_read = True
    await db.commit()
    return {"message": "Уведомление отмечено как прочитанное."}


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mark all user's notifications as read."""
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "Все уведомления отмечены как прочитанные.", "updated": result.rowcount or 0}


@router.post("/test")
async def send_test_notification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint to send a test notification to yourself."""
    notif = Notification(
        user_id=current_user.id,
        title="Тестовый сигнал",
        message="Поздравляем! Система уведомлений PeakTalk работает корректно.",
        type="success",
        target_url="/settings?tab=notifications",
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    await manager.broadcast_to_user_across_workers(
        user_id=current_user.id,
        message=serialize_notification(notif)
    )

    from app.worker import send_web_push_task

    send_web_push_task.delay(str(notif.id))
    
    return {"status": "ok", "id": str(notif.id)}


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for real-time notifications."""
    try:
        user = await get_user_from_token(token, db)
        user_id = user.id
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
