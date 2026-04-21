from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_setting import AppSetting

MAINTENANCE_MODE_KEY = "maintenance_mode"


async def get_setting(db: AsyncSession, key: str) -> str | None:
    result = await db.execute(select(AppSetting).where(AppSetting.key == key))
    item = result.scalar_one_or_none()
    return item.value if item is not None else None


async def set_setting(db: AsyncSession, key: str, value: str) -> AppSetting:
    result = await db.execute(select(AppSetting).where(AppSetting.key == key))
    item = result.scalar_one_or_none()
    if item is None:
        item = AppSetting(key=key, value=value)
        db.add(item)
        await db.flush()
        await db.refresh(item)
        return item

    item.value = value
    await db.flush()
    await db.refresh(item)
    return item


async def get_maintenance_mode(db: AsyncSession) -> bool:
    raw = await get_setting(db, MAINTENANCE_MODE_KEY)
    return (raw or "").strip().lower() == "true"


async def set_maintenance_mode(db: AsyncSession, enabled: bool) -> AppSetting:
    return await set_setting(db, MAINTENANCE_MODE_KEY, "true" if enabled else "false")
