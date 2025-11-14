import pytest

from httpx import AsyncClient


@pytest.mark.asyncio
async def test_resume_crud_flow(client: AsyncClient, use_test_user):
    # Create a resume
    resp = await client.post("/api/v1/resumes", json={"name": "Test Resume"})
    assert resp.status_code == 201
    body = resp.json()
    assert "id" in body
    resume_id = body["id"]

    # List resumes
    list_resp = await client.get("/api/v1/resumes")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(item.get("id") == resume_id for item in items)

    # Get resume
    get_resp = await client.get(f"/api/v1/resumes/{resume_id}")
    assert get_resp.status_code == 200
    got = get_resp.json()
    assert got["name"] == "Test Resume"

    # Update resume
    put_resp = await client.put(f"/api/v1/resumes/{resume_id}", json={"name": "Updated Resume", "data": {"summary": "x"}})
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["name"] == "Updated Resume"
    assert updated["data"]["summary"] == "x"

    # Upload resume file (accepted)
    files = {"file": ("test.txt", b"hello world")}
    upload_resp = await client.post(f"/api/v1/resumes/upload", files=files)
    assert upload_resp.status_code == 202
    up_body = upload_resp.json()
    assert "resume_id" in up_body

    # Trigger generate PDF (stub)
    gen_resp = await client.post(f"/api/v1/resumes/{resume_id}/generate_pdf", json={})
    assert gen_resp.status_code == 202
    gen_body = gen_resp.json()
    assert gen_body.get("status")
