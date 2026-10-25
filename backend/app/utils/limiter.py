from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import get_settings

settings = get_settings()

# Initialize global rate limiter with remote IP address key
# Automatically disabled during automated pytest runs to prevent false test failures
limiter = Limiter(
    key_func=get_remote_address,
    enabled=not settings.TESTING,
)
