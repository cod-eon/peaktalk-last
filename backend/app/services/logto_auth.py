"""Strict validation of Logto access tokens for the staged auth migration."""

import asyncio
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


async def validate_access_token(token: str) -> LogtoProfile:
    """Validate JWT signature/claims, then obtain verified email from userinfo."""

    subject = await asyncio.to_thread(_decode_token, token)

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
