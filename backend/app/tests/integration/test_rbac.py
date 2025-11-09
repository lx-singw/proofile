"""
Integration tests for advanced security features focusing on roles and permissions.
"""
import pytest
from httpx import AsyncClient
from fastapi import status
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List

from app.models.user import User, UserRole
from app.services import user_service, profile_service
from app.schemas.profile import ProfileCreate

pytestmark = pytest.mark.asyncio


async def test_role_elevation_prevention(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test prevention of unauthorized role elevation."""
    # Create a regular user
    regular_user = await user_factory(email="regular@example.com")
    
    # Login as regular user
    login_data = {"username": regular_user.email, "password": "SecurePass123!"}
    login_res = await client.post("/api/v1/auth/token", data=login_data)
    assert login_res.status_code == status.HTTP_200_OK
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to elevate own role to admin
    response = await client.patch( # No trailing slash for ID endpoint
        f"/api/v1/users/{regular_user.id}",
        json={"role": UserRole.ADMIN},
        headers=headers
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    
    # Verify role hasn't changed
    user_response = await client.get("/api/v1/users/me/", headers=headers) # Add trailing slash
    assert user_response.status_code == status.HTTP_200_OK
    assert user_response.json()["role"] == UserRole.APPRENTICE


async def test_role_based_access_control(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test role-based access control (RBAC) implementation."""
    # Create users with different roles
    admin = await user_factory(email="admin@example.com", role=UserRole.ADMIN)
    employer = await user_factory(email="employer@example.com", role=UserRole.EMPLOYER)
    apprentice = await user_factory(email="apprentice@example.com", role=UserRole.APPRENTICE)
    
    # Create test profiles
    profiles: Dict[str, int] = {}  # Store profile IDs
    for user in [admin, employer, apprentice]:
        login_data = {"username": user.email, "password": "SecurePass123!"}
        login_res = await client.post("/api/v1/auth/token", data=login_data)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        profile_data = {
            "headline": f"{user.role} Profile",
            "summary": f"Test profile for {user.role}"
        }
        response = await client.post("/api/v1/profiles/", json=profile_data, headers=headers)
        assert response.status_code == status.HTTP_201_CREATED
        profiles[user.role] = response.json()["id"]
    
    # Test admin privileges
    admin_login = {"username": admin.email, "password": "SecurePass123!"}
    admin_token = (await client.post("/api/v1/auth/token", data=admin_login)).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Admin should be able to view all profiles
    for profile_id in profiles.values():
        response = await client.get(f"/api/v1/profiles/{profile_id}", headers=admin_headers) # No trailing slash for ID endpoint
        assert response.status_code == status.HTTP_200_OK
    
    # Admin should be able to update any profile
    for profile_id in profiles.values():
        response = await client.patch(
            f"/api/v1/profiles/{profile_id}",
            json={"headline": "Updated by Admin"}, # No trailing slash for ID endpoint
            headers=admin_headers
        )
        assert response.status_code == status.HTTP_200_OK
    
    # Test employer privileges
    employer_login = {"username": employer.email, "password": "SecurePass123!"}
    employer_token = (await client.post("/api/v1/auth/token", data=employer_login)).json()["access_token"]
    employer_headers = {"Authorization": f"Bearer {employer_token}"}

    # Employer should be able to view apprentice profiles but not modify them
    response = await client.get(f"/api/v1/profiles/{profiles[UserRole.APPRENTICE]}", headers=employer_headers) # No trailing slash for ID endpoint
    assert response.status_code == status.HTTP_200_OK
    
    response = await client.patch( # No trailing slash for ID endpoint
        f"/api/v1/profiles/{profiles[UserRole.APPRENTICE]}",
        json={"headline": "Updated by Employer"},
        headers=employer_headers
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    
    # Test apprentice privileges
    apprentice_login = {"username": apprentice.email, "password": "SecurePass123!"}
    apprentice_token = (await client.post("/api/v1/auth/token", data=apprentice_login)).json()["access_token"]
    apprentice_headers = {"Authorization": f"Bearer {apprentice_token}"}
    
    # Apprentice should only be able to view their own profile (or profiles they have access to)
    response = await client.get(f"/api/v1/profiles/{profiles[UserRole.EMPLOYER]}", headers=apprentice_headers) # No trailing slash for ID endpoint
    assert response.status_code == status.HTTP_403_FORBIDDEN


async def test_permission_inheritance(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test that permissions are properly inherited through role hierarchy."""
    # Create users with different roles
    admin = await user_factory(email="admin_inherit@example.com", role=UserRole.ADMIN)
    employer = await user_factory(email="employer_inherit@example.com", role=UserRole.EMPLOYER)
    
    # Create a resource (profile) as employer
    employer_login = {"username": employer.email, "password": "SecurePass123!"}
    employer_token = (await client.post("/api/v1/auth/token", data=employer_login)).json()["access_token"]
    employer_headers = {"Authorization": f"Bearer {employer_token}"}
    
    profile_data = {
        "headline": "Employer Profile",
        "summary": "Test profile for permission inheritance"
    }
    profile_response = await client.post("/api/v1/profiles/", json=profile_data, headers=employer_headers)
    profile_id = profile_response.json()["id"]
    
    # Admin should inherit all employer permissions
    admin_login = {"username": admin.email, "password": "SecurePass123!"}
    admin_token = (await client.post("/api/v1/auth/token", data=admin_login)).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test various operations
    operations = [
        (client.get, f"/api/v1/profiles/{profile_id}"), # No trailing slash for ID endpoint
        (client.patch, f"/api/v1/profiles/{profile_id}", {"headline": "Updated by Admin"}), # No trailing slash for ID endpoint
        (client.delete, f"/api/v1/profiles/{profile_id}") # No trailing slash for ID endpoint
    ]
    
    for op in operations:
        if len(op) == 2:
            method, url = op
            response = await method(url, headers=admin_headers)
        else:
            method, url, data = op
            response = await method(url, json=data, headers=admin_headers)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]


async def test_permission_boundary(
    client: AsyncClient, db_session: AsyncSession, user_factory
):
    """Test that permission boundaries are properly enforced."""
    # Create an employer user
    employer = await user_factory(email="employer_boundary@example.com", role=UserRole.EMPLOYER)
    
    # Create multiple apprentice users
    apprentices: List[User] = []
    for i in range(3):
        apprentice = await user_factory(
            email=f"apprentice{i}@example.com",
            role=UserRole.APPRENTICE
        )
        apprentices.append(apprentice)
    
    # Login as employer (using the correct password)
    employer_login = {"username": employer.email, "password": "SecurePass123!"}
    employer_login_res = await client.post("/api/v1/auth/token", data=employer_login)
    assert employer_login_res.status_code == status.HTTP_200_OK, f"Employer login failed: {employer_login_res.text}"
    employer_token = employer_login_res.json()["access_token"]
    employer_headers = {"Authorization": f"Bearer {employer_token}"}
    
    # Verify employer can view but not modify apprentice data
    for apprentice in apprentices:
        # Create profile for apprentice
        profile_in = ProfileCreate(
            headline=f"Apprentice {apprentice.email} Profile",
            summary="Test profile"
        )
        profile = await profile_service.create_profile(db_session, profile_in, apprentice.id)
        
        # Employer should be able to view
        response = await client.get(f"/api/v1/profiles/{profile.id}", headers=employer_headers) # No trailing slash for ID endpoint
        assert response.status_code == status.HTTP_200_OK
        
        # But not modify
        response = await client.patch( # No trailing slash for ID endpoint
            f"/api/v1/profiles/{profile.id}",
            json={"headline": "Modified by Employer"},
            headers=employer_headers
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # And not delete
        response = await client.delete(f"/api/v1/profiles/{profile.id}", headers=employer_headers) # No trailing slash for ID endpoint
        assert response.status_code == status.HTTP_403_FORBIDDEN