import logging
import logging.config
import time
import uuid as uuid_lib

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.limiter import limiter
from app.routers import admin, admin_control, billing, documents, drafts, email_campaigns, feedback, guest_simulation, meetings, notifications, personas, scenarios, simulation, system, users, webhooks

# ── Logging ──────────────────────────────────────────────────────────────────

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s | %(message)s",
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "level": "DEBUG" if settings.debug else "INFO",
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn": {"propagate": True},
        "sqlalchemy.engine": {"level": "WARNING", "propagate": True},
    },
})

logger = logging.getLogger("peaktalk")


def _safe_request_path(path: str) -> str:
    """Keep user/session identifiers out of request logs."""
    prefix = "/admin/control/users/"
    if not path.startswith(prefix):
        return path
    parts = path[len(prefix):].split("/")
    parts[0] = ":user"
    if len(parts) >= 4 and parts[1] == "sessions":
        parts[2] = ":session"
    return prefix + "/".join(parts)

# ── App ───────────────────────────────────────────────────────────────────────

_is_dev = settings.app_env == "development"

app = FastAPI(
    title="PeakTalk API",
    description="AI-стресс-тест аргументов перед рабочими встречами",
    version="0.1.0",
    docs_url="/docs" if _is_dev else None,
    redoc_url="/redoc" if _is_dev else None,
    openapi_url="/openapi.json" if _is_dev else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ── Request logging middleware ─────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid_lib.uuid4())[:8]
    request.state.request_id = request_id
    start = time.monotonic()
    safe_path = _safe_request_path(request.url.path)

    logger.info(
        "→ %s %s  [req=%s]",
        request.method,
        safe_path,
        request_id,
    )

    response = await call_next(request)

    elapsed_ms = (time.monotonic() - start) * 1000
    logger.info(
        "← %s %s  status=%d  %.1fms  [req=%s]",
        request.method,
        safe_path,
        response.status_code,
        elapsed_ms,
        request_id,
    )

    response.headers["X-Request-ID"] = request_id
    return response


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(users.router)
app.include_router(documents.router)
app.include_router(drafts.router)
app.include_router(simulation.router)
app.include_router(guest_simulation.router)
app.include_router(scenarios.router)
app.include_router(billing.router)
app.include_router(webhooks.router)
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(admin.router)
app.include_router(admin_control.router)
app.include_router(meetings.router)
app.include_router(feedback.router)
app.include_router(personas.router)
app.include_router(email_campaigns.router)
app.include_router(system.router)


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "peaktalk-api"}
