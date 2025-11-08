"""
Integration tests for user management features.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate

pytestmark = pytest.mark.asyncio


async def test_deactivate_user(client: AsyncClient, test_user: User, user_factory):
    """Test that an admin can deactivate a user account."""
    # Create an admin user
    admin = await user_factory(
        email="admin@example.com",
        role=UserRole.ADMIN
    )
    
    # Log in as admin
    login_data = {"username": admin.email, "password": "SecurePass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Deactivate test_user
    response = await client.patch( # No trailing slash for ID endpoint
        f"/api/v1/users/{test_user.id}",
        json={"is_active": False},
        headers=headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_active"] is False


async def test_deactivated_user_cannot_login(client: AsyncClient, db_session: AsyncSession, test_user: User): # Re-add this test
    """Test that deactivated users cannot log in."""
    # First deactivate the user (directly via service to avoid dependency on admin routes)
    test_user.is_active = False
    await db_session.flush()
    
    # Attempt to log in
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    response = await client.post("/api/v1/auth/token", data=login_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User account is disabled" in response.json()["detail"]


async def test_update_user_role(client: AsyncClient, test_user: User, user_factory):
    """Test that an admin can update a user's role."""
    # Create an admin user
    admin = await user_factory(
        email="admin@example.com",
        role=UserRole.ADMIN
    )
    
    # Log in as admin
    login_data = {"username": admin.email, "password": "SecurePass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Update test_user's role to EMPLOYER
    response = await client.patch( # No trailing slash for ID endpoint
        f"/api/v1/users/{test_user.id}",
        json={"role": UserRole.EMPLOYER},
        headers=headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["role"] == UserRole.EMPLOYER


async def test_non_admin_cannot_update_roles(client: AsyncClient, test_user: User, user_factory):
    """Test that non-admin users cannot update roles."""
    # Create another regular user
    other_user = await user_factory(email="other@example.com")
    
    # Log in as regular user
    login_data = {"username": other_user.email, "password": "SecurePass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to update test_user's role
    response = await client.patch( # No trailing slash for ID endpoint
        f"/api/v1/users/{test_user.id}",
        json={"role": UserRole.ADMIN},
        headers=headers
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN