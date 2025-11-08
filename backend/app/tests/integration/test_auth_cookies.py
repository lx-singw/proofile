import pytest
from httpx import AsyncClient
from starlette import status


@pytest.mark.asyncio
async def test_login_sets_refresh_and_csrf_cookies(client: AsyncClient, user_factory):
  user = await user_factory(email="cookieuser@example.com", password="TestPass123!")
  data = {"username": user.email, "password": "TestPass123!"}
  resp = await client.post("/api/v1/auth/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
  assert resp.status_code == status.HTTP_200_OK

  set_cookie_headers = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else []
  # Fallback for environments where headers.get_list isn't available
  if not set_cookie_headers:
    raw = resp.headers.get("set-cookie")
    if raw:
      set_cookie_headers = raw.split("\n")

  # Expect both refresh and CSRF cookies present
  joined = "\n".join(set_cookie_headers).lower()
  assert "refresh_token=" in joined
  assert "httponly" in joined  # refresh should be HttpOnly
  assert "path=/" in joined
  assert "samesite=" in joined
  # CSRF should be readable (not httponly)
  assert "xsrf-token=" in joined


@pytest.mark.asyncio
async def test_refresh_requires_csrf_and_refresh_cookie(client: AsyncClient, user_factory):
  user = await user_factory(email="refreshcheck@example.com", password="TestPass123!")
  data = {"username": user.email, "password": "TestPass123!"}
  resp = await client.post("/api/v1/auth/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
  assert resp.status_code == status.HTTP_200_OK

  # Extract cookies set by login
  cookies = {}
  for header in (resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else []):
    parts = header.split(";")
    kv = parts[0]
    if "=" in kv:
      k, v = kv.split("=", 1)
      cookies[k.strip()] = v.strip()

  # If get_list wasn't available, try to parse combined header
  if not cookies:
    raw = resp.headers.get("set-cookie")
    if raw:
      for header in raw.split("\n"):
        parts = header.split(";")
        kv = parts[0]
        if "=" in kv:
          k, v = kv.split("=", 1)
          cookies[k.strip()] = v.strip()

  # Missing CSRF header -> 403
  resp2 = await client.post("/api/v1/auth/refresh")
  assert resp2.status_code == status.HTTP_403_FORBIDDEN

  # Provide mismatched CSRF header -> 403
  resp3 = await client.post("/api/v1/auth/refresh", headers={"X-XSRF-TOKEN": "bad"})
  assert resp3.status_code == status.HTTP_403_FORBIDDEN

  # Provide correct cookies and header -> 200
  headers = {"X-XSRF-TOKEN": cookies.get("XSRF-TOKEN", "")}
  resp4 = await client.post("/api/v1/auth/refresh", headers=headers, cookies={"refresh_token": cookies.get("refresh_token",""), "XSRF-TOKEN": cookies.get("XSRF-TOKEN","")})
  assert resp4.status_code == status.HTTP_200_OK
  data = resp4.json()
  assert "access_token" in data and data["access_token"]
