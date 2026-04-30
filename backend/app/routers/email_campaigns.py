"""Email campaigns: weekly scenario digest and one-off sends."""
import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.dependencies import get_current_user
from app.models.scenario import Scenario
from app.models.user import User
from app.services.email import send_weekly_scenario_email

logger = logging.getLogger("peaktalk.email_campaigns")

router = APIRouter(prefix="/email", tags=["email-campaigns"])


@router.post("/weekly-digest")
async def send_weekly_digest(
    request: Request,
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if current_user.email not in settings.get_admin_emails():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Доступ запрещён.", "code": "admin_required"},
        )

    today = datetime.now(timezone.utc).date()
    week_seed = today.isocalendar()[1]
    seed = int(hashlib.md5(str(week_seed).encode()).hexdigest(), 16)

    result = await db.execute(
        select(Scenario).where(Scenario.is_active.is_(True)).order_by(Scenario.id)
    )
    all_scenarios = result.scalars().all()
    if not all_scenarios:
        raise HTTPException(status_code=404, detail="Нет активных сценариев")

    scenario = all_scenarios[seed % len(all_scenarios)]

    _PERSONA_LABELS = {
        "cfo": "CFO / Финансовый директор",
        "investor": "Инвестор",
        "board": "Член совета директоров",
        "demanding_client": "Требовательный клиент",
        "hr": "HR-директор",
        "tech_lead": "Tech Lead",
        "ceo": "CEO",
        "exec_sponsor": "Исполнительный спонсор",
    }

    users_result = await db.execute(
        select(User).limit(limit)
    )
    users = users_result.scalars().all()

    sent = 0
    failed = 0
    for user in users:
        if not user.email:
            continue
        ok = await send_weekly_scenario_email(
            to_email=user.email,
            scenario_title=scenario.title,
            scenario_subtitle=scenario.subtitle,
            situation=scenario.situation[:500],
            persona=_PERSONA_LABELS.get(scenario.recommended_persona, scenario.recommended_persona),
            difficulty=scenario.recommended_difficulty,
            scenario_slug=scenario.slug,
        )
        if ok:
            sent += 1
        else:
            failed += 1

    return {
        "scenario": scenario.title,
        "slug": scenario.slug,
        "sent": sent,
        "failed": failed,
        "total_attempted": sent + failed,
    }
