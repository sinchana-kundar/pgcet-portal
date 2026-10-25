import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter to mitigate brute-force lookups."""

    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, request: Request, limit: int = 20, window_seconds: int = 60) -> None:
        """Verify that client IP has not exceeded rate limit."""
        client_ip = request.client.host if request.client else "unknown"
        # Check X-Forwarded-For header if behind a reverse proxy
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        now = time.time()
        window_start = now - window_seconds

        # Prune old timestamps
        timestamps = self._requests[client_ip]
        self._requests[client_ip] = [ts for ts in timestamps if ts > window_start]

        if len(self._requests[client_ip]) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many result lookup attempts. Please try again after 1 minute.",
            )

        self._requests[client_ip].append(now)

    def reset(self) -> None:
        """Reset rate limiter state (useful in test runs)."""
        self._requests.clear()


# Global rate limiter instance
lookup_rate_limiter = InMemoryRateLimiter()
