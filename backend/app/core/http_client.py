from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

# Module-level AsyncClient reused across calls to avoid creating many connections.
_client: Optional[httpx.AsyncClient] = None


def _default_timeout() -> httpx.Timeout:
    # settings may define HTTP_TIMEOUT_SECONDS; fallback to 10s
    timeout_seconds = getattr(settings, "HTTP_CLIENT_TIMEOUT", 10)
    return httpx.Timeout(timeout_seconds)


async def get_client() -> httpx.AsyncClient:
    """Return a singleton AsyncClient. Call during FastAPI lifespans or tasks.

    Note: callers running in short-lived scripts may prefer creating a local
    AsyncClient via ``async with httpx.AsyncClient()`` instead.
    """
    global _client
    if _client is None:
        base_url = getattr(settings, "BACKEND_INTERNAL_URL", None)
        _client = httpx.AsyncClient(base_url=base_url or None, timeout=_default_timeout())
    return _client


async def request_json(method: str, url: str, **kwargs: Any) -> Any:
    """Perform an HTTP request and return parsed JSON. Raises on non-2xx.

    Example:
        await request_json("GET", "https://example.com/api")
    """
    client = await get_client()
    resp = await client.request(method, url, **kwargs)
    resp.raise_for_status()
    # If no content, return None
    if resp.status_code == 204 or not resp.content:
        return None
    # Try to parse JSON, fall back to raw text
    try:
        return resp.json()
    except ValueError:
        return resp.text


async def close_client() -> None:
    """Close the module-level client. Intended to be called on app shutdown."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
