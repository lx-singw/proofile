import asyncio
import pytest

from app.core import broadcaster


@pytest.mark.asyncio
async def test_in_memory_publish_subscribe():
    channel = "test:user:1"
    received = []

    async def subscriber_collect():
        async for msg in broadcaster.subscribe(channel):
            received.append(msg)
            break

    # start subscriber
    t = asyncio.create_task(subscriber_collect())

    # give the subscriber a moment to register
    await asyncio.sleep(0.05)

    # publish a message
    await broadcaster.publish(channel, {"event": "TEST", "payload": 123})

    # wait for subscriber to receive
    await asyncio.wait_for(t, timeout=1.0)

    assert len(received) == 1
    assert received[0]["event"] == "TEST"
    assert received[0]["payload"] == 123
