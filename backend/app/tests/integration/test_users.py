"""
Integration tests for the /api/v1/users endpoint.
"""
import uuid
import pytest
from httpx import AsyncClient
from fastapi import status
from app.models.user import User

pytestmark = pytest.mark.asyncio


async def test_create_user_success(client: AsyncClient):
    """
    Test successful creation of a new user.
    """
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    user_data = {
        "email": unique_email,
        "password": "TestPass123!",
        "full_name": "Test User",
    }
    response = await client.post("/api/v1/users", json=user_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert "id" in data
    assert "password" not in data  # Ensure password is not returned


async def test_create_user_duplicate_email(client: AsyncClient, user_factory):
    """
    Test creating a user with an email that already exists.
    """
    # Create the first user using the factory
    existing_user: User = await user_factory(email="duplicate@example.com")

    user_data = {
        "email": existing_user.email,
        "password": "TestPass123!",
        "full_name": "Test User",
    }

    # Attempt to create the second user with the same email
    duplicate_response = await client.post("/api/v1/users", json=user_data)
    assert duplicate_response.status_code == status.HTTP_400_BAD_REQUEST
    assert "A user with this email already exists" in duplicate_response.json()["detail"]


async def test_create_user_password_too_short(client: AsyncClient):
    """
    Test user creation with a password that is too short.
    """
    unique_email = f"passwordtest_{uuid.uuid4().hex[:8]}@example.com"
    user_data = {
        "email": unique_email,
        "password": "short",
        "full_name": "Password Test",
    }
    response = await client.post("/api/v1/users", json=user_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "value_error"
    assert "Password must be at least 8 characters long" in error_detail["msg"]


async def test_create_user_password_too_long(client: AsyncClient):
    """
    Test user creation with a password that is too long for bcrypt.
    """
    unique_email = f"passwordtest_{uuid.uuid4().hex[:8]}@example.com"
    long_password = "a" * 73  # bcrypt has a 72-character limit
    user_data = {
        "email": unique_email,
        "password": long_password,
        "full_name": "Password Test",
    }
    response = await client.post("/api/v1/users", json=user_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "value_error"
    assert "Password must be less than 72 characters long" in error_detail["msg"]


async def test_create_user_password_too_many_bytes(client: AsyncClient):
    """
    Test user creation with a password that exceeds the 72-byte bcrypt limit.
    """
    unique_email = f"passwordtest_{uuid.uuid4().hex[:8]}@example.com"
    multi_byte_password = "ä" * 40  # 40 characters but 80 bytes in UTF-8
    user_data = {
        "email": unique_email,
        "password": multi_byte_password,
        "full_name": "Password Test",
    }

    response = await client.post("/api/v1/users", json=user_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "value_error"
    assert "72 bytes" in error_detail["msg"]
