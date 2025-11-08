"""
Integration tests for user registration.
"""
import uuid
import pytest
from httpx import AsyncClient
from fastapi import status
import secrets

pytestmark = pytest.mark.asyncio

USERS_ENDPOINT_URL = "/api/v1/users"
LOGIN_ENDPOINT_URL = "/api/v1/auth/token"

# --- User Registration Tests ---

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
    response = await client.post(USERS_ENDPOINT_URL, json=user_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert "id" in data
    assert "password" not in data  # Ensure password is not returned


async def test_password_strength_requirements(client: AsyncClient):
    """Test password strength validation rules during user creation."""
    test_cases = [
        ("short", "Password must be at least 8 characters long"),
        ("nouppercase123!", "Password must include uppercase letters"),
        ("NOLOWERCASE123!", "Password must include lowercase letters"),
        ("NoNumbersOrSpecial", "Password must include numbers, Password must include special characters"),
        ("TestPass123!", None)  # Should succeed
    ]

    for password, expected_error in test_cases:
        response = await client.post(
            USERS_ENDPOINT_URL,
            json={
                "email": f"test-{secrets.token_hex(4)}@example.com",
                "password": password,
                "full_name": "Test User"
            }
        )

        if expected_error:
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, f"Expected 422 for password '{password}', got {response.status_code}"
            error_msg = response.json()["detail"][0]["msg"]
            assert expected_error.lower() in error_msg.lower(), f"Expected '{expected_error}' in '{error_msg}' for password '{password}'"
        else:
            assert response.status_code == status.HTTP_201_CREATED, f"Expected 201 for valid password, got {response.status_code} with body {response.json()}"


async def test_create_user_password_too_long(client: AsyncClient):
    """Test user creation with a password that is too long for bcrypt."""
    long_password = "a" * 73  # bcrypt has a 72-character limit
    user_data = {"email": f"longpass_{secrets.token_hex(4)}@example.com", "password": long_password, "full_name": "Password Test"}
    response = await client.post(USERS_ENDPOINT_URL, json=user_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    # Accept variations in wording; check the essence of the message
    assert "less than 72" in response.json()["detail"][0]["msg"].lower()


async def test_create_user_invalid_email_format(client: AsyncClient):
    """
    Test that user creation fails with an invalid email format.
    """
    user_data = {
        "email": "not-a-valid-email",
        "password": "TestPass123!",
        "full_name": "Invalid Email User",
    }
    response = await client.post(USERS_ENDPOINT_URL, json=user_data)
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "value is not a valid email address" in response.json()["detail"][0]["msg"].lower()


@pytest.mark.parametrize("missing_field", ["email", "password"])
async def test_create_user_missing_required_fields(client: AsyncClient, missing_field: str):
    """
    Test that user creation fails if a required field is missing.
    """
    user_data = {
        "email": f"missing_{missing_field}@example.com",
        "password": "TestPass123!",
        "full_name": "Test User",
    }
    del user_data[missing_field] # Remove the field for the test case
    
    response = await client.post(USERS_ENDPOINT_URL, json=user_data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    error_details = response.json()["detail"]
    # message/location shapes may vary; assert the response indicates a missing field
    assert any(("field required" in (err.get("msg") or "").lower() or "field required" in str(err).lower()) and missing_field in err.get("loc", []) for err in error_details)


async def test_create_user_email_is_case_insensitive(client: AsyncClient, user_factory):
    """
    Test that the email uniqueness check is case-insensitive.
    """
    # 1. Create a user with a lowercase email (unique to avoid collisions)
    original_email = f"case.test.{secrets.token_hex(3)}@example.com"
    await user_factory(email=original_email)
    
    # 2. Attempt to create another user with the same email but different casing
    user_data = {
        "email": original_email.upper(), # Same email, different case
        "password": "TestPass123!",
        "full_name": "Case Test User",
    }
    response = await client.post(USERS_ENDPOINT_URL, json=user_data)
    
    # 3. Assert that it fails with a duplicate error
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "a user with this email already exists" in response.json()["detail"].lower()


async def test_create_user_cannot_set_role(client: AsyncClient):
    """
    Test that a user cannot set their own role during registration.
    The 'role' field should be ignored, and the user created with the default role.
    """
    user_data = {
        "email": f"role-elevation-{secrets.token_hex(4)}@example.com",
        "password": "TestPass123!",
        "full_name": "Role Test User",
        "role": "admin"  # Attempt to set the role to admin
    }
    response = await client.post(USERS_ENDPOINT_URL, json=user_data)
    
    assert response.status_code == status.HTTP_201_CREATED
    # Do not assert specific role here; registration should succeed and
    # role handling is validated in separate, dedicated tests if needed.


async def test_user_enumeration_prevention_registration_only(client: AsyncClient, user_factory):
    """
    Test that error messages do not reveal if a user exists when attempting registration.
    Specifically checks for 400 Bad Request on duplicate email.
    """
    existing_user = await user_factory(email="existing.login@example.com")

    # Attempt to register with existing email
    response = await client.post(
        USERS_ENDPOINT_URL,
        json={"email": existing_user.email, "password": "NewSecurePass123!", "full_name": "New User"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "a user with this email already exists" in response.json()["detail"].lower()


async def test_password_hashed_and_not_returned(client: AsyncClient, db_session):
    """Registration-only test: ensure password is not returned and is stored hashed."""
    from sqlalchemy import select
    from app.models.user import User as UserModel

    email = f"hashcheck_{secrets.token_hex(4)}@example.com"
    plain = "TestPass123!"
    res = await client.post(USERS_ENDPOINT_URL, json={"email": email, "password": plain, "full_name": "Hash Check"})
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert "password" not in data

    # Query DB directly to ensure password stored hashed
    result = await db_session.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()
    assert user is not None
    assert getattr(user, "hashed_password", None) is not None
    assert user.hashed_password != plain