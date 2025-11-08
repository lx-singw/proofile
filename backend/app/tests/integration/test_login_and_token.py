"""
Integration tests for user login and token management.
"""
import pytest
from httpx import AsyncClient
import secrets
from fastapi import status
from datetime import timedelta

from app.models.user import User
from app.core.security import create_access_token, decode_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import config
from app.main import app as fastapi_app

pytestmark = pytest.mark.asyncio

LOGIN_ENDPOINT_URL = "/api/v1/auth/token"


async def test_login_success(client: AsyncClient, user_factory):
    """
    Test successful login with correct credentials.
    """
    test_email = "test.login@example.com"
    test_password = "TestPass123!"
    await user_factory(email=test_email, password=test_password)
    form_data = {
        "username": test_email,
        "password": test_password,
    }

    response = await client.post(
        LOGIN_ENDPOINT_URL,
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    assert response.status_code == status.HTTP_200_OK, f"Response: {response.json()}"
    token = response.json()
    assert "access_token" in token
    assert token["token_type"] == "bearer"


async def test_login_incorrect_password(client: AsyncClient, user_factory):
    """
    Test login attempt with an incorrect password.
    """
    test_email = "wrong.password@example.com"
    test_password = "TestPass123!"
    await user_factory(email=test_email, password=test_password)

    form_data = {
        "username": test_email,
        "password": "wrong-password"
    }

    response = await client.post(
        LOGIN_ENDPOINT_URL,
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect email or password"


async def test_login_nonexistent_user(client: AsyncClient):
    """
    Test login attempt with an email that does not exist.
    """
    form_data = {
        "username": "nonexistent.user@example.com",
        "password": "any-password"
    }

    response = await client.post(
        LOGIN_ENDPOINT_URL,
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect email or password"


async def test_login_requires_form_data(client: AsyncClient):
    """Test that sending JSON to the login endpoint fails."""
    response = await client.post(LOGIN_ENDPOINT_URL, json={"username": "u", "password": "p"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


async def test_token_expired(client: AsyncClient, test_user: User):
    """Test that expired tokens are rejected."""
    access_token = create_access_token(
        data={"sub": test_user.email},
        expires_delta=timedelta(minutes=-1)
    )

    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get("/api/v1/profiles/me", headers=headers)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in response.json()["detail"]


async def test_token_invalid_format(client: AsyncClient):
    """Test that malformed tokens are rejected."""
    headers = {"Authorization": "Bearer invalid.token.format"}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    headers = {"Authorization": "Basic dXNlcjpwYXNz"}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    headers = {"Authorization": "Bearer "}
    response = await client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_multiple_login_tokens(client: AsyncClient, test_user: User):
    """Test that multiple valid tokens can exist for the same user."""
    login_data = {"username": test_user.email, "password": "TestPass123!"}

    response1 = await client.post(LOGIN_ENDPOINT_URL, data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token1 = response1.json()["access_token"]

    response2 = await client.post(LOGIN_ENDPOINT_URL, data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    token2 = response2.json()["access_token"]

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Use an endpoint that requires auth but we know will succeed if auth is valid
    response1 = await client.get("/health", headers=headers1)
    response2 = await client.get("/health", headers=headers2)

    assert response1.status_code == status.HTTP_200_OK
    assert response2.status_code == status.HTTP_200_OK


async def test_token_missing_claims(client: AsyncClient):
    """Test that tokens without required claims are rejected."""
    access_token = create_access_token(
        data={"random": "data"},
        expires_delta=timedelta(minutes=30)
    )

    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get("/api/v1/profiles/me", headers=headers)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in response.json()["detail"]


async def test_deactivated_user_cannot_login(client: AsyncClient, db_session: AsyncSession, test_user: User):
    """
    Test that a user who has been deactivated cannot log in.
    """
    # Deactivate the user directly in the database
    test_user.is_active = False
    db_session.add(test_user)
    await db_session.commit()

    # Attempt to log in with the deactivated user's credentials
    login_data = {"username": test_user.email, "password": "TestPass123!"}
    response = await client.post(LOGIN_ENDPOINT_URL, data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User account is disabled" in response.json()["detail"]


async def test_login_email_normalization(client: AsyncClient, user_factory):
    """
    Test that login is successful with mixed-case email and extra whitespace.
    """
    test_email = "normalize.test@example.com"
    test_password = "TestPass123!"
    await user_factory(email=test_email, password=test_password)
    
    # Use an email with different casing and whitespace
    login_email = "  Normalize.Test@example.com  "
    
    form_data = {
        "username": login_email,
        "password": test_password,
    }
    
    response = await client.post(
        LOGIN_ENDPOINT_URL, 
        data=form_data, 
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "access_token" in response.json()


async def test_login_token_claims(client: AsyncClient, user_factory):
    """
    Test that the JWT returned on login contains the correct claims.
    """
    test_user = await user_factory(
        email="claims.test@example.com", 
        password="TestPass123!",
        role="employer"
    )
    
    form_data = {
        "username": test_user.email,
        "password": "TestPass123!",
    }
    
    response = await client.post(
        LOGIN_ENDPOINT_URL, 
        data=form_data, 
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    token_data = response.json()
    access_token = token_data["access_token"]
    
    # Decode the token to inspect its contents
    payload = decode_access_token(access_token)
    
    assert payload["sub"] == test_user.email
    assert payload["role"] == test_user.role
    assert "exp" in payload # Ensure it has an expiration


async def test_login_enumeration_prevention(client: AsyncClient, user_factory):
    """
    Test that error messages do not reveal if a user exists when attempting login.
    Specifically checks that error messages are identical for non-existent user
    and existing user with wrong password.
    """
    existing_user = await user_factory(email="existing.login@example.com")

    # Attempt to log in with non-existent email
    login_data = {"username": "nonexistent.login@example.com", "password": "AnyPass123!"}
    response = await client.post(LOGIN_ENDPOINT_URL, data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    non_existent_detail = response.json()["detail"]
    assert non_existent_detail == "Incorrect email or password"

    # Attempt to log in with existing email but wrong password
    login_data = {"username": existing_user.email, "password": "WrongPass123!"}
    response = await client.post(LOGIN_ENDPOINT_URL, data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    wrong_password_detail = response.json()["detail"]
    assert wrong_password_detail == "Incorrect email or password"

    # Crucial check: error messages must be identical
    assert non_existent_detail == wrong_password_detail


async def test_login_lockout_existing_user(client: AsyncClient, user_factory):
    """Repeated failed login attempts for an existing user should eventually trigger a lockout (429)."""
    email = f"lockout.user.{secrets.token_hex(4)}@example.com"
    await user_factory(email=email, password="TestPass123!")

    # If Redis isn't available in this test environment, skip the lockout assertion
    if not getattr(fastapi_app.state, "redis", None):
        import pytest as _pytest
        _pytest.skip("Redis not available in test environment; skipping lockout test")

    for i in range(config.settings.RATE_LIMIT_LOGIN_REQUESTS):
        response = await client.post(LOGIN_ENDPOINT_URL, data={"username": email, "password": "bad-pass"}, headers={"Content-Type": "application/x-www-form-urlencoded"})
        # Before threshold, expect 401 Unauthorized for wrong password
        if i < config.settings.RATE_LIMIT_LOGIN_REQUESTS - 1:
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
        else:
            # On or after threshold, expect 429 Too Many Requests
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS


async def test_login_lockout_nonexistent_user(client: AsyncClient):
    """Repeated failed login attempts for a non-existent user should also trigger a lockout (429).
    This ensures attackers cannot distinguish existing vs non-existent accounts via lockout behavior."""
    email = f"noexist.lockout.{secrets.token_hex(4)}@example.com"

    # Skip if Redis not available (lockout is Redis-backed)
    if not getattr(fastapi_app.state, "redis", None):
        import pytest as _pytest
        _pytest.skip("Redis not available in test environment; skipping lockout test")

    for i in range(config.settings.RATE_LIMIT_LOGIN_REQUESTS):
        response = await client.post(LOGIN_ENDPOINT_URL, data={"username": email, "password": "bad-pass"}, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if i < config.settings.RATE_LIMIT_LOGIN_REQUESTS - 1:
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
        else:
            assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS