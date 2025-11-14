import asyncio
import json
import time

import pytest

from types import SimpleNamespace

import app.tasks as tasks_module


class FakeResult:
    def __init__(self, obj):
        self._obj = obj

    def scalar_one_or_none(self):
        return self._obj


class FakeSession:
    def __init__(self, resume_obj=None):
        self._resume = resume_obj

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def execute(self, stmt):
        return FakeResult(self._resume)

    async def commit(self):
        # pretend commit
        return None

    async def refresh(self, obj):
        return None


@pytest.mark.asyncio
async def test_parse_resume_task_publishes(monkeypatch):
    # Prepare a fake resume object
    resume = SimpleNamespace(id="r-1", user_id=42, data={})

    # Patch AsyncSessionLocal context manager to return an async-context-manager instance
    monkeypatch.setattr(tasks_module, "AsyncSessionLocal", lambda: FakeSession(resume_obj=resume))

    published = []

    async def fake_publish(channel, message):
        published.append((channel, message))

    monkeypatch.setattr(tasks_module, "broadcaster", SimpleNamespace(publish=fake_publish))


    # Call the async implementation directly (avoids asyncio.run inside a running loop)
    await tasks_module.parse_resume_task_async("r-1")

    assert len(published) == 1
    channel, message = published[0]
    assert channel == "user:42"
    assert message["event"] == "RESUME_PARSED_SUCCESS"
    assert message["resume_id"] == "r-1"


@pytest.mark.asyncio
async def test_generate_pdf_task_publishes(monkeypatch):
    # Prepare a fake resume object
    resume = SimpleNamespace(id="r-2", user_id=7, data={})

    class FakeSessionSync(FakeSession):
        pass

    # Patch AsyncSessionLocal to return instance directly
    monkeypatch.setattr(tasks_module, "AsyncSessionLocal", lambda: FakeSessionSync(resume_obj=resume))

    published = []

    async def fake_publish(channel, message):
        published.append((channel, message))

    monkeypatch.setattr(tasks_module, "broadcaster", SimpleNamespace(publish=fake_publish))

    # Speed up sleep
    monkeypatch.setattr(tasks_module, "time", SimpleNamespace(sleep=lambda s: None))

    # Call async implementation directly
    result = await tasks_module.generate_pdf_task_async("r-2", "t-1")

    # result should be a dict with download_url
    assert isinstance(result, dict)
    assert result.get("download_url") is not None
