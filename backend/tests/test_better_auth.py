import httpx
import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.dependencies import _resolve_better_auth_user
from app.services import better_auth
from app.services.better_auth import BetterAuthError, BetterAuthProfile, validate_websocket_origin


def _request(method="POST", origin=None, referer=None):
    headers=[]
    if origin: headers.append((b"origin", origin.encode()))
    if referer: headers.append((b"referer", referer.encode()))
    return Request({"type":"http", "method":method, "path":"/", "headers":headers})


def test_unsafe_origin_requires_exact_allowlist(monkeypatch):
    monkeypatch.setattr(better_auth.settings, "allowed_origins", "https://peaktalk.ru")
    better_auth.validate_unsafe_request_origin(_request(origin="https://peaktalk.ru"))
    with pytest.raises(BetterAuthError, match="invalid_origin"):
        better_auth.validate_unsafe_request_origin(_request(origin="https://evil.example"))
    with pytest.raises(BetterAuthError, match="invalid_origin"):
        better_auth.validate_unsafe_request_origin(_request())


def test_websocket_origin_requires_exact_allowlist(monkeypatch):
    monkeypatch.setattr(better_auth.settings, "allowed_origins", "https://peaktalk.ru")
    validate_websocket_origin("https://peaktalk.ru")
    with pytest.raises(BetterAuthError, match="invalid_origin"):
        validate_websocket_origin("https://evil.example")
    with pytest.raises(BetterAuthError, match="invalid_origin"):
        validate_websocket_origin(None)


@pytest.mark.asyncio
async def test_session_introspection_forwards_only_cookie_and_requires_verified_email(monkeypatch):
    seen = {}
    class Response:
        status_code = 200
        def json(self):
            return {"session":{"id":"s"}, "user":{"id":"ba-1","email":"User@Example.com","emailVerified":True}}
    class Client:
        def __init__(self, **kwargs): seen["options"] = kwargs
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def get(self, url, headers): seen.update(url=url, headers=headers); return Response()
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    profile = await better_auth.get_better_auth_profile("better-auth.session_token=opaque")
    assert profile == BetterAuthProfile("ba-1", "user@example.com")
    assert seen["headers"] == {"cookie":"better-auth.session_token=opaque", "accept":"application/json"}
    assert seen["options"]["follow_redirects"] is False


@pytest.mark.asyncio
async def test_unverified_session_is_rejected(monkeypatch):
    class Response:
        status_code = 200
        def json(self): return {"session":{"id":"s"}, "user":{"id":"ba-1","email":"u@example.com","emailVerified":False}}
    class Client:
        def __init__(self, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def get(self, *args, **kwargs): return Response()
    monkeypatch.setattr(httpx, "AsyncClient", Client)
    with pytest.raises(BetterAuthError, match="email_verification_required"):
        await better_auth.get_better_auth_profile("cookie=value")


@pytest.mark.asyncio
async def test_identity_is_provisioned_without_email_linking(db_session):
    profile = BetterAuthProfile("ba-subject", "new@example.com")
    first = await _resolve_better_auth_user(profile, db_session)
    second = await _resolve_better_auth_user(profile, db_session)
    assert first.id == second.id
    assert first.email == "new@example.com"
