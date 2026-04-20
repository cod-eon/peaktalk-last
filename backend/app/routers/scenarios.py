import hashlib
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.scenario import Scenario, ScenarioCategory
from app.models.scenario_analytics import ScenarioAnalytics
from app.models.user import User
from app.schemas.scenario import (
    ScenarioCategoryResponse,
    ScenarioDetailResponse,
    ScenarioListItemResponse,
    ScenariosListResponse,
)

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

_CATEGORY_LABELS = {
    ScenarioCategory.budget: "Бюджет",
    ScenarioCategory.roadmap: "Roadmap",
    ScenarioCategory.investors: "Инвесторы",
    ScenarioCategory.clients: "Клиенты",
    ScenarioCategory.people: "Люди",
    ScenarioCategory.crisis: "Кризис",
}

_PERSONA_LABELS = {
    "cfo": "CFO",
    "investor": "Инвестор",
    "board_member": "Совет директоров",
    "client": "Клиент",
    "hr": "HR",
    "tech_lead": "Tech Lead",
    "ceo": "CEO",
}


def _serialize_scenario(scenario: Scenario) -> ScenarioListItemResponse:
    return ScenarioListItemResponse(
        id=scenario.id,
        slug=scenario.slug,
        title=scenario.title,
        subtitle=scenario.subtitle,
        category=scenario.category.value,
        persona=_PERSONA_LABELS.get(scenario.recommended_persona, scenario.recommended_persona),
        difficulty=scenario.recommended_difficulty,
        recommended_difficulty=scenario.recommended_difficulty,
    )


@router.get("", response_model=ScenariosListResponse)
async def list_scenarios(
    category: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> ScenariosListResponse:
    stmt = select(Scenario).where(Scenario.is_active.is_(True))
    count_stmt = select(func.count()).select_from(Scenario).where(Scenario.is_active.is_(True))

    if category is not None:
        try:
            category_enum = ScenarioCategory(category)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Неизвестная категория сценария: {category}",
            ) from exc

        stmt = stmt.where(Scenario.category == category_enum)
        count_stmt = count_stmt.where(Scenario.category == category_enum)

    stmt = stmt.order_by(Scenario.is_featured.desc(), Scenario.title.asc())

    result = await db.execute(stmt)
    total = (await db.execute(count_stmt)).scalar_one()
    items = [_serialize_scenario(item) for item in result.scalars().all()]
    return ScenariosListResponse(items=items, total=total)


@router.get("/categories", response_model=list[ScenarioCategoryResponse])
async def list_scenario_categories(
    db: AsyncSession = Depends(get_db),
) -> list[ScenarioCategoryResponse]:
    result = await db.execute(
        select(Scenario.category, func.count(Scenario.id))
        .where(Scenario.is_active.is_(True))
        .group_by(Scenario.category)
    )

    counts = {category: count for category, count in result.all()}
    return [
        ScenarioCategoryResponse(
            id=category.value,
            label=_CATEGORY_LABELS.get(category, category.value),
            count=int(counts[category]),
        )
        for category in ScenarioCategory
        if category in counts
    ]


@router.get("/{slug}", response_model=ScenarioDetailResponse)
async def get_scenario(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> ScenarioDetailResponse:
    result = await db.execute(
        select(Scenario).where(Scenario.slug == slug, Scenario.is_active.is_(True))
    )
    scenario = result.scalar_one_or_none()
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сценарий не найден.")

    base = _serialize_scenario(scenario)
    return ScenarioDetailResponse(
        **base.model_dump(),
        situation=scenario.situation,
    )


@router.get("/daily/today")
async def get_daily_scenario(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    today = datetime.now(timezone.utc).date()
    seed = int(hashlib.md5(today.isoformat().encode()).hexdigest(), 16)

    result = await db.execute(
        select(Scenario)
        .where(Scenario.is_active.is_(True))
        .order_by(Scenario.id)
    )
    all_scenarios = result.scalars().all()
    if not all_scenarios:
        return {"scenario": None}

    chosen = all_scenarios[seed % len(all_scenarios)]
    serialized = _serialize_scenario(chosen)

    return {
        "date": today.isoformat(),
        "scenario": {
            **serialized.model_dump(),
            "situation": chosen.situation,
        },
    }


@router.get("/ranking")
async def get_scenario_ranking(
    request: Request,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(
            Scenario,
            func.coalesce(func.sum(ScenarioAnalytics.starts_count), 0).label("total_starts"),
            func.coalesce(func.sum(ScenarioAnalytics.completions_count), 0).label("total_completions"),
            func.coalesce(func.sum(ScenarioAnalytics.payments_count), 0).label("total_payments"),
        )
        .outerjoin(ScenarioAnalytics, ScenarioAnalytics.scenario_id == Scenario.id)
        .where(Scenario.is_active.is_(True))
        .group_by(Scenario.id)
        .order_by(desc("total_starts"))
        .limit(limit)
    )
    rows = result.all()
    return [
        {
            "id": str(scenario.id),
            "slug": scenario.slug,
            "title": scenario.title,
            "subtitle": scenario.subtitle,
            "category": scenario.category.value,
            "starts": int(row.total_starts),
            "completions": int(row.total_completions),
            "payments": int(row.total_payments),
        }
        for scenario, _, _, _ in rows
    ]


@router.post("/{scenario_id}/track-start")
async def track_scenario_start(
    request: Request,
    scenario_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    now = datetime.now(timezone.utc)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)

    result = await db.execute(
        select(ScenarioAnalytics).where(
            ScenarioAnalytics.scenario_id == scenario_id,
            ScenarioAnalytics.period_start == period_start,
        )
    )
    analytics = result.scalar_one_or_none()
    if analytics:
        analytics.starts_count += 1
    else:
        analytics = ScenarioAnalytics(
            scenario_id=scenario_id,
            period_start=period_start,
            period_end=period_end,
            starts_count=1,
        )
        db.add(analytics)
