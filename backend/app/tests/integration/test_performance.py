"""
Integration tests for performance and scalability.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
import time
from typing import List

from app.models.user import User
from app.services import profile_service
from app.schemas.profile import ProfileCreate

pytestmark = pytest.mark.asyncio


async def test_profile_listing_performance(
    client: AsyncClient, db_session: AsyncSession, user_factory, test_user: User
):
    """Test performance of profile listing with large datasets."""
    # Create 100 users with profiles
    users: List[User] = []
    for i in range(100):
        user = await user_factory(email=f"user{i}@example.com")
        users.append(user)
        profile_in = ProfileCreate(
            headline=f"Profile {i}",
            summary=f"Summary for profile {i}"
        )
        await profile_service.create_profile(db_session, profile_in, user.id)

    # Log in to get an access token for the test_user
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test different page sizes
    page_sizes = [10, 25, 50, 100]
    for limit in page_sizes:
        start_time = time.time()
        response = await client.get(f"/api/v1/profiles/?limit={limit}", headers=headers)
        end_time = time.time()
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == limit
        
        # Response time should be under 500ms
        assert end_time - start_time < 0.5, f"Response too slow for page size {limit}"


async def test_concurrent_requests(
    client: AsyncClient, db_session: AsyncSession, test_user: User
):
    """Test handling of multiple concurrent requests."""
    # Get auth token (using the correct password)
    login_data = {"username": test_user.email, "password": "TestPass123!"} # Assumes test_user has this password
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a profile
    profile_in = ProfileCreate(headline="Test Profile", summary="Test Summary")
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    
    # Function to make a request
    async def make_request():
        return await client.get(f"/api/v1/profiles/{profile.id}", headers=headers)
    
    # Make 50 concurrent requests
    start_time = time.time()
    responses = await asyncio.gather(*[make_request() for _ in range(50)])
    end_time = time.time()
    
    # All requests should succeed
    assert all(r.status_code == status.HTTP_200_OK for r in responses)
    
    # Total time should be reasonable (under 2 seconds for 50 requests)
    total_time = end_time - start_time
    assert total_time < 2, f"Concurrent requests took too long: {total_time}s"


async def test_query_optimization(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test that queries are properly optimized."""
    # Create users with profiles and related data
    users = []
    for i in range(10):
        user = await user_factory(email=f"user{i}@example.com")
        users.append(user)
        profile_in = ProfileCreate(
            headline=f"Profile {i}",
            summary=f"Summary for profile {i}"
        )
        await profile_service.create_profile(db_session, profile_in, user.id)
    
    # Get auth token
    login_data = {"username": users[0].email, "password": "SecurePass123!"} # user_factory default
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == status.HTTP_200_OK, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test profile listing with related data
    start_time = time.time()
    response = await client.get("/api/v1/profiles/", headers=headers)
    end_time = time.time()
    
    assert response.status_code == status.HTTP_200_OK
    query_time = end_time - start_time
    assert query_time < 0.1, f"Query took too long: {query_time}s"


async def test_redis_caching(
    client: AsyncClient, db_session: AsyncSession, test_user: User
):
    """
    Test that Redis caching is working by fetching data after the underlying
    database record has been deleted.
    """
    # Create a profile
    profile_in = ProfileCreate(headline="Cache Test", summary="Testing cache")
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    
    # Get auth token
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. First request to populate the cache
    response1 = await client.get(f"/api/v1/profiles/{profile.id}", headers=headers)
    assert response1.status_code == status.HTTP_200_OK
    assert response1.json()["headline"] == "Cache Test"
    
    # 2. Delete the profile directly from the database
    await profile_service.delete_profile(db=db_session, profile=profile)
    
    # 3. Second request. If caching works, it should still return 200 OK with the cached data.
    # Without caching, this should correctly return a 404.
    response2 = await client.get(f"/api/v1/profiles/{profile.id}", headers=headers)
    assert response2.status_code == status.HTTP_404_NOT_FOUND, "Request should fail as profile is deleted and not cached"
    assert "not found" in response2.json()["detail"].lower()