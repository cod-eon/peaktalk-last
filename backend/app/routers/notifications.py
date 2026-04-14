import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification, PushSubscription
from app.models.user import User

router = APIRouter()

class SubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict

class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str | None
    is_read: bool
    created_at: Any

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
    return {"message": "Subscription saved"}


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
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    await db.commit()
    return {"message": "Marked as read"}


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
    )
    db.add(notif)
    await db.flush()
    return {"status": "ok", "id": str(notif.id)}

