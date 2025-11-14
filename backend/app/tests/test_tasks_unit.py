import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app import tasks


class DummyResume:
    def __init__(self, id, user_id, data=None):
        self.id = id
        self.user_id = user_id
        self.data = data or {}


@pytest.mark.asyncio
async def test_parse_resume_task_async_publishes():
    resume = DummyResume(id="r-1", user_id=42, data={})

    # Mock session.execute to return object with scalar_one_or_none
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = resume

    mock_session = AsyncMock()
    mock_session.execute.return_value = mock_result
    mock_session.commit = AsyncMock()

    async def _session_cm():
        yield mock_session

    # Patch AsyncSessionLocal to be an async context manager that yields mock_session
    class DummyAsyncSessionLocal:
        def __init__(self):
            pass

        async def __aenter__(self):
            return mock_session

        async def __aexit__(self, exc_type, exc, tb):
            return False

    publish_calls = []

    async def fake_publish(channel, message):
        publish_calls.append((channel, message))

    with patch.object(tasks, "AsyncSessionLocal", DummyAsyncSessionLocal):
        with patch.object(tasks.broadcaster, "publish", new=fake_publish):
            await tasks.parse_resume_task_async("r-1")

    # assert that session.commit was called and publish was invoked
    assert mock_session.commit.await_count >= 1
    assert len(publish_calls) == 1
    channel, message = publish_calls[0]
    assert channel == "user:42"
    assert message["event"] == "RESUME_PARSED_SUCCESS"
    assert message["resume_id"] == "r-1"


@pytest.mark.asyncio
async def test_generate_pdf_task_async_publishes():
    resume = DummyResume(id="r-2", user_id=99, data={})

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = resume

    mock_session = AsyncMock()
    mock_session.execute.return_value = mock_result
    mock_session.commit = AsyncMock()

    class DummyAsyncSessionLocal2:
        async def __aenter__(self):
            return mock_session

        async def __aexit__(self, exc_type, exc, tb):
            return False

    publish_calls = []

    async def fake_publish(channel, message):
        publish_calls.append((channel, message))

    with patch.object(tasks, "AsyncSessionLocal", DummyAsyncSessionLocal2):
        with patch.object(tasks.broadcaster, "publish", new=fake_publish):
            res = await tasks.generate_pdf_task_async("r-2", "template-1")

    assert res["status"] == "done"
    assert len(publish_calls) == 1
    channel, message = publish_calls[0]
    assert channel == "user:99"
    assert message["event"] == "PDF_READY"
    assert "download_url" in message
