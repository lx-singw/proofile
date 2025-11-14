import pytest
from httpx import AsyncClient
from starlette import status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

@pytest.mark.asyncio
async def test_refresh_with_inactive_user_fails(
    client: AsyncClient, user_factory, db_session: AsyncSession
):
    # 1. Create a user and log in to get a valid refresh token
    user = await user_factory(email="inactive_refresh@example.com", password="TestPass123!")
    login_data = {"username": user.email, "password": "TestPass123!"}
    login_resp = await client.post(
        "/api/v1/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == status.HTTP_200_OK

    # Extract cookies
    cookies = {}
    for header in login_resp.headers.get_list("set-cookie"):
        parts = header.split(";")
        kv = parts[0]
        if "=" in kv:
            k, v = kv.split("=", 1)
            cookies[k.strip()] = v.strip()

    refresh_token = cookies.get("refresh_token")
    xsrf_token = cookies.get("XSRF-TOKEN")
    assert refresh_token and xsrf_token

    # 2. Deactivate the user in the database
    user_to_deactivate = await db_session.get(User, user.id)
    user_to_deactivate.is_active = False
    db_session.add(user_to_deactivate)
    await db_session.commit()

    # 3. Attempt to refresh the token
    refresh_headers = {"X-XSRF-TOKEN": xsrf_token}
    refresh_cookies = {"refresh_token": refresh_token, "XSRF-TOKEN": xsrf_token}
    
    refresh_resp = await client.post(
        "/api/v1/auth/refresh", headers=refresh_headers, cookies=refresh_cookies
    )

    # 4. Assert that the refresh fails with a 401 Unauthorized error
    assert refresh_resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert "inactive" in refresh_resp.json()["detail"]
