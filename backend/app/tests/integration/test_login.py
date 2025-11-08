"""
Integration tests for the /api/v1/login/access-token endpoint.
"""
import pytest
from httpx import AsyncClient
from fastapi import status

pytestmark = pytest.mark.asyncio

LOGIN_ENDPOINT_URL = "/api/v1/auth/token"


async def test_login_success(client: AsyncClient, user_factory):
    """
    Test successful login with correct credentials.
    """
    test_email = "test.login@example.com"
    test_password = "TestPass123!"
    await user_factory(email=test_email, password=test_password)
        # OAuth2 password flow expects username/password only as form data
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
