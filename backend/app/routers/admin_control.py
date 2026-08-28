"""PeakTalk-owned admin control room backed by Better Auth Admin endpoints."""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, desc, func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.admin_audit import AdminAuditEvent
from app.models.user import User
from app.services.better_auth import (
    BetterAuthError,
    better_auth_admin_request,
    get_better_auth_profile,
)
from app.routers.admin import require_admin

router = APIRouter(prefix="/admin/control", tags=["admin-control"])


class AdminSession(BaseModel):
    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    expires_at: datetime | None = None
    user_agent: str | None = None


class AdminUser(BaseModel):
    id: str
    name: str
    email: str
    email_verified: bool
    role: str | None = None
    banned: bool = False
    ban_reason: str | None = None
    ban_expires: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    active_sessions: int = 0
    last_activity: datetime | None = None


class AdminUsersResponse(BaseModel):
    items: list[AdminUser]
    total: int
    page: int
    per_page: int
    pages: int


class AuditItem(BaseModel):
    actor: str
    target: str | None
    action: str
    outcome: str
    timestamp: datetime
    metadata: dict


class AdminUserDetail(AdminUser):
    sessions: list[AdminSession]
    audit: list[AuditItem] = Field(default_factory=list)


class ConfirmedRoleChange(BaseModel):
    role: Literal["admin", "user"]
    confirm: bool = False


class ConfirmedBan(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
    confirm: bool = False


class AuditResponse(BaseModel):
    items: list[AuditItem]
    total: int
    page: int
    per_page: int
    pages: int


class AdminAuthStats(BaseModel):
    total_users: int
    new_users_24h: int
    new_users_7d: int
    new_users_30d: int
    verified_users: int
    unverified_users: int
    active_sessions: int
    banned_users: int
    role_distribution: dict[str, int]


class AdminOverviewResponse(BaseModel):
    stats: AdminAuthStats
    recent_events: list[AuditItem]


class AdminAuthResponse(BaseModel):
    provider: str
    status: str
    stats: AdminAuthStats
    safe_config: dict[str, str | bool]
    recent_events: list[AuditItem]


async def _admin_profile(request: Request):
    try:
        profile = await get_better_auth_profile(request.headers.get("cookie"))
    except BetterAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"detail": "Authentication required.", "code": exc.code}) from exc
    return profile


def _parse_user(value: dict) -> AdminUser:
    return AdminUser(
        id=str(value.get("id", "")),
        name=str(value.get("name") or ""),
        email=str(value.get("email") or ""),
        email_verified=value.get("emailVerified") is True,
        role=value.get("role") if isinstance(value.get("role"), str) else None,
        banned=value.get("banned") is True,
        ban_reason=value.get("banReason") if isinstance(value.get("banReason"), str) else None,
        ban_expires=value.get("banExpires"),
        created_at=value.get("createdAt"),
        updated_at=value.get("updatedAt"),
    )


async def _attach_session_summaries(db: AsyncSession, users: list[AdminUser]) -> list[AdminUser]:
    """Enrich the Better Auth user payload without returning session tokens."""
    user_ids = [user.id for user in users if user.id]
    if not user_ids:
        return users
    try:
        query = text(
            'SELECT "userId" AS user_id, COUNT(*) AS active_sessions, '
            'MAX("updatedAt") AS last_activity FROM "session" '
            'WHERE "userId" IN :user_ids AND "expiresAt" > CURRENT_TIMESTAMP '
            'GROUP BY "userId"'
        ).bindparams(bindparam("user_ids", expanding=True))
        rows = (await db.execute(query, {"user_ids": user_ids})).mappings().all()
    except SQLAlchemyError:
        # The Better Auth tables are owned by the auth migration. Keep the
        # control endpoint readable during an incomplete local bootstrap;
        # production migration review still treats missing tables as a gate.
        return users
    summaries = {str(row["user_id"]): row for row in rows}
    return [
        user.model_copy(update={
            "active_sessions": int(summaries.get(user.id, {}).get("active_sessions") or 0),
            "last_activity": summaries.get(user.id, {}).get("last_activity"),
        })
        for user in users
    ]


async def _read_auth_stats(db: AsyncSession) -> AdminAuthStats:
    """Read non-sensitive Better Auth inventory from its existing tables."""
    now = datetime.now(timezone.utc)
    cutoffs = {
        "day": now - timedelta(days=1),
        "week": now - timedelta(days=7),
        "month": now - timedelta(days=30),
    }
    # Better Auth owns these tables; this endpoint only reads aggregate values.
    totals = (
        await db.execute(
            text(
                'SELECT COUNT(*) AS total_users, '
                'SUM(CASE WHEN "emailVerified" IS TRUE THEN 1 ELSE 0 END) AS verified_users, '
                'SUM(CASE WHEN "emailVerified" IS TRUE THEN 0 ELSE 1 END) AS unverified_users, '
                'SUM(CASE WHEN "banned" IS TRUE THEN 1 ELSE 0 END) AS banned_users, '
                'SUM(CASE WHEN "createdAt" >= :day_cutoff THEN 1 ELSE 0 END) AS new_users_24h, '
                'SUM(CASE WHEN "createdAt" >= :week_cutoff THEN 1 ELSE 0 END) AS new_users_7d, '
                'SUM(CASE WHEN "createdAt" >= :month_cutoff THEN 1 ELSE 0 END) AS new_users_30d '
                'FROM "user"'
            ),
            {
                "day_cutoff": cutoffs["day"],
                "week_cutoff": cutoffs["week"],
                "month_cutoff": cutoffs["month"],
            },
        )
    ).mappings().one()
    active_sessions = int(
        (await db.scalar(text('SELECT COUNT(*) FROM "session" WHERE "expiresAt" > :now'), {"now": now})) or 0
    )
    role_rows = (
        await db.execute(
            text('SELECT COALESCE("role", \'user\') AS role, COUNT(*) AS count FROM "user" GROUP BY COALESCE("role", \'user\')')
        )
    ).mappings().all()
    role_distribution = {str(row["role"]): int(row["count"] or 0) for row in role_rows}
    return AdminAuthStats(
        total_users=int(totals["total_users"] or 0),
        new_users_24h=int(totals["new_users_24h"] or 0),
        new_users_7d=int(totals["new_users_7d"] or 0),
        new_users_30d=int(totals["new_users_30d"] or 0),
        verified_users=int(totals["verified_users"] or 0),
        unverified_users=int(totals["unverified_users"] or 0),
        active_sessions=active_sessions,
        banned_users=int(totals["banned_users"] or 0),
        role_distribution=role_distribution,
    )


async def _recent_audit(db: AsyncSession, limit: int = 12) -> list[AuditItem]:
    rows = (
        await db.execute(
            select(AdminAuditEvent)
            .order_by(desc(AdminAuditEvent.created_at))
            .limit(limit)
        )
    ).scalars().all()
    return [
        AuditItem(
            actor=row.actor_user_id,
            target=row.target_user_id,
            action=row.action,
            outcome=row.outcome,
            timestamp=row.created_at,
            metadata=row.event_metadata,
        )
        for row in rows
    ]


def _admin_request_origin(request: Request) -> str | None:
    """Supply Better Auth's CSRF origin for server-side admin calls.

    A browser GET to the detail endpoint may not include Origin, while the
    endpoint internally makes a cookie-authenticated POST to list sessions.
    Only read-only outer requests may use the configured, allowlisted frontend
    origin as the internal request origin. Mutations must carry a browser
    origin and are rejected by Better Auth when it is absent or invalid.
    """
    origin = request.headers.get("origin")
    if origin:
        return origin

    referer = request.headers.get("referer")
    if referer:
        parsed_referer = urlsplit(referer)
        if parsed_referer.scheme in {"http", "https"} and parsed_referer.netloc:
            return f"{parsed_referer.scheme}://{parsed_referer.netloc}"

    if request.method.upper() in {"GET", "HEAD"}:
        parsed_frontend = urlsplit(settings.frontend_url)
        if parsed_frontend.scheme in {"http", "https"} and parsed_frontend.netloc:
            candidate = f"{parsed_frontend.scheme}://{parsed_frontend.netloc}"
            if candidate in set(settings.get_allowed_origins()):
                return candidate
    return None


def _parse_session(value: dict) -> AdminSession:
    return AdminSession(
        id=str(value.get("id", "")),
        created_at=value.get("createdAt"),
        updated_at=value.get("updatedAt"),
        expires_at=value.get("expiresAt"),
        user_agent=value.get("userAgent") if isinstance(value.get("userAgent"), str) else None,
    )


async def _call_auth(request: Request, path: str, *, method: str = "GET", query: dict | None = None, body: dict | None = None) -> dict:
    try:
        response = await better_auth_admin_request(
            request.headers.get("cookie"),
            path,
            method=method,
            query=query,
            body=body,
            origin=_admin_request_origin(request),
        )
    except BetterAuthError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"detail": "Auth service unavailable.", "code": exc.code}) from exc
    if response.status_code >= 400:
        mapped = {400: 400, 401: 401, 403: 403, 404: 404, 422: 422}.get(response.status_code, 502)
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = {}
        error_value = error_payload.get("error") if isinstance(error_payload, dict) else None
        if not isinstance(error_value, dict):
            error_value = error_payload if isinstance(error_payload, dict) else {}
        safe_message = error_value.get("message") or error_value.get("detail")
        safe_code = error_value.get("code")
        raise HTTPException(
            status_code=mapped,
            detail={
                "message": safe_message if isinstance(safe_message, str) else "Admin action rejected.",
                "code": safe_code if isinstance(safe_code, str) else "better_auth_admin_rejected",
            },
        )
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail={"detail": "Invalid auth service response.", "code": "invalid_auth_response"}) from exc
    return payload if isinstance(payload, dict) else {}


