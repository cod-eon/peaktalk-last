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


@pytest.mark.asyncio
async def test_logto_identity_is_provisioned_and_reused(db_session, monkeypatch):
    local_subject = f"user-{uuid.uuid4()}"
    profile = LogtoProfile(subject=local_subject, email="Founder@PeakTalk.io")

    async def fake_validate(_token: str) -> LogtoProfile:
        return profile

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
