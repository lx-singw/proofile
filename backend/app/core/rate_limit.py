"""Rate limiting middleware for the FastAPI application."""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from redis.asyncio import Redis
from typing import Tuple, Dict
import time
import logging
from app.core import config

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        redis_url: str,
        rate_limits: Dict[str, Tuple[int, int]] = None,  # {endpoint: (requests, seconds)}
        default_rate_limit: Tuple[int, int] = (60, 60) # Default if not provided
    ):
        super().__init__(app)
        try:
            self.redis = Redis.from_url(redis_url, encoding="utf8", decode_responses=True)
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {e}")
            raise RuntimeError(f"Rate limiting initialization failed: {e}") from e
        self.default_rate_limit = default_rate_limit
        self.rate_limits = rate_limits or {} # Use provided or empty dict

    def get_rate_limit_key(self, request: Request) -> str:
        """Get the rate limit key based on the request path and client IP."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Sanitize forwarded IP to prevent injection
            client_ip = forwarded.split(",")[0].strip()
            # Validate IP format (basic validation)
            if not client_ip.replace(".", "").replace(":", "").isalnum():
                client_ip = "unknown"
        else:
            client_ip = getattr(request.client, 'host', 'unknown') or 'unknown'
        
        # Sanitize path to prevent injection
        path = str(request.url.path).replace(":", "_").replace(";", "_")
        return f"rate_limit:{client_ip}:{path}"

    def get_limit_info(self, path: str) -> Tuple[int, int]:
        """Get the rate limit configuration for a given path."""
        return self.rate_limits.get(path, self.default_rate_limit)

    async def is_rate_limited(self, key: str, max_requests: int, window: int) -> Tuple[bool, int]:
        """Check if the request should be rate limited."""
        try:
            current_time = int(time.time())
            clear_before = current_time - window
            
            # Remove old entries (outside current window)
            await self.redis.zremrangebyscore(key, 0, clear_before)
            
            # Add current request
            await self.redis.zadd(key, {str(current_time): current_time})
            
            # Get current count
            request_count = await self.redis.zcard(key)
            
            # Set expiry
            await self.redis.expire(key, window)

            # Check if we've hit the limit
            if request_count > max_requests:
                # Calculate reset time
                oldest_req = await self.redis.zrange(key, 0, 0, withscores=True)
                if oldest_req:
                    reset_time = int(oldest_req[0][1]) + window - current_time
                    return True, reset_time
                return True, window

            return False, 0

        except Exception as e:
            logger.error(f"Redis error in rate limiting: {e}")
            return False, 0  # Fail open if Redis is down

    async def dispatch(self, request: Request, call_next):
        """Handle the request and apply rate limiting."""
        # Skip rate limiting for health check
        if request.url.path == "/health":
            return await call_next(request)

        key = self.get_rate_limit_key(request)
        max_requests, window = self.get_limit_info(request.url.path)

        is_limited, retry_after = await self.is_rate_limited(key, max_requests, window)

        if is_limited:
            detail = f"Too many requests. Please try again after {retry_after} seconds."
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": detail},
            )
            response.headers.update(
                {
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Reset": str(retry_after),
                    "Retry-After": str(retry_after),
                }
            )
            return response

        response = await call_next(request)

        # Add rate limit headers to response
        current_count = await self.redis.zcard(key)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - current_count))

        return response