async def _audit(db: AsyncSession, *, actor: str, target: str | None, action: str, outcome: str, metadata: dict | None = None) -> None:
    safe_metadata = metadata or {}
    db.add(AdminAuditEvent(actor_user_id=actor, target_user_id=target, action=action, outcome=outcome, event_metadata=safe_metadata))
    await db.flush()


async def _with_rejected_audit(db: AsyncSession, actor: str, target: str | None, action: str, exc: HTTPException) -> None:
    try:
        await _audit(db, actor=actor, target=target, action=action, outcome="rejected", metadata={"status": exc.status_code})
        # The request dependency rolls back when the endpoint raises. Commit
        # this isolated audit event before propagating the rejection.
        await db.commit()
    except Exception:
        await db.rollback()


@router.get("/users", response_model=AdminUsersResponse)
async def list_control_users(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=255),
    sort_by: Literal["createdAt", "updatedAt", "email"] = Query("createdAt"),
    sort_direction: Literal["asc", "desc"] = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AdminUsersResponse:
    offset = (page - 1) * per_page
    payload = await _call_auth(request, "admin/list-users", query={"limit": per_page, "offset": offset, "searchValue": search or None, "searchField": "email", "sortBy": sort_by, "sortDirection": sort_direction})
    total = int(payload.get("total") or 0)
    pages = max(math.ceil(total / per_page), 1)
    users = payload.get("users") if isinstance(payload.get("users"), list) else []
    parsed = [
        _parse_user(item)
        for item in users
        if isinstance(item, dict)
    ]
    return AdminUsersResponse(items=await _attach_session_summaries(db, parsed), total=total, page=page, per_page=per_page, pages=pages)


@router.get("/overview", response_model=AdminOverviewResponse)
async def get_control_overview(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AdminOverviewResponse:
    return AdminOverviewResponse(stats=await _read_auth_stats(db), recent_events=await _recent_audit(db))


@router.get("/auth", response_model=AdminAuthResponse)
async def get_auth_overview(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AdminAuthResponse:
    return AdminAuthResponse(
        provider="better-auth",
        status="operational",
        stats=await _read_auth_stats(db),
        safe_config={
            "session_storage": "database",
            "email_verification_required": True,
            "admin_role_server_enforced": True,
            "sensitive_values_exposed": False,
        },
        recent_events=await _recent_audit(db),
    )


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_control_user(
    request: Request,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AdminUserDetail:
    user_payload = await _call_auth(request, "admin/get-user", query={"id": user_id})
    user_value = user_payload.get("user") if isinstance(user_payload.get("user"), dict) else user_payload
    sessions_payload = await _call_auth(request, "admin/list-user-sessions", method="POST", body={"userId": user_id})
    sessions = sessions_payload.get("sessions") if isinstance(sessions_payload.get("sessions"), list) else []
    audit_rows = (
        await db.execute(
            select(AdminAuditEvent)
            .where(AdminAuditEvent.target_user_id == user_id)
            .order_by(desc(AdminAuditEvent.created_at))
            .limit(20)
        )
    ).scalars().all()
    parsed_sessions = [_parse_session(item) for item in sessions if isinstance(item, dict)]
    last_activity = max((session.updated_at or session.created_at for session in parsed_sessions if session.updated_at or session.created_at), default=None)
    parsed_user = _parse_user(user_value).model_copy(update={"active_sessions": len(parsed_sessions), "last_activity": last_activity})
    return AdminUserDetail(
        **parsed_user.model_dump(),
        sessions=parsed_sessions,
        audit=[AuditItem(actor=row.actor_user_id, target=row.target_user_id, action=row.action, outcome=row.outcome, timestamp=row.created_at, metadata=row.event_metadata) for row in audit_rows],
    )


async def _mutation_context(request: Request):
    profile = await _admin_profile(request)
    return profile


@router.post("/users/{user_id}/role", response_model=AdminUser)
async def change_role(request: Request, user_id: str, body: ConfirmedRoleChange, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)) -> AdminUser:
    profile = await _mutation_context(request)
    if not body.confirm:
        exc = HTTPException(status_code=400, detail={"detail": "Explicit confirmation is required.", "code": "confirmation_required"})
        await _with_rejected_audit(db, profile.subject, user_id, "role_change", exc)
        raise exc
    if user_id == profile.subject and body.role != "admin":
        exc = HTTPException(status_code=400, detail={"detail": "You cannot remove your own admin role.", "code": "self_demotion_forbidden"})
        await _with_rejected_audit(db, profile.subject, user_id, "role_change", exc)
        raise exc
    try:
        payload = await _call_auth(request, "admin/set-role", method="POST", body={"userId": user_id, "role": body.role})
    except HTTPException as exc:
        await _with_rejected_audit(db, profile.subject, user_id, "role_change", exc)
        raise
    await _audit(db, actor=profile.subject, target=user_id, action="role_change", outcome="success", metadata={"role": body.role})
    return _parse_user(payload.get("user", payload))


@router.post("/users/{user_id}/ban", response_model=AdminUser)
async def ban_control_user(request: Request, user_id: str, body: ConfirmedBan, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)) -> AdminUser:
    profile = await _mutation_context(request)
    if not body.confirm:
        exc = HTTPException(status_code=400, detail={"detail": "Explicit confirmation is required.", "code": "confirmation_required"})
        await _with_rejected_audit(db, profile.subject, user_id, "ban", exc)
        raise exc
    try:
        payload = await _call_auth(request, "admin/ban-user", method="POST", body={"userId": user_id, "banReason": body.reason})
    except HTTPException as exc:
        await _with_rejected_audit(db, profile.subject, user_id, "ban", exc)
        raise
    await _audit(db, actor=profile.subject, target=user_id, action="ban", outcome="success", metadata={"reason_length": len(body.reason)})
    return _parse_user(payload.get("user", payload))


@router.post("/users/{user_id}/unban", response_model=AdminUser)
async def unban_control_user(request: Request, user_id: str, body: ConfirmedBan, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)) -> AdminUser:
    profile = await _mutation_context(request)
    if not body.confirm or not body.reason.strip():
        exc = HTTPException(status_code=400, detail={"detail": "A reason and explicit confirmation are required.", "code": "confirmation_required"})
        await _with_rejected_audit(db, profile.subject, user_id, "unban", exc)
        raise exc
    try:
        payload = await _call_auth(request, "admin/unban-user", method="POST", body={"userId": user_id})
    except HTTPException as exc:
        await _with_rejected_audit(db, profile.subject, user_id, "unban", exc)
        raise
    await _audit(db, actor=profile.subject, target=user_id, action="unban", outcome="success", metadata={"reason_length": len(body.reason)})
    return _parse_user(payload.get("user", payload))


