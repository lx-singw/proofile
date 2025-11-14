import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_optimize_bullet_streaming(monkeypatch):
    # Override dependencies so endpoint doesn't require DB or auth
    app.dependency_overrides = {}

    async def dummy_get_db():
        yield None

    async def dummy_user():
        return {"id": "test-user"}

    from app.api.v1.deps import get_db, get_current_active_user  # noqa: E401
    app.dependency_overrides[get_db] = dummy_get_db
    app.dependency_overrides[get_current_active_user] = dummy_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/ai/optimize-bullet",
            json={"text": "was responsible for server...", "context": "Software Engineer"},
            timeout=10.0,
        )
        assert resp.status_code == 200
        content = resp.text
        assert "Improved: was responsible for server" in content
