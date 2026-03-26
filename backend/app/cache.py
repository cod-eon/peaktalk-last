"""
Redis cache helpers — cache-aside pattern.

Redis в PeakTalk выполняет две роли:
  1. Celery broker/backend  (использует DB 0 по умолчанию через settings.redis_url)
  2. API response cache     (этот модуль, та же DB — ключи изолированы префиксом)

Все операции устойчивы к недоступности Redis: при любом сбое логируется warning,
но запрос продолжает обрабатываться через БД (graceful degradation).
"""

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger("peaktalk.cache")

# ── Singleton Redis client ──────────────────────────────────────────────────

_redis_client: aioredis.Redis | None = None


def _get_client() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
    return _redis_client


# ── Public helpers ──────────────────────────────────────────────────────────

async def cache_get(key: str) -> Any | None:
    """Return deserialized value or None (cache miss / error)."""
    try:
        raw = await _get_client().get(key)
        if raw:
            logger.debug("cache HIT  key=%s", key)
            return json.loads(raw)
        logger.debug("cache MISS key=%s", key)
    except Exception as exc:  # noqa: BLE001
        logger.warning("cache_get failed key=%s: %s", key, exc)
    return None


async def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    """Serialize value and store with TTL (seconds)."""
    try:
        await _get_client().setex(key, ttl, json.dumps(value, default=str))
    except Exception as exc:  # noqa: BLE001
        logger.warning("cache_set failed key=%s: %s", key, exc)


async def cache_invalidate_prefix(prefix: str) -> None:
    """Delete all keys matching prefix:* (user-scoped invalidation)."""
    try:
        r = _get_client()
        keys = await r.keys(f"{prefix}:*")
        if keys:
            await r.delete(*keys)
            logger.debug("cache invalidated %d keys prefix=%s", len(keys), prefix)
    except Exception as exc:  # noqa: BLE001
        logger.warning("cache_invalidate failed prefix=%s: %s", prefix, exc)
