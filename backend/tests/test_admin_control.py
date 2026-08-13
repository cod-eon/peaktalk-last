from __future__ import annotations

import httpx
from sqlalchemy import select

from app.main import app
from app.main import _safe_request_path
from app.models.admin_audit import AdminAuditEvent
from app.models.user import User
from app.routers import admin as admin_router
from app.routers import admin_control
from app.services.better_auth import BetterAuthError, BetterAuthProfile


def test_admin_request_logs_redact_user_and_session_identifiers():
    assert _safe_request_path("/admin/control/users/user-secret") == "/admin/control/users/:user"
    assert _safe_request_path("/admin/control/users/user-secret/sessions/session-secret/revoke") == "/admin/control/users/:user/sessions/:session/revoke"


async def test_admin_control_signed_out_is_rejected(client):
    response = await client.get("/admin/control/users")
    assert response.status_code == 401


async def test_admin_control_ordinary_user_is_rejected(client, monkeypatch):
    async def ordinary_profile(_cookie):
        return BetterAuthProfile(subject="ordinary", email="ordinary@example.com", role="user")

    monkeypatch.setattr(admin_router, "get_better_auth_profile", ordinary_profile)
    response = await client.get("/admin/control/users", headers={"cookie": "session=ordinary"})
    assert response.status_code == 403


async def test_admin_control_forged_session_is_rejected(client, monkeypatch):
    async def forged_profile(_cookie):
        raise BetterAuthError("invalid_session")

    monkeypatch.setattr(admin_router, "get_better_auth_profile", forged_profile)
    response = await client.get("/admin/control/users", headers={"cookie": "session=forged"})
    assert response.status_code == 401


async def test_admin_control_admin_can_list_without_exposing_session_tokens(client, monkeypatch):
    async def admin_profile(_cookie):
        return BetterAuthProfile(subject="admin-subject", email="admin@example.com", role="admin")

    async def fake_admin_request(cookie, path, **kwargs):
        assert cookie == "session=admin"
        assert path == "admin/list-users"
        return httpx.Response(200, json={"users": [{"id": "ba-user-1", "name": "User", "email": "user@example.com", "emailVerified": True, "role": "user"}], "total": 1})

    monkeypatch.setattr(admin_router, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "better_auth_admin_request", fake_admin_request)
    response = await client.get("/admin/control/users", headers={"cookie": "session=admin"})
    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == "ba-user-1"
    assert "token" not in response.text


async def test_admin_control_user_detail_loads_user_sessions_and_redacts_tokens(client, monkeypatch):
    async def admin_profile(_cookie):
        return BetterAuthProfile(subject="admin-subject", email="admin@example.com", role="admin")

    async def fake_admin_request(cookie, path, **kwargs):
        assert cookie == "session=admin"
        if path == "admin/get-user":
            assert kwargs["method"] == "GET"
            assert kwargs["query"] == {"id": "ba-user-1"}
            return httpx.Response(200, json={"user": {"id": "ba-user-1", "name": "User", "email": "user@example.com", "emailVerified": True, "role": "user", "createdAt": "2026-08-13T09:00:00Z"}})
        assert path == "admin/list-user-sessions"
        assert kwargs["method"] == "POST"
        assert kwargs["body"] == {"userId": "ba-user-1"}
        return httpx.Response(200, json={"sessions": [{"id": "session-1", "token": "session-secret", "userId": "ba-user-1", "createdAt": "2026-08-13T10:00:00Z", "updatedAt": "2026-08-13T10:30:00Z", "expiresAt": "2026-08-14T10:00:00Z", "userAgent": "test-browser"}]})

    monkeypatch.setattr(admin_router, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "better_auth_admin_request", fake_admin_request)
    response = await client.get("/admin/control/users/ba-user-1", headers={"cookie": "session=admin"})
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "user@example.com"
    assert body["sessions"][0]["id"] == "session-1"
    assert "token" not in response.text


async def test_admin_control_list_forwards_sort_contract(client, monkeypatch):
    async def admin_profile(_cookie):
        return BetterAuthProfile(subject="admin-subject", email="admin@example.com", role="admin")

    async def fake_admin_request(cookie, path, **kwargs):
        assert path == "admin/list-users"
        assert kwargs["query"] == {
            "limit": 20,
            "offset": 0,
            "searchValue": "long@example.com",
            "searchField": "email",
            "sortBy": "email",
            "sortDirection": "asc",
        }
        return httpx.Response(200, json={"users": [], "total": 0})

    monkeypatch.setattr(admin_router, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "better_auth_admin_request", fake_admin_request)
    response = await client.get(
        "/admin/control/users?page=1&per_page=20&search=long%40example.com&sort_by=email&sort_direction=asc",
        headers={"cookie": "session=admin"},
    )
    assert response.status_code == 200
    assert response.json()["items"] == []


async def test_admin_overview_is_server_authorized(client, monkeypatch):
    async def ordinary_profile(_cookie):
        return BetterAuthProfile(subject="ordinary", email="ordinary@example.com", role="user")

    monkeypatch.setattr(admin_router, "get_better_auth_profile", ordinary_profile)
    response = await client.get("/admin/control/overview", headers={"cookie": "session=ordinary"})
    assert response.status_code == 403


async def test_admin_overview_returns_only_aggregate_data(client, monkeypatch):
    async def admin_profile(_cookie):
        return BetterAuthProfile(subject="admin-subject", email="admin@example.com", role="admin")

    monkeypatch.setattr(admin_router, "get_better_auth_profile", admin_profile)
    async def fake_stats(_db):
        return admin_control.AdminAuthStats(
            total_users=1,
            new_users_24h=1,
            new_users_7d=1,
            new_users_30d=1,
            verified_users=1,
            unverified_users=0,
            active_sessions=1,
            banned_users=0,
            role_distribution={"admin": 1},
        )

    async def fake_audit(_db):
        return []

    monkeypatch.setattr(admin_control, "_read_auth_stats", fake_stats)
    monkeypatch.setattr(admin_control, "_recent_audit", fake_audit)
    response = await client.get("/admin/control/overview", headers={"cookie": "session=admin"})
    assert response.status_code == 200
    body = response.json()
    assert body["stats"]["total_users"] == 1
    assert "password" not in response.text.lower()
    assert "token" not in response.text.lower()


async def test_rejected_admin_action_is_audited(client, db_session, monkeypatch):
    async def admin_profile(_cookie):
        return BetterAuthProfile(subject="admin-subject", email="admin@example.com", role="admin")

    monkeypatch.setattr(admin_router, "get_better_auth_profile", admin_profile)
    monkeypatch.setattr(admin_control, "get_better_auth_profile", admin_profile)
    response = await client.post(
        "/admin/control/users/ba-user-1/role",
        headers={"cookie": "session=admin"},
        json={"role": "admin", "confirm": False},
    )
    assert response.status_code == 400

    event = await db_session.scalar(
        select(AdminAuditEvent)
        .where(AdminAuditEvent.action == "role_change")
        .order_by(AdminAuditEvent.created_at.desc())
    )
    assert event is not None
    assert event.outcome == "rejected"
    assert event.event_metadata == {"status": 400}