@router.post("/users/{user_id}/sessions/revoke-all")
async def revoke_all_sessions(request: Request, user_id: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)) -> dict:
    profile = await _mutation_context(request)
    try:
        await _call_auth(request, "admin/revoke-user-sessions", method="POST", body={"userId": user_id})
    except HTTPException as exc:
        await _with_rejected_audit(db, profile.subject, user_id, "revoke_all_sessions", exc)
        raise
    await _audit(db, actor=profile.subject, target=user_id, action="revoke_all_sessions", outcome="success")
    return {"success": True}


@router.post("/users/{user_id}/sessions/{session_id}/revoke")
async def revoke_one_session(request: Request, user_id: str, session_id: str, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)) -> dict:
    profile = await _mutation_context(request)
    try:
        sessions_payload = await _call_auth(request, "admin/list-user-sessions", method="POST", body={"userId": user_id})
        sessions = sessions_payload.get("sessions") if isinstance(sessions_payload.get("sessions"), list) else []
        session = next((item for item in sessions if isinstance(item, dict) and str(item.get("id")) == session_id), None)
        if not session or not isinstance(session.get("token"), str):
            raise HTTPException(status_code=404, detail={"detail": "Session not found.", "code": "session_not_found"})
        await _call_auth(request, "admin/revoke-user-session", method="POST", body={"sessionToken": session["token"]})
    except HTTPException as exc:
        await _with_rejected_audit(db, profile.subject, user_id, "revoke_session", exc)
        raise
    await _audit(db, actor=profile.subject, target=user_id, action="revoke_session", outcome="success", metadata={"session_id": session_id})
    return {"success": True}


@router.get("/audit", response_model=AuditResponse)
async def list_audit(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AuditResponse:
    total = int((await db.scalar(select(func.count(AdminAuditEvent.id)))) or 0)
    rows = (await db.execute(select(AdminAuditEvent).order_by(desc(AdminAuditEvent.created_at)).offset((page - 1) * per_page).limit(per_page))).scalars().all()
    return AuditResponse(items=[AuditItem(actor=row.actor_user_id, target=row.target_user_id, action=row.action, outcome=row.outcome, timestamp=row.created_at, metadata=row.event_metadata) for row in rows], total=total, page=page, per_page=per_page, pages=max(math.ceil(total / per_page), 1))
