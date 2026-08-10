"""Strict validation of Logto access tokens for the staged auth migration."""

import asyncio
import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any

import httpx
import jwt

from app.config import settings


class LogtoAuthError(ValueError):
    """Raised when a Logto token or user profile is not usable by PeakTalk."""


@dataclass(frozen=True)
class LogtoProfile:
    subject: str
    email: str


_jwks_client: jwt.PyJWKClient | None = None

# Logto OSS currently publishes an ES384/P-384 signing key. Keep RS256 in the
# allowlist for a controlled key rotation/configuration transition, but do not
# accept arbitrary algorithms from the token header.
_LOGTO_ALLOWED_ALGORITHMS = ["ES384", "RS256"]
_IDENTITY_ASSERTION_AUDIENCE = "peaktalk-api"
_IDENTITY_ASSERTION_MAX_TTL_SECONDS = 300
_IDENTITY_ASSERTION_CLOCK_SKEW_SECONDS = 60


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(settings.logto_jwks_uri, cache_jwk_set=True)
    return _jwks_client


def _validate_claims(claims: dict[str, Any]) -> str:
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise LogtoAuthError("Logto token has no subject")

    required_scopes = {scope for scope in settings.logto_required_scopes.split() if scope}
    token_scopes = set(str(claims.get("scope", "")).split())
    missing_scopes = required_scopes - token_scopes
    if missing_scopes:
        raise LogtoAuthError("Logto token is missing required scopes")

    return subject


def _decode_token(token: str) -> str:
    if not settings.logto_audience:
        raise LogtoAuthError("Logto audience is not configured")

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=_LOGTO_ALLOWED_ALGORITHMS,
            issuer=settings.logto_issuer,
            audience=settings.logto_audience,
            options={"require": ["exp", "iat", "iss", "sub", "aud"]},
        )
        return _validate_claims(claims)
    except LogtoAuthError:
        raise
    except Exception as exc:
        raise LogtoAuthError("Logto token validation failed") from exc


def _decode_base64url(value: str) -> bytes:
    try:
        return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
    except Exception as exc:
        raise LogtoAuthError("Logto identity assertion is malformed") from exc


def _validate_identity_assertion(assertion: str) -> LogtoProfile:
    """Verify identity claims signed by the trusted Next.js auth boundary."""

    secret = settings.logto_identity_assertion_secret
    if not secret:
        raise LogtoAuthError("Logto identity assertion secret is not configured")

    parts = assertion.split(".")
    if len(parts) != 2 or not all(parts):
        raise LogtoAuthError("Logto identity assertion is malformed")

    encoded_payload, encoded_signature = parts
    try:
        signed_value = encoded_payload.encode("ascii")
    except UnicodeEncodeError as exc:
        raise LogtoAuthError("Logto identity assertion is malformed") from exc
    expected_signature = hmac.new(secret.encode("utf-8"), signed_value, hashlib.sha256).digest()
    actual_signature = _decode_base64url(encoded_signature)
    if not hmac.compare_digest(actual_signature, expected_signature):
        raise LogtoAuthError("Logto identity assertion signature is invalid")

    try:
        payload = json.loads(_decode_base64url(encoded_payload))
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        raise LogtoAuthError("Logto identity assertion is malformed") from exc

    if not isinstance(payload, dict) or payload.get("aud") != _IDENTITY_ASSERTION_AUDIENCE:
        raise LogtoAuthError("Logto identity assertion audience is invalid")

    now = int(time.time())
    issued_at = payload.get("iat")
    expires_at = payload.get("exp")
    if (
        not isinstance(issued_at, int)
        or isinstance(issued_at, bool)
        or not isinstance(expires_at, int)
        or isinstance(expires_at, bool)
        or issued_at > now + _IDENTITY_ASSERTION_CLOCK_SKEW_SECONDS
        or expires_at <= now
        or expires_at - issued_at > _IDENTITY_ASSERTION_MAX_TTL_SECONDS
    ):
        raise LogtoAuthError("Logto identity assertion is expired or has an invalid lifetime")

    subject = payload.get("sub")
    email = payload.get("email")
    if (
        not isinstance(subject, str)
        or not subject
        or not isinstance(email, str)
        or not email.strip()
        or payload.get("email_verified") is not True
    ):
        raise LogtoAuthError("Logto account must have a verified email")

    return LogtoProfile(subject=subject, email=email.strip().lower())


async def validate_access_token(token: str, identity_assertion: str | None = None) -> LogtoProfile:
    """Validate the resource JWT and resolve a verified Logto identity.

    Logto resource access tokens are intentionally audience-bound JWTs and do
    not have to contain OIDC email claims. When the trusted Next.js session
    boundary supplies an assertion, validate it locally. The userinfo path
    remains for a compatibility transition where a validated token is accepted
    by Logto's userinfo endpoint.
    """

    subject = await asyncio.to_thread(_decode_token, token)

    if identity_assertion:
        profile = _validate_identity_assertion(identity_assertion)
        if profile.subject != subject:
            raise LogtoAuthError("Logto identity assertion subject mismatch")
        return profile

    try:
        async with httpx.AsyncClient(timeout=settings.logto_http_timeout_seconds) as client:
            response = await client.get(
                settings.logto_userinfo_url,
                headers={"Authorization": f"Bearer {token}"},
            )
        response.raise_for_status()
        profile = response.json()
    except Exception as exc:
        raise LogtoAuthError("Logto user profile lookup failed") from exc

    if profile.get("sub") != subject:
        raise LogtoAuthError("Logto user profile subject mismatch")

    email = profile.get("email")
    if not isinstance(email, str) or not email.strip() or profile.get("email_verified") is not True:
        raise LogtoAuthError("Logto account must have a verified email")

    return LogtoProfile(subject=subject, email=email.strip().lower())
