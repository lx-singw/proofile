# Copilot / AI agent instructions for Proofile

These instructions help an automated coding assistant get productive in this repo quickly. Keep guidance concise and actionable — reference files below for implementation patterns.

1) Big picture (where to edit)
- Backend: `backend/` — FastAPI app lives under `backend/app/`.
  - Entry: `backend/app/main.py` (FastAPI app, lifespan hooks, middleware).
  - Settings: `backend/app/core/config.py` (Pydantic Settings v2).
  - DB: `backend/app/core/database.py` (SQLAlchemy 2 async engine + `get_db` dependency).
  - Models: `backend/app/models/*.py` (e.g. `user.py`, `profile.py`). Use relationships and TimestampMixin patterns.
- Frontend: `frontend/` — Next.js app. Keep API calls pointed to `NEXT_PUBLIC_API_URL`.
- Infra/compose: top-level `docker-compose.yml` orchestrates `postgres`, `redis`, `backend`, `frontend`.

2) Key constraints and patterns (do this in code you generate)
- Async-first backend: use async endpoints, `AsyncSession` from `backend/app/core/database.py` and the `get_db` dependency. Avoid mixing sync DB calls.
- Pydantic v2 / pydantic-settings: settings are in `backend/app/core/config.py` (Settings uses `SettingsConfigDict`). Read env vars from `.env` via Docker Compose.
- Passwords & auth: use `app/core/security.py` helpers (and `passlib`/bcrypt). `app/core/auth.py` shows usage of `security.pwd_context.verify`.
- Model changes: update SQLAlchemy models under `backend/app/models/` and add Alembic migrations under `backend/alembic/versions/`.
- Database URLs must use asyncpg driver (see `database.py` URL enforcement). When adding DB connections, follow that pattern.
- Avoid adding secret values into code — read from `config.Settings` (env).

3) Developer workflows (explicit commands and examples)
- Start dev environment (uses docker-compose):
  - make start-dev  # runs `docker-compose up -d --build`
  - make stop-dev   # runs `docker-compose down`
- Apply DB migrations:
  - make migrate    # runs `docker-compose exec backend alembic upgrade head`
- Run backend tests:
  - make test-backend  # runs pytest inside backend container: `docker-compose exec backend poetry run pytest`
- Linting & pre-commit:
  - make lint   # runs pre-commit
- Container build: `docker-compose build backend` or rely on `make start-dev`.

4) Dependency and packaging notes
- Backend uses Poetry (see `backend/pyproject.toml`). If you add a runtime dependency, add it to `pyproject.toml` and prefer pinning compatible versions.
- Frontend is Node/Next — update `frontend/package.json` when adding client-side libs.

5) Integrations and external services to be aware of
- The backend depends on external services: PostgreSQL, Redis, Celery, and optional AI/embedding providers configured via dependencies in `pyproject.toml` (OpenAI, Anthropic, Pinecone, Supabase). When coding, add feature flags and fail-safe behavior if those env vars are missing.
- Use `app.state.redis` (set up in `main.py` lifespan) instead of creating separate global Redis clients.

6) Tests and patterns to follow
- Use `pytest` + `pytest-asyncio` for async tests. See `backend/pytest.ini` for config.
- Async testing requires proper event loop handling:
  ```python
  @pytest_asyncio.fixture(scope="session")
  def event_loop():
      import asyncio
      loop = asyncio.new_event_loop()
      yield loop
      loop.close()
  ```
- For FastAPI endpoints, use `httpx.AsyncClient` with the app's ASGI interface:
  ```python
  test_client = AsyncClient(
      base_url="http://test",
      app=app._app,  # Get the underlying ASGI app
      headers={"Content-Type": "application/json"}
  )
  ```
- Database fixtures should use separate test database (see `app/tests/conftest.py:db_session`).
- Prefer integration-style tests that run inside the container (CI mirrors `make test-backend`).

7) Security & supply-chain checks (required)
- The repo contains `.github/instructions/snyk_rules.instructions.md`. Follow it: always run `snyk_code_scan` on newly generated first-party code in supported languages and remediate issues before finalizing changes.

8) When making changes, follow these concrete rules
- Keep changes contained: prefer edits under `backend/app/` for backend features.
- If adding DB columns/tables: add Alembic migration `backend/alembic/versions/<ts>_xxx.py` and update models.
- If adding settings: add default values to `backend/app/core/config.py` and reference them via `settings.<NAME>`.
- When changing startup/shutdown behavior, update `backend/app/main.py` lifespan context.

9) Useful examples from the codebase
- Async DB dependency pattern: `backend/app/core/database.py:get_db` — use this in endpoints.
- Auth example: `backend/app/core/auth.py:authenticate_user` demonstrates selecting `User` and verifying password.
- Model relationships: `backend/app/models/profile.py` showing `user = relationship(...)` and `user.py` showing `profile` mapping.

10) Safety notes for the assistant
- Do not make network calls or change CI credentials. Add code that reads external credentials from env vars (do not hardcode them).
- Avoid introducing new top-level scripts without tests or docker-compose updates. If you add a service, update `docker-compose.yml` and `Makefile` accordingly.

If anything above is unclear or you want the guidance to be stricter (e.g., coding style rules, test coverage targets, or branch/PR conventions), tell me which area to expand and I will iterate.