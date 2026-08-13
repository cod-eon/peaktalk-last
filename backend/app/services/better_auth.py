"""Server-side Better Auth session introspection for FastAPI authorization."""

from dataclasses import dataclass
from urllib.parse import urlsplit

import httpx
from fastapi import Request

from app.config import settings


class BetterAuthError(ValueError):
    """Stable, non-sensitive Better Auth rejection category."""

    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class BetterAuthProfile:
    subject: str
    email: str


def _origin(value: str) -> str | None:
    try:
        parsed = urlsplit(value)
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def _validate_origin(origin: str | None, referer: str | None = None) -> None:
    allowed = set(settings.get_allowed_origins())
    candidate = origin or (_origin(referer) if referer else None)
    if candidate not in allowed:
        raise BetterAuthError("invalid_origin")


def validate_unsafe_request_origin(request: Request) -> None:
    if request.method.upper() in {"GET", "HEAD", "OPTIONS"}:
        return
    _validate_origin(request.headers.get("origin"), request.headers.get("referer"))


def validate_websocket_origin(origin: str | None) -> None:
    """Reject cross-site WebSocket handshakes before cookie authentication."""
    _validate_origin(origin)


async def get_better_auth_profile(cookie_header: str | None) -> BetterAuthProfile:
    if not cookie_header:
        raise BetterAuthError("missing_session")

    try:
        async with httpx.AsyncClient(
            timeout=settings.better_auth_http_timeout_seconds,
            follow_redirects=False,
        ) as client:
            response = await client.get(
                settings.better_auth_session_url,
                headers={"cookie": cookie_header, "accept": "application/json"},
            )
    except httpx.HTTPError as exc:
        raise BetterAuthError("session_service_unavailable") from exc

    if response.status_code != 200:
        raise BetterAuthError("invalid_session")
    try:
        payload = response.json()
    except ValueError as exc:
        raise BetterAuthError("invalid_session_response") from exc

    user = payload.get("user") if isinstance(payload, dict) else None
    session = payload.get("session") if isinstance(payload, dict) else None
    if not isinstance(user, dict) or not isinstance(session, dict):
        raise BetterAuthError("invalid_session")

    subject = user.get("id")
    email = user.get("email")
    if (
        not isinstance(subject, str)
        or not subject
        or not isinstance(email, str)
        or not email.strip()
        or user.get("emailVerified") is not True
    ):
        raise BetterAuthError("email_verification_required")
    return BetterAuthProfile(subject=subject, email=email.strip().lower())
