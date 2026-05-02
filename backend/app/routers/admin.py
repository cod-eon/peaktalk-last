"""Admin panel API for PeakTalk.

All endpoints require the authenticated user's email to be present in the
``admin_emails`` setting (comma-separated list). If the email is absent the
request is rejected with HTTP 403.

Set-plan endpoint is intentionally restricted: it only works in non-production
environments or when ``payments_enabled`` is False so it cannot be used to
bypass billing in live traffic.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select, distinct, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.subscription import (
    Payment,
    PaymentStatus,
    PlanType,
    Subscription,
    SubscriptionStatus,
    UsageCounter,
)
from app.models.guest import GuestSession
from app.models.app_setting import AppSetting
from app.models.simulation import SimulationSession
from app.models.user import User
from app.schemas.admin import (
    AdminChartsResponse,
    AdminPaymentItem,
    AdminPaymentsResponse,
    AdminStatsResponse,
    AdminSubscriptionItem,
    AdminSubscriptionsResponse,
    AdminUtmStatsResponse,
    AdminUserDetail,
    AdminUserItem,
    AdminUsersResponse,
    DayPoint,
    MaintenanceStatusResponse,
    MaintenanceUpdateRequest,
    SetPlanRequest,
    SetPlanResponse,
    UtmCampaignRow,
    UtmDayPoint,
    UtmMediumRow,
    UtmSourceRow,
)
from app.services.app_settings import MAINTENANCE_MODE_KEY, get_maintenance_mode, set_maintenance_mode

logger = logging.getLogger("peaktalk.admin")

router = APIRouter(prefix="/admin", tags=["admin"])

_PAID_PLANS = (PlanType.personal, PlanType.pro, PlanType.team, PlanType.starter)


# ---------------------------------------------------------------------------
# Auth guard
# ---------------------------------------------------------------------------


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the caller is in the admin email list."""
    allowed = settings.get_admin_emails()
    if not allowed or current_user.email not in allowed:
        logger.warning(
            "admin: unauthorised access attempt by user_id=%s email=%s",
            current_user.id,
            current_user.email,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"detail": "Доступ запрещён.", "code": "admin_required"},
        )
    return current_user


# ---------------------------------------------------------------------------
# Helper: ensure Subscription + UsageCounter exist for a user
# ---------------------------------------------------------------------------


async def _ensure_subscription(user_id: str, db: AsyncSession) -> Subscription:
    """Return existing Subscription or create a default starter one."""
    import uuid as _uuid

    result = await db.execute(
        select(Subscription).where(Subscription.user_id == _uuid.UUID(user_id))
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        sub = Subscription(
            user_id=_uuid.UUID(user_id),
            plan=PlanType.starter,
            status=SubscriptionStatus.active,
            period_start=datetime.now(timezone.utc),
        )
        db.add(sub)
        await db.flush()
        await db.refresh(sub)
    return sub


async def _ensure_usage_counter(user_id: str, db: AsyncSession) -> UsageCounter:
    """Return existing UsageCounter or create a zeroed one."""
    import uuid as _uuid

    result = await db.execute(
        select(UsageCounter).where(UsageCounter.user_id == _uuid.UUID(user_id))
    )
    counter = result.scalar_one_or_none()
    if counter is None:
        counter = UsageCounter(
            user_id=_uuid.UUID(user_id),
            simulations_used=0,
            documents_uploaded=0,
            period_start=datetime.now(timezone.utc),
        )
        db.add(counter)
        await db.flush()
        await db.refresh(counter)
    return counter


# ---------------------------------------------------------------------------
# GET /admin/stats
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminStatsResponse:
    """Aggregate dashboard statistics."""

    # Total users
    users_total_row = await db.execute(select(func.count(User.id)))
    users_total: int = users_total_row.scalar_one() or 0

    # Paid users = active subscription rows with a real paid plan.
    paying_users_row = await db.execute(
        select(func.count(distinct(Subscription.user_id))).where(
            and_(
                Subscription.plan.in_(_PAID_PLANS),
                Subscription.status == SubscriptionStatus.active,
            )
        )
    )
    paying_users: int = paying_users_row.scalar_one() or 0
    free_users: int = max(users_total - paying_users, 0)

    # Total simulations
    sims_total_row = await db.execute(select(func.count(SimulationSession.id)))
    total_simulations: int = sims_total_row.scalar_one() or 0

    # Simulations started today (UTC)
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    sims_today_row = await db.execute(
        select(func.count(SimulationSession.id)).where(
            SimulationSession.created_at >= today_start
        )
    )
    simulations_today: int = sims_today_row.scalar_one() or 0

    # Payments totals (succeeded only)
    pay_total_row = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.succeeded
        )
    )
    revenue_total_rub: Decimal = Decimal(str(pay_total_row.scalar_one() or 0))

    # Payments this calendar month
    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    pay_month_row = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            and_(
                Payment.status == PaymentStatus.succeeded,
                Payment.created_at >= month_start,
            )
        )
    )
    revenue_this_month_rub: Decimal = Decimal(str(pay_month_row.scalar_one() or 0))

    # Payments count (succeeded)
    pay_count_row = await db.execute(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.succeeded
        )
    )
    successful_payments_count: int = pay_count_row.scalar_one() or 0

    return AdminStatsResponse(
        total_users=users_total,
        paying_users=paying_users,
        free_users=free_users,
        total_simulations=total_simulations,
        simulations_today=simulations_today,
        revenue_total_rub=revenue_total_rub,
        revenue_this_month_rub=revenue_this_month_rub,
        successful_payments_count=successful_payments_count,
    )


