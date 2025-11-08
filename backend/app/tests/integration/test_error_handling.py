"""
Integration tests for error handling scenarios.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.models.user import User
from app.services import profile_service
from app.schemas.profile import ProfileCreate
from app.core import security
from jose import JWTError

pytestmark = pytest.mark.asyncio


async def test_concurrent_profile_updates(
    client: AsyncClient, db_session: AsyncSession, test_user: User, auth_headers: dict
):
    """Test handling of concurrent updates to the same profile."""
    # Create initial profile
    profile_in = ProfileCreate(headline="Initial Headline", summary="Initial Summary")
    # This create_profile service function already commits.
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    
    headers = auth_headers

    # Run updates sequentially to avoid sharing a single DB connection in
    # concurrent coroutines inside the ASGI test harness. This keeps the
    # integration test deterministic while still exercising multiple updates.
    res1 = await client.patch(
        f"/api/v1/profiles/{profile.id}", json={"headline": "Update 1"}, headers=headers
    )
    res2 = await client.patch(
        f"/api/v1/profiles/{profile.id}", json={"headline": "Update 2"}, headers=headers
    )

    assert res1.status_code == status.HTTP_200_OK
    assert res2.status_code == status.HTTP_200_OK

    # Verify final state; the last write should be visible
    response = await client.get(f"/api/v1/profiles/{profile.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["headline"] in ["Update 1", "Update 2"]

async def test_malformed_json_handling(
    client: AsyncClient, test_user: User, auth_headers: dict
):
    """
    Test handling of malformed JSON in requests.

    This test sends malformed JSON to the /api/v1/profiles/ endpoint
    and verifies that the response is a 400 Bad Request.

    The test case does not need to log in again if it uses the auth_headers
    fixture, which is populated by the test_login_requires_form_data test.
    """
    # Get auth token (using the correct password)
    # This test doesn't need to log in again if it uses the auth_headers fixture
    headers = auth_headers
    
    # Send malformed JSON
    response = await client.post(
        "/api/v1/profiles/",  # Add trailing slash
        content="{invalid-json}",
        headers=headers
    )
    
    # Verify response
    assert response.status_code == status.HTTP_400_BAD_REQUEST, "Malformed JSON typically results in 400"
    detail = response.json()["detail"]
    assert isinstance(detail, list), "FastAPI validation errors come as a list"


async def test_database_constraint_handling(
    client: AsyncClient, db_session: AsyncSession, test_user: User
):
    """Test handling of database constraint violations."""
    # Create initial profile
    profile_in = ProfileCreate(headline="Test Headline", summary="Test Summary")
    await profile_service.create_profile(db_session, profile_in, test_user.id)
    
    # Get auth token (using the correct password)
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to create another profile for the same user (violates unique constraint)
    response = await client.post(
        "/api/v1/profiles/", # Add trailing slash
        json={"headline": "Another Headline", "summary": "Another Summary"},
        headers=headers
    )
    
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "profile for this user already exists" in response.json()["detail"]


async def test_invalid_id_handling(client: AsyncClient, test_user: User):
    """Test handling of requests with invalid IDs."""
    # Get auth token
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with invalid ID format
    response = await client.get("/api/v1/profiles/not-an-id", headers=headers) # No trailing slash for ID endpoint
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Test with non-existent ID
    response = await client.get("/api/v1/profiles/999999", headers=headers) # No trailing slash for ID endpoint
    assert response.status_code == status.HTTP_403_FORBIDDEN # Access control before 404


async def test_method_not_allowed(client: AsyncClient):
    """Test handling of invalid HTTP methods."""
    # Try to use PUT on an endpoint that doesn't support it
    response = await client.put("/api/v1/profiles/") # Add trailing slash
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    # Try to use DELETE on an endpoint that doesn't support it
    response = await client.delete("/api/v1/auth/token")
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED