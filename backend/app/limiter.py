import os
import uuid

from slowapi import Limiter
from slowapi.util import get_remote_address


def _rate_limit_key(request):
    # In test mode each request gets a unique UUID key so no two requests ever
    # share a counter — rate limits are never triggered during pytest runs.
    if os.getenv("APP_ENV") == "test":
        return str(uuid.uuid4())
    return get_remote_address(request)


# Single shared limiter used by all routers and main.py.
limiter = Limiter(key_func=_rate_limit_key)
