import base64
import hashlib
import hmac
import json
import time
import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.config import settings
from app.dependencies import _get_logto_user
from app.models.user_identity import UserIdentity
from app.services import logto_auth
from app.services.logto_auth import LogtoAuthError, LogtoProfile


def test_logto_claims_require_subject_and_configured_scopes(monkeypatch):
    monkeypatch.setattr(settings, "logto_required_scopes", "openid email")

    with pytest.raises(LogtoAuthError):
        logto_auth._validate_claims({"sub": "user-1", "scope": "openid"})

    assert logto_auth._validate_claims(
        {"sub": "user-1", "scope": "openid email"}
    ) == "user-1"


def test_logto_decode_accepts_current_es384_signing_algorithm(monkeypatch):
    class FakeSigningKey:
        key = object()

    class FakeJwksClient:
        def get_signing_key_from_jwt(self, token):
            assert token == "token"
            return FakeSigningKey()

    decoded = {}

    def fake_decode(token, key, *, algorithms, issuer, audience, options):
        decoded.update(
            token=token,
            key=key,
            algorithms=algorithms,
            issuer=issuer,
            audience=audience,
            options=options,
        )
        return {"sub": "user-1", "scope": ""}

    monkeypatch.setattr(logto_auth, "_get_jwks_client", lambda: FakeJwksClient())
    monkeypatch.setattr(logto_auth.jwt, "decode", fake_decode)
    monkeypatch.setattr(settings, "logto_issuer", "https://auth.example/oidc")
    monkeypatch.setattr(settings, "logto_audience", "https://app.example/api")
    monkeypatch.setattr(settings, "logto_required_scopes", "")

    assert logto_auth._decode_token("token") == "user-1"
    assert decoded["algorithms"] == ["ES384", "RS256"]


def _make_identity_assertion(secret: str, **overrides: object) -> str:
    now = int(time.time())
    payload = {
        "aud": "peaktalk-api",
        "sub": "user-1",
        "email": "founder@peaktalk.io",
        "email_verified": True,
        "iat": now,
        "exp": now + 300,
        **overrides,
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{encoded}.{encoded_signature}"


def test_logto_identity_assertion_requires_valid_signature_and_verified_email(monkeypatch):
    secret = "identity-secret"
    monkeypatch.setattr(settings, "logto_identity_assertion_secret", secret)

    profile = logto_auth._validate_identity_assertion(_make_identity_assertion(secret))
    assert profile == LogtoProfile(subject="user-1", email="founder@peaktalk.io")

    with pytest.raises(LogtoAuthError):
        logto_auth._validate_identity_assertion(_make_identity_assertion(secret, email_verified=False))

    with pytest.raises(LogtoAuthError):
        logto_auth._validate_identity_assertion(f"{profile.subject}.invalid")


@pytest.mark.asyncio
async def test_logto_resource_jwt_uses_identity_assertion_without_userinfo(monkeypatch):
    secret = "identity-secret"
    monkeypatch.setattr(settings, "logto_identity_assertion_secret", secret)
    monkeypatch.setattr(logto_auth, "_decode_token", lambda _token: "user-1")

    class FailingClient:
        async def __aenter__(self):
            raise AssertionError("userinfo must not be called for a signed identity assertion")

        async def __aexit__(self, *_args):
            return False

    monkeypatch.setattr(logto_auth.httpx, "AsyncClient", lambda **_kwargs: FailingClient())
    profile = await logto_auth.validate_access_token(
        "resource-jwt", _make_identity_assertion(secret)
    )
    assert profile.email == "founder@peaktalk.io"


@pytest.mark.asyncio
async def test_logto_identity_is_provisioned_and_reused(db_session, monkeypatch):
    local_subject = f"user-{uuid.uuid4()}"
    profile = LogtoProfile(subject=local_subject, email="Founder@PeakTalk.io")

    async def fake_validate(_token: str, _identity_assertion: str | None = None) -> LogtoProfile:
        return profile

    monkeypatch.setattr("app.dependencies._decode_token", lambda _token: local_subject)
    monkeypatch.setattr("app.dependencies.validate_access_token", fake_validate)
    credentials_exception = HTTPException(status_code=401, detail="invalid")

    first = await _get_logto_user("token", db_session, credentials_exception)
    await db_session.commit()
    second = await _get_logto_user("token", db_session, credentials_exception)

    assert first.id == second.id
    assert first.email == "founder@peaktalk.io"
    identities = (
        await db_session.execute(
            select(UserIdentity).where(UserIdentity.subject == local_subject)
        )
    ).scalars().all()
    assert len(identities) == 1
    assert identities[0].user_id == first.id


@pytest.mark.asyncio
async def test_logto_rejects_validation_failure(db_session, monkeypatch):
    async def reject(_token: str) -> LogtoProfile:
        raise LogtoAuthError("invalid")

    monkeypatch.setattr("app.dependencies.validate_access_token", reject)
    credentials_exception = HTTPException(status_code=401, detail="invalid")

    with pytest.raises(HTTPException) as error:
        await _get_logto_user("token", db_session, credentials_exception)

    assert error.value.status_code == 401
