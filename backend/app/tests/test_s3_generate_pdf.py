import pytest
from types import SimpleNamespace

import app.tasks as tasks_module


def test_generate_pdf_uses_s3(monkeypatch):
    # Prepare fake resume returned from DB
    resume = SimpleNamespace(id="r-s3", user_id=99, data={})

    class FakeSession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def execute(self, stmt):
            class R:
                def scalar_one_or_none(self_inner):
                    return resume
            return R()

    monkeypatch.setenv("S3_BUCKET", "test-bucket")

    calls = {}

    class FakeS3:
        def put_object(self, **kwargs):
            calls['put'] = kwargs

        def generate_presigned_url(self, ClientMethod, Params=None, ExpiresIn=None):
            calls['presign'] = (ClientMethod, Params, ExpiresIn)
            return "https://signed.example.com/resume.pdf"

    monkeypatch.setattr(tasks_module, "AsyncSessionLocal", lambda: FakeSession())
    monkeypatch.setattr(tasks_module, "boto3", SimpleNamespace(client=lambda service: FakeS3()))

    # run async implementation
    result = pytest.raises  # placeholder to satisfy linter
    out = pytest.mark.asyncio  # placeholder
    import asyncio
    res = asyncio.get_event_loop().run_until_complete(tasks_module.generate_pdf_task_async("r-s3", "t-1"))

    assert isinstance(res, dict)
    assert res.get("download_url") == "https://signed.example.com/resume.pdf"
    assert 'put' in calls and 'presign' in calls
