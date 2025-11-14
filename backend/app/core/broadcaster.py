"""
Simple broadcaster abstraction.
- If `redis.asyncio` is installed and `REDIS_URL` is set, use Redis PUB/SUB channels `user:{user_id}`.
- Otherwise fall back to an in-memory async pub/sub suitable for single-process testing.

API:
- async def publish(channel: str, message: str)
- async def subscribe(channel: str): async iterator yielding messages

"""
from typing import AsyncIterator
import asyncio
import json
import os

REDIS_URL = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL")

try:
    import redis.asyncio as redis  # type: ignore
    _has_redis = True
except Exception:
    _has_redis = False

if _has_redis and REDIS_URL:
    _redis_client = redis.from_url(REDIS_URL, encoding="utf8", decode_responses=True)

    async def publish(channel: str, message: dict) -> None:
        await _redis_client.publish(channel, json.dumps(message))

    async def subscribe(channel: str) -> AsyncIterator[dict]:
        pubsub = _redis_client.pubsub()
        await pubsub.subscribe(channel)
        try:
            while True:
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if msg is None:
                    await asyncio.sleep(0.1)
                    continue
                data = msg.get("data")
                if isinstance(data, str):
                    try:
                        yield json.loads(data)
                    except Exception:
                        yield {"data": data}
        finally:
            try:
                await pubsub.unsubscribe(channel)
                await pubsub.close()
            except Exception:
                pass
else:
    # In-memory fallback for local single-process testing
    _channels: dict[str, asyncio.Queue] = {}

    async def publish(channel: str, message: dict) -> None:
        q = _channels.get(channel)
        if q is None:
            # no subscribers yet, nothing to do
            return
        await q.put(message)

    async def subscribe(channel: str) -> AsyncIterator[dict]:
        q = _channels.get(channel)
        if q is None:
            q = asyncio.Queue()
            _channels[channel] = q
        try:
            while True:
                msg = await q.get()
                yield msg
        finally:
            # best-effort cleanup
            if channel in _channels and _channels[channel].empty():
                _channels.pop(channel, None)
