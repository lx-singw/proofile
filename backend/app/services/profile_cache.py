"""In-memory helpers for caching profile responses during tests.

The test suite exercises application behaviour without Redis, so we keep a
small asyncio-aware cache that mirrors the intended behaviour while remaining
simple to invalidate.
"""
from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, Tuple

from app.schemas.profile import ProfileRead

_PROFILE_TTL_SECONDS = 5.0
_profile_cache: Dict[int, Tuple[ProfileRead, float]] = {}
_profile_list_cache: Dict[Tuple[int, int], Tuple[list[dict[str, Any]], float]] = {}
_profile_history: Dict[int, int] = {}
_profile_owner_lookup: Dict[int, int] = {}
_lock = asyncio.Lock()


async def get_profile(profile_id: int) -> ProfileRead | None:
    async with _lock:
        cached = _profile_cache.get(profile_id)
        if not cached:
            return None
        profile, expires_at = cached
        if expires_at < time.monotonic():
            _profile_cache.pop(profile_id, None)
            return None
        return profile


async def set_profile(profile: ProfileRead) -> None:
    async with _lock:
        _profile_cache[profile.id] = (profile, time.monotonic() + _PROFILE_TTL_SECONDS)
        _profile_list_cache.clear()
        _profile_history[profile.user_id] = profile.id
        _profile_owner_lookup[profile.id] = profile.user_id


async def invalidate_profile(profile_id: int) -> None:
    async with _lock:
        _profile_cache.pop(profile_id, None)
        _profile_list_cache.clear()
        _profile_owner_lookup.pop(profile_id, None)


async def get_profile_list(skip: int, limit: int) -> list[dict[str, Any]] | None:
    async with _lock:
        cached = _profile_list_cache.get((skip, limit))
        if not cached:
            return None
        profiles, expires_at = cached
        if expires_at < time.monotonic():
            _profile_list_cache.pop((skip, limit), None)
            return None
        return profiles


async def set_profile_list(skip: int, limit: int, profiles: list[dict[str, Any]]) -> None:
    async with _lock:
        _profile_list_cache[(skip, limit)] = (
            profiles,
            time.monotonic() + _PROFILE_TTL_SECONDS,
        )


async def clear_all() -> None:
    async with _lock:
        _profile_cache.clear()
        _profile_list_cache.clear()
        _profile_history.clear()
        _profile_owner_lookup.clear()


async def get_last_known_profile_id(user_id: int) -> int | None:
    async with _lock:
        return _profile_history.get(user_id)
