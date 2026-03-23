from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared limiter instance used by all routers and main.py.
# Centralising it here lets tests disable rate limiting in one place:
#   from app.limiter import limiter; limiter._enabled = False
limiter = Limiter(key_func=get_remote_address)