@router.get("/maintenance", response_model=MaintenanceStatusResponse)
async def get_maintenance(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> MaintenanceStatusResponse:
    enabled = await get_maintenance_mode(db)
    result = await db.execute(select(AppSetting).where(AppSetting.key == MAINTENANCE_MODE_KEY))
    setting = result.scalar_one_or_none()
    return MaintenanceStatusResponse(
        enabled=enabled,
        updated_at=setting.updated_at if setting is not None else None,
    )


@router.post("/maintenance", response_model=MaintenanceStatusResponse)
async def update_maintenance(
    body: MaintenanceUpdateRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> MaintenanceStatusResponse:
    setting = await set_maintenance_mode(db, body.enabled)
    logger.warning("admin: maintenance mode changed enabled=%s by=%s", body.enabled, _admin.email)
    return MaintenanceStatusResponse(enabled=body.enabled, updated_at=setting.updated_at)


# ---------------------------------------------------------------------------
# GET /admin/charts
# ---------------------------------------------------------------------------


@router.get("/charts", response_model=AdminChartsResponse)
async def get_charts(
    days: int = Query(30, ge=7, le=90, description="Number of days to look back"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminChartsResponse:
    """Return day-by-day time-series for revenue, simulations, and new users."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Revenue per day (succeeded payments only)
    rev_rows = await db.execute(
        select(
            func.date(Payment.created_at).label("day"),
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
        )
        .where(
            and_(
                Payment.status == PaymentStatus.succeeded,
                Payment.created_at >= cutoff,
            )
        )
        .group_by(func.date(Payment.created_at))
        .order_by(func.date(Payment.created_at))
    )

    # Simulations per day
    sim_rows = await db.execute(
        select(
            func.date(SimulationSession.created_at).label("day"),
            func.count(SimulationSession.id).label("total"),
        )
        .where(SimulationSession.created_at >= cutoff)
        .group_by(func.date(SimulationSession.created_at))
        .order_by(func.date(SimulationSession.created_at))
    )

    # New users per day
    usr_rows = await db.execute(
        select(
            func.date(User.created_at).label("day"),
            func.count(User.id).label("total"),
        )
        .where(User.created_at >= cutoff)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )

    def to_points(rows: list) -> list[DayPoint]:
        return [DayPoint(date=str(row.day), value=float(row.total)) for row in rows]

    return AdminChartsResponse(
        revenue_by_day=to_points(rev_rows.all()),
        simulations_by_day=to_points(sim_rows.all()),
        users_by_day=to_points(usr_rows.all()),
    )


# ---------------------------------------------------------------------------
# GET /admin/users
# ---------------------------------------------------------------------------


@router.get("/users", response_model=AdminUsersResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, min_length=1, description="Filter by email substring"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUsersResponse:
    """Paginated list of all users with subscription and usage data."""

    offset = (page - 1) * per_page
    normalized_search = (search or "").strip().lower()
    filters = []
    if normalized_search:
        filters.append(func.lower(User.email).like(f"%{normalized_search}%"))

    # Total count
    total_query = select(func.count(User.id))
    if filters:
        total_query = total_query.where(*filters)
    total_row = await db.execute(total_query)
    total: int = total_row.scalar_one() or 0
    pages = max(math.ceil(total / per_page), 1)

    # Fetch users with LEFT JOINs to subscription and usage_counter
    users_query = select(User).order_by(User.created_at.desc()).offset(offset).limit(per_page)
    if filters:
        users_query = users_query.where(*filters)
    users_result = await db.execute(users_query)
    users = list(users_result.scalars().all())

    if not users:
        return AdminUsersResponse(items=[], total=total, page=page, per_page=per_page, pages=pages)

    user_ids = [u.id for u in users]

    # Batch-fetch subscriptions
    subs_result = await db.execute(
        select(Subscription).where(Subscription.user_id.in_(user_ids))
    )
    subs_by_user: dict = {s.user_id: s for s in subs_result.scalars().all()}

    # Batch-fetch usage counters
    counters_result = await db.execute(
        select(UsageCounter).where(UsageCounter.user_id.in_(user_ids))
    )
    counters_by_user: dict = {c.user_id: c for c in counters_result.scalars().all()}

    # Batch-fetch simulation totals per user
    sim_totals_result = await db.execute(
        select(SimulationSession.user_id, func.count(SimulationSession.id))
        .where(SimulationSession.user_id.in_(user_ids))
        .group_by(SimulationSession.user_id)
    )
    sim_totals_by_user: dict = {row[0]: row[1] for row in sim_totals_result.all()}

    items: list[AdminUserItem] = []
    for user in users:
        sub = subs_by_user.get(user.id)
        counter = counters_by_user.get(user.id)

        plan = sub.plan if sub else PlanType.starter
        sub_status = sub.status if sub else SubscriptionStatus.active
        period_end = sub.period_end if sub else None
        simulations_used = counter.simulations_used if counter else 0
        documents_uploaded = counter.documents_uploaded if counter else 0
        simulations_total = sim_totals_by_user.get(user.id, 0)

        items.append(
            AdminUserItem(
                id=user.id,
                email=user.email,
                created_at=user.created_at,
                plan=plan,
                subscription_status=sub_status,
                period_end=period_end,
                simulations_used=simulations_used,
                documents_uploaded=documents_uploaded,
                simulations_total=simulations_total,
            )
        )

    return AdminUsersResponse(items=items, total=total, page=page, per_page=per_page, pages=pages)


# ---------------------------------------------------------------------------
# GET /admin/users/{user_id}
# ---------------------------------------------------------------------------


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user_detail(
    user_id: str,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserDetail:
    """Full details for a single user."""

    import uuid as _uuid

    try:
        uid = _uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "Некорректный user_id.", "code": "invalid_uuid"},
        )

    user_row = await db.execute(select(User).where(User.id == uid))
    user = user_row.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Пользователь не найден.", "code": "user_not_found"},
        )

    sub_row = await db.execute(select(Subscription).where(Subscription.user_id == uid))
    sub = sub_row.scalar_one_or_none()

    counter_row = await db.execute(
        select(UsageCounter).where(UsageCounter.user_id == uid)
    )
    counter = counter_row.scalar_one_or_none()

    # Total simulations (all time)
    sim_total_row = await db.execute(
        select(func.count(SimulationSession.id)).where(
            SimulationSession.user_id == uid
        )
    )
    simulations_total: int = sim_total_row.scalar_one() or 0

    # Payment totals for this user
    pay_count_row = await db.execute(
        select(func.count(Payment.id)).where(
            and_(
                Payment.user_id == uid,
                Payment.status == PaymentStatus.succeeded,
            )
        )
    )
    payments_count: int = pay_count_row.scalar_one() or 0

    pay_sum_row = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            and_(
                Payment.user_id == uid,
                Payment.status == PaymentStatus.succeeded,
            )
        )
    )
    payments_total_rub: Decimal = Decimal(str(pay_sum_row.scalar_one() or 0))

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        created_at=user.created_at,
        plan=sub.plan if sub else PlanType.starter,
        subscription_status=sub.status if sub else SubscriptionStatus.active,
        period_start=sub.period_start if sub else None,
        period_end=sub.period_end if sub else None,
        subscription_created_at=sub.created_at if sub else None,
        cancelled_at=sub.cancelled_at if sub else None,
        simulations_used=counter.simulations_used if counter else 0,
        documents_uploaded=counter.documents_uploaded if counter else 0,
        simulations_total=simulations_total,
        payments_count=payments_count,
        payments_total_rub=payments_total_rub,
    )


# ---------------------------------------------------------------------------
# POST /admin/users/{user_id}/set-plan
# ---------------------------------------------------------------------------


@router.post(
    "/users/{user_id}/set-plan",
    response_model=SetPlanResponse,
    status_code=status.HTTP_200_OK,
)
async def set_user_plan(
    user_id: str,
    body: SetPlanRequest,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> SetPlanResponse:
    """Manually set a user's plan directly in the DB without going through payment.

    Restricted to non-production environments or when payments_enabled is False.
    """

    # Guard: disallow in production with payments enabled
    if settings.app_env == "production" and settings.payments_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "detail": (
                    "set-plan недоступен в production с включёнными платежами. "
                    "Используйте только в dev/staging или при payments_enabled=false."
                ),
                "code": "forbidden_in_production",
            },
        )

    import uuid as _uuid

    try:
        uid = _uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "Некорректный user_id.", "code": "invalid_uuid"},
        )

    # Verify user exists
    user_row = await db.execute(select(User).where(User.id == uid))
    user = user_row.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Пользователь не найден.", "code": "user_not_found"},
        )

    sub = await _ensure_subscription(user_id, db)
    now = datetime.now(timezone.utc)

    if body.plan == PlanType.per_session:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": (
                    "Разовые сессии не назначаются через смену подписки. "
                    "Для них используется отдельная покупка и session credits."
                ),
                "code": "unsupported_plan_for_admin_set_plan",
            },
        )

    sub.plan = body.plan
    sub.period_start = now
    sub.cancelled_at = None

    if body.plan in (PlanType.free, PlanType.starter):
        # Free and legacy starter are indefinite.
        sub.period_end = None
        sub.status = SubscriptionStatus.active
    else:
        sub.period_end = now + timedelta(days=body.period_days or 30)
        sub.status = SubscriptionStatus.active

    await db.flush()
    await db.refresh(sub)

    logger.info(
        "admin: set-plan user_id=%s plan=%s period_days=%s period_end=%s by admin=%s",
        user_id,
        body.plan.value,
        body.period_days,
        sub.period_end,
        _admin.email,
    )

    return SetPlanResponse(
        user_id=uid,
        plan=sub.plan,
        status=sub.status,
        period_start=sub.period_start,
        period_end=sub.period_end,
    )


# ---------------------------------------------------------------------------
# GET /admin/payments
# ---------------------------------------------------------------------------


@router.get("/payments", response_model=AdminPaymentsResponse)
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: PaymentStatus | None = Query(None, alias="status"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminPaymentsResponse:
    """Paginated list of all payments, newest first.

    Optionally filter by ``status`` query param (pending, succeeded, failed, refunded).
    """

    base_where = []
    if status_filter is not None:
        base_where.append(Payment.status == status_filter)

    # Total
    count_q = select(func.count(Payment.id))
    if base_where:
        count_q = count_q.where(*base_where)
    total_row = await db.execute(count_q)
    total: int = total_row.scalar_one() or 0
    pages = max(math.ceil(total / per_page), 1)

    # Rows with joined user email
    offset = (page - 1) * per_page
    data_q = (
        select(Payment, User.email)
        .outerjoin(User, User.id == Payment.user_id)
        .order_by(Payment.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    if base_where:
        data_q = data_q.where(*base_where)

    rows = await db.execute(data_q)

    items: list[AdminPaymentItem] = []
    for payment, user_email in rows.all():
        items.append(
            AdminPaymentItem(
                id=payment.id,
                user_id=payment.user_id,
                user_email=user_email,
                amount=payment.amount,
                currency=payment.currency,
                status=payment.status,
                description=payment.description,
                yookassa_payment_id=payment.yookassa_payment_id,
                created_at=payment.created_at,
            )
        )

    return AdminPaymentsResponse(items=items, total=total, page=page, per_page=per_page, pages=pages)


# ---------------------------------------------------------------------------
# GET /admin/subscriptions
# ---------------------------------------------------------------------------


@router.get("/subscriptions", response_model=AdminSubscriptionsResponse)
async def list_subscriptions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    plan_filter: PlanType | None = Query(None, alias="plan"),
    status_filter: SubscriptionStatus | None = Query(None, alias="status"),
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminSubscriptionsResponse:
    """Paginated list of all subscriptions with optional plan/status filters."""

    base_where = []
    if plan_filter is not None:
        base_where.append(Subscription.plan == plan_filter)
    if status_filter is not None:
        base_where.append(Subscription.status == status_filter)

    # Total
    count_q = select(func.count(Subscription.id))
    if base_where:
        count_q = count_q.where(*base_where)
    total_row = await db.execute(count_q)
    total: int = total_row.scalar_one() or 0
    pages = max(math.ceil(total / per_page), 1)

    offset = (page - 1) * per_page
    data_q = (
        select(Subscription, User.email)
        .join(User, User.id == Subscription.user_id)
        .order_by(Subscription.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    if base_where:
        data_q = data_q.where(*base_where)

    rows = await db.execute(data_q)

    items: list[AdminSubscriptionItem] = []
    for sub, user_email in rows.all():
        items.append(
            AdminSubscriptionItem(
                id=sub.id,
                user_id=sub.user_id,
                user_email=user_email,
                plan=sub.plan,
                status=sub.status,
                period_start=sub.period_start,
                period_end=sub.period_end,
                cancelled_at=sub.cancelled_at,
                created_at=sub.created_at,
            )
        )

    return AdminSubscriptionsResponse(
        items=items, total=total, page=page, per_page=per_page, pages=pages
    )


# ---------------------------------------------------------------------------
# DELETE /admin/guest-sessions/expired
# ---------------------------------------------------------------------------


@router.delete(
    "/guest-sessions/expired",
    status_code=status.HTTP_200_OK,
)
async def delete_expired_guest_sessions(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete all guest sessions whose expires_at is in the past.

    Safe to call repeatedly — idempotent. Returns the number of rows deleted.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        delete(GuestSession)
        .where(GuestSession.expires_at < now)
        .returning(GuestSession.id)
    )
    deleted_ids = result.fetchall()
    deleted_count = len(deleted_ids)
    await db.flush()

    logger.info(
        "admin: deleted %d expired guest sessions by admin=%s",
        deleted_count,
        _admin.email,
    )
    return {"deleted": deleted_count}


@router.get("/utm/stats", response_model=AdminUtmStatsResponse)
async def get_utm_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUtmStatsResponse:
    """UTM attribution statistics: breakdown by source, medium, campaign."""

    total_tracked = await db.scalar(
        select(func.count()).select_from(User).where(User.utm_source.isnot(None))
    ) or 0
    total_direct = await db.scalar(
        select(func.count()).select_from(User).where(User.utm_source == "direct")
    ) or 0

    # Sources
    src_rows = (
        await db.execute(
            select(
                func.coalesce(User.utm_source, "direct").label("source"),
                func.count().label("count"),
                func.min(User.created_at).label("first_at"),
                func.max(User.created_at).label("latest_at"),
            )
            .group_by(func.coalesce(User.utm_source, "direct"))
            .order_by(func.count().desc())
        )
    ).all()
    sources = [
        UtmSourceRow(
            source=r.source,
            count=r.count,
            pct=round(r.count / max(total_tracked, 1) * 100, 1),
            first_at=r.first_at,
            latest_at=r.latest_at,
        )
        for r in src_rows
    ]

    # Mediums
    med_rows = (
        await db.execute(
            select(
                func.coalesce(User.utm_medium, "(none)").label("medium"),
                func.count().label("count"),
            )
            .group_by(func.coalesce(User.utm_medium, "(none)"))
            .order_by(func.count().desc())
            .limit(20)
        )
    ).all()
    mediums = [UtmMediumRow(medium=r.medium, count=r.count) for r in med_rows]

    # Campaigns
    cam_rows = (
        await db.execute(
            select(
                func.coalesce(User.utm_campaign, "(none)").label("campaign"),
                func.count().label("count"),
            )
            .group_by(func.coalesce(User.utm_campaign, "(none)"))
            .order_by(func.count().desc())
            .limit(20)
        )
    ).all()
    campaigns = [UtmCampaignRow(campaign=r.campaign, count=r.count) for r in cam_rows]

    # By day (last 30 days)
    since = datetime.now(timezone.utc) - timedelta(days=30)
    day_rows = (
        await db.execute(
            select(
                func.date_trunc("day", User.created_at).label("date"),
                func.coalesce(User.utm_source, "direct").label("source"),
                func.count().label("count"),
            )
            .where(User.created_at >= since)
            .group_by("date", "source")
            .order_by("date")
        )
    ).all()
    by_day = [
        UtmDayPoint(
            date=r.date.strftime("%Y-%m-%d") if r.date else "",
            source=r.source,
            count=r.count,
        )
        for r in day_rows
    ]

    return AdminUtmStatsResponse(
        sources=sources,
        mediums=mediums,
        campaigns=campaigns,
        by_day=by_day,
        total_tracked=total_tracked,
        total_direct=total_direct,
    )
