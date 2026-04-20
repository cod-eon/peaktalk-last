from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.app_setting import AppSetting
from app.schemas.admin import MaintenanceStatusResponse
from app.services.app_settings import MAINTENANCE_MODE_KEY, get_maintenance_mode

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/maintenance", response_model=MaintenanceStatusResponse)
async def get_maintenance_status(
    db: AsyncSession = Depends(get_db),
) -> MaintenanceStatusResponse:
    enabled = await get_maintenance_mode(db)
    result = await db.execute(select(AppSetting).where(AppSetting.key == MAINTENANCE_MODE_KEY))
    setting = result.scalar_one_or_none()
    return MaintenanceStatusResponse(
        enabled=enabled,
        updated_at=setting.updated_at if setting is not None else None,
    )
