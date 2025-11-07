import pytest
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.services import profile_service
from app.schemas.profile import ProfileCreate

pytestmark = pytest.mark.asyncio


async def test_read_own_profile_success(
    client: AsyncClient, db_session: AsyncSession, test_user: User, user_factory
):
    """
    Test successfully retrieving the current user's profile.
    """
    # 1. Create a profile for the test_user
    profile_in = ProfileCreate(headline="My Headline", summary="My Summary")
    await profile_service.create_profile(db_session, profile_in, test_user.id)

    # 2. Log in to get an access token
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]

    # 3. Request the profile with the token
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/profiles/me", headers=headers)

    # 4. Assert the response is correct
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["headline"] == "My Headline"
    assert data["summary"] == "My Summary"
    assert data["user_id"] == test_user.id


async def test_read_own_profile_not_found(client: AsyncClient, test_user: User):
    """
    Test retrieving a profile when the user has not created one yet.
    Should return 404 Not Found.
    """
    # 1. Log in to get an access token (user has no profile)
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]

    # 2. Request the profile
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/profiles/me", headers=headers)

    # 3. Assert a 404 response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Profile not found for the current user" in response.json()["detail"]


async def test_read_own_profile_unauthenticated(client: AsyncClient):
    """Test that an unauthenticated user cannot access the endpoint."""
    response = await client.get("/api/v1/profiles/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Not authenticated"


async def test_create_own_profile_success(client: AsyncClient, test_user: User):
    """
    Test successfully creating a profile for the current user.
    """
    # 1. Log in to get an access token
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create the profile
    profile_data = {"headline": "New Headline", "summary": "New Summary"}
    response = await client.post("/api/v1/profiles/", json=profile_data, headers=headers)

    # 3. Assert the response is correct
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["headline"] == "New Headline"
    assert data["summary"] == "New Summary"
    assert data["user_id"] == test_user.id


async def test_create_own_profile_conflict(
    client: AsyncClient, db_session: AsyncSession, test_user: User
):
    """
    Test that creating a profile fails if one already exists for the user.
    """
    # 1. Create an initial profile
    profile_in = ProfileCreate(headline="My Headline", summary="My Summary")
    await profile_service.create_profile(db_session, profile_in, test_user.id)

    # 2. Log in
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Attempt to create a second profile
    profile_data = {"headline": "Another Headline", "summary": "Another Summary"}
    response = await client.post("/api/v1/profiles/", json=profile_data, headers=headers)

    # 4. Assert a 409 Conflict response
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "profile for this user already exists" in response.json()["detail"]


async def test_update_own_profile_success(
    client: AsyncClient, db_session: AsyncSession, test_user: User
):
    """
    Test successfully updating the current user's profile.
    """
    # 1. Create an initial profile
    profile_in = ProfileCreate(headline="Original Headline", summary="Original Summary")
    created_profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    await db_session.commit()

    # 2. Log in
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Update the profile
    update_data = {"headline": "Updated Headline"}
    response = await client.patch(f"/api/v1/profiles/{created_profile.id}", json=update_data, headers=headers)

    # 4. Assert the response is correct
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["headline"] == "Updated Headline"
    assert data["summary"] == "Original Summary" # Summary should be unchanged


async def test_update_own_profile_not_found(client: AsyncClient, test_user: User):
    """
    Test that updating a profile fails if the user doesn't have one.
    """
    # 1. Log in (user has no profile)
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Attempt to update the profile
    update_data = {"headline": "Updated Headline"}
    response = await client.patch(f"/api/v1/profiles/99999", json=update_data, headers=headers) # No trailing slash for ID endpoint

    # 3. Assert a 404 Not Found response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Profile not found" in response.json()["detail"]


async def test_admin_can_delete_any_profile(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test that an admin user can delete any user's profile."""
    # Create a regular user with a profile
    regular_user = await user_factory(email="regular@example.com")
    profile_in = ProfileCreate(headline="Regular User Profile", summary="Test summary")
    regular_profile = await profile_service.create_profile(db_session, profile_in, regular_user.id)
    
    # Create an admin user
    admin_user = await user_factory(
        email="admin@example.com",
        role=UserRole.ADMIN
    )
    
    # Log in as admin
    login_data = {"username": admin_user.email, "password": "SecurePass123!"} # user_factory default
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Try to delete regular user's profile
    response = await client.delete(f"/api/v1/profiles/{regular_profile.id}", headers=admin_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT


async def test_non_admin_cannot_delete_others_profile(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test that a non-admin user cannot delete another user's profile."""
    # Create first user with profile
    user1 = await user_factory(email="user1@example.com")
    profile_in = ProfileCreate(headline="User 1 Profile", summary="Test summary")
    profile1 = await profile_service.create_profile(db_session, profile_in, user1.id)
    
    # Create second user
    user2 = await user_factory(email="user2@example.com")
    
    # Log in as second user
    login_data = {"username": user2.email, "password": "SecurePass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to delete first user's profile
    response = await client.delete(f"/api/v1/profiles/{profile1.id}", headers=headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "do not have permission" in response.json()["detail"]


async def test_list_profiles_pagination(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    test_user: User
):
    """Test that profiles are properly paginated."""
    # First, log in as a user to get auth token
    login_data = {
        "username": test_user.email,
        "password": "TestPass123!"
    }
    login_res = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]
    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    # Create multiple users with profiles
    users = []
    for i in range(15):  # Create 15 users/profiles
        user = await user_factory(email=f"user{i}@example.com")
        users.append(user)
        profile_in = ProfileCreate(headline=f"Profile {i}", summary=f"Summary {i}")
        await profile_service.create_profile(db_session, profile_in, user.id)
    await db_session.commit()

    # Test first page (default limit 10)
    response = await client.get(
        "/api/v1/profiles/?limit=10",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 10  # Default page size
    
    # Test second page with custom limit
    response = await client.get(
        "/api/v1/profiles/?skip=10&limit=5",
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 5  # Remaining items


async def test_profile_validation(client: AsyncClient, test_user: User):
    """Test profile creation with invalid data."""
    # Log in
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with empty headline
    profile_data = {"headline": "", "summary": "Valid summary"}
    response = await client.post("/api/v1/profiles/", json=profile_data, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


async def test_create_profile_xss_prevention(client: AsyncClient, test_user: User):
    """
    Test that profile creation rejects input containing HTML/script tags (XSS protection).
    """
    # Log in
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to create a profile with XSS payload in headline
    xss_payload = "<script>alert('XSS');</script>"
    response = await client.post("/api/v1/profiles/", json={"headline": xss_payload, "summary": "Safe summary"}, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    # Error message should include our validator message
    assert "headline must not contain HTML" in response.json()["detail"][0]["msg"]
    
    # Test with too long headline (>100 chars)
    profile_data = {"headline": "x" * 101, "summary": "Valid summary"}
    response = await client.post("/api/v1/profiles/", json=profile_data, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    # Test with too long summary (>500 chars)
    profile_data = {"headline": "Valid headline", "summary": "x" * 501}
    response = await client.post("/api/v1/profiles/", json=profile_data, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY