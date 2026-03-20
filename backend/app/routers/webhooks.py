"""Supabase webhook handlers.

Set up in Supabase Dashboard → Database → Webhooks:
  - Table: auth.users
  - Events: DELETE
  - URL: https://<your-api>/webhooks/supabase/user-deleted
  - HTTP headers: Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>
"""

import logging
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User

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
