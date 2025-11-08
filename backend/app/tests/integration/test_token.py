"""
Integration tests for token management and authentication.
"""
import pytest
from datetime import timedelta
from httpx import AsyncClient
from fastapi import status

from app.models.user import User
from app.core.security import create_access_token

pytestmark = pytest.mark.asyncio


async def test_token_expired(client: AsyncClient, test_user: User):
    """Test that expired tokens are rejected."""
    # Create a token that's already expired
    access_token = create_access_token(
        data={"sub": test_user.email},
        expires_delta=timedelta(minutes=-1)  # Expired 1 minute ago
    )
    
    # Try to use the expired token
    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in response.json()["detail"]


async def test_token_invalid_format(client: AsyncClient):
    """Test that malformed tokens are rejected."""
    # Test with malformed bearer token
    headers = {"Authorization": "Bearer invalid.token.format"}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    # Test with non-bearer format
    headers = {"Authorization": "Basic dXNlcjpwYXNz"}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    # Test with empty token
    headers = {"Authorization": "Bearer "}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_multiple_login_tokens(client: AsyncClient, test_user: User):
    """Test that multiple valid tokens can exist for the same user."""
    # Login twice to get two tokens
    login_data = {"username": test_user.email, "password": "TestPass123!"}

    response1 = await client.post("/api/v1/auth/token", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"}) # Ensure form data
    token1 = response1.json()["access_token"]

    response2 = await client.post("/api/v1/auth/token", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"}) # Ensure form data
    token2 = response2.json()["access_token"]
    
    # Both tokens should work
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    response1 = await client.get("/api/v1/profiles/me", headers=headers1)
    response2 = await client.get("/api/v1/profiles/me", headers=headers2)

    assert response1.status_code == status.HTTP_404_NOT_FOUND  # No profile exists
    assert response2.status_code == status.HTTP_404_NOT_FOUND  # No profile exists


async def test_token_missing_claims(client: AsyncClient, test_user: User):
    """Test that tokens without required claims are rejected."""
    # Create a token missing the 'sub' claim
    access_token = create_access_token(
        data={"random": "data"},
        expires_delta=timedelta(minutes=30)
    )
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in response.json()["detail"]