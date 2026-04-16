from app.models.notification import Notification


def resolve_notification_target_url(notification: Notification) -> str:
    if notification.target_url:
        return notification.target_url

    type_to_url = {
        "simulation_ready": "/simulation",
        "analysis_ready": "/documents",
        "document_ready": "/documents",
        "payment_success": "/billing/success",
        "payment_failed": "/billing",
        "subscription_updated": "/billing",
        "settings": "/settings",
        "success": "/dashboard",
    }

    return type_to_url.get(notification.type or "", "/dashboard")


def serialize_notification(notification: Notification) -> dict:
    return {
        "id": str(notification.id),
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "target_url": resolve_notification_target_url(notification),
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }
