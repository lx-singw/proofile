import os
import socket
import uuid
from urllib.parse import urlparse

import pytest
import httpx


def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def running_in_container() -> bool:
    """Heuristic: return True when running inside a container environment.

    Checks for common env vars used in this repo (BACKEND_INTERNAL_URL / FRONTEND_INTERNAL_URL),
    the presence of /.dockerenv, or cgroup markers that mention 'docker' or 'kubepods'.
    """
    if os.environ.get("BACKEND_INTERNAL_URL") or os.environ.get("FRONTEND_INTERNAL_URL"):
        return True
    if os.path.exists("/.dockerenv"):
        return True
    try:
        with open("/proc/1/cgroup", "rt") as f:
            cgroup = f.read()
            if "docker" in cgroup or "kubepods" in cgroup:
                return True
    except Exception:
        # Best-effort only; fall through to False
        pass
    return False


def host_port_from_url(url: str) -> tuple[str, int]:
    p = urlparse(url)
    host = p.hostname or "127.0.0.1"
    port = p.port
    if port is None:
        port = 443 if p.scheme == "https" else 80
    return host, port


@pytest.mark.asyncio
async def test_post_user_direct_and_via_frontend_proxy():
    """POST a user directly to backend and via frontend proxy and compare results.

    This is an integration-style test that requires the backend (localhost:8000)
    and the frontend dev server (localhost:3000) to be running. If either is not
    reachable the test will be skipped.
    """
    # Pick URLs that make sense for the execution environment. When running
    # inside the backend container (docker-compose), prefer internal hostnames
    # and allow overriding via BACKEND_INTERNAL_URL / FRONTEND_INTERNAL_URL env vars.
    if running_in_container():
        backend_url = os.environ.get("BACKEND_INTERNAL_URL") or "http://backend:8000"
        frontend_url = os.environ.get("FRONTEND_INTERNAL_URL") or "http://frontend:3000"
    else:
        # Local development / test runner on host
        backend_url = os.environ.get("BACKEND_INTERNAL_URL") or "http://127.0.0.1:8000"
        frontend_url = os.environ.get("FRONTEND_INTERNAL_URL") or "http://127.0.0.1:3000"

    backend_host, backend_port = host_port_from_url(backend_url)
    frontend_host, frontend_port = host_port_from_url(frontend_url)

    if not is_port_open(backend_host, backend_port):
        pytest.skip(f"Backend not reachable at {backend_url}; skipping proxy test")
    if not is_port_open(frontend_host, frontend_port):
        pytest.skip(f"Frontend dev server not reachable at {frontend_url}; skipping proxy test")

    # Use different emails to avoid duplicate-email errors
    email_direct = f"proxy-direct-{uuid.uuid4().hex[:8]}@example.com"
    email_proxy = f"proxy-via-{uuid.uuid4().hex[:8]}@example.com"
    payload_direct = {"email": email_direct, "password": "SuperSecret123!"}
    payload_proxy = {"email": email_proxy, "password": "SuperSecret123!"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        # Direct to backend
        resp_direct = await client.post(f"{backend_url}/api/v1/users", json=payload_direct)

        # Via frontend proxy
        resp_proxy = await client.post(f"{frontend_url}/api/v1/users", json=payload_proxy)

    # Expect success codes from both (201 or 200 depending on implementation)
    assert resp_direct.status_code in (200, 201), f"direct backend failed: {resp_direct.status_code} {resp_direct.text}"
    assert resp_proxy.status_code in (200, 201), f"proxy request failed: {resp_proxy.status_code} {resp_proxy.text}"

    # Try to parse JSON and ensure the email is present in response
    try:
        direct_json = resp_direct.json()
    except Exception:
        pytest.fail(f"direct backend returned non-json: {resp_direct.text}")

    try:
        proxy_json = resp_proxy.json()
    except Exception:
        pytest.fail(f"proxy returned non-json: {resp_proxy.text}")

    assert direct_json.get("email") == email_direct
    assert proxy_json.get("email") == email_proxy
