"""
Pytest fixtures for testing the application.

This file configures a test client and an isolated test database for each test function,
ensuring that tests are independent and use a separate test database.
"""
import asyncio
from typing import AsyncGenerator
from urllib.parse import urlparse
import os

# Ensure tests run with the test environment BEFORE importing app settings
# Pydantic `BaseSettings` reads environment variables at import time, so set
# ENVIRONMENT early so `app.core.config.settings` picks up the test config.
os.environ["ENVIRONMENT"] = "test"

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.sql import text

from app.main import app
from app.core import config
from app.api.v1.deps import get_db, get_current_user
from app.models.base import Base
from app.models.user import User, UserRole
from app.core.config import settings

# Forcing the test DB name for postgres when running full integration tests
POSTGRES_TEST_URL = config.settings.DATABASE_URL.replace("_dev", "_test")
TEST_DB_NAME = urlparse(POSTGRES_TEST_URL).path.strip("/")


@pytest_asyncio.fixture(scope="session")
async def engine() -> AsyncGenerator:
    """Create and dispose an async engine for tests."""
    _engine = create_async_engine(
        POSTGRES_TEST_URL,
        echo=False,
        pool_pre_ping=False,
        poolclass=NullPool,
        future=True,
        execution_options={"isolation_level": "REPEATABLE READ"},
    )
    try:
        yield _engine
    finally:
        await _engine.dispose()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_db(engine) -> AsyncGenerator[None, None]:
    """Create and tear down a dedicated test database for the session."""
    maintenance_url = config.settings.DATABASE_URL.replace(
        urlparse(config.settings.DATABASE_URL).path, "/postgres"
    )
    maintenance_engine = create_async_engine(
        maintenance_url,
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
        echo=False
    )

    try:
        # Create test database
        async with maintenance_engine.connect() as conn:
            # Drop active connections
            await conn.execute(text(f"""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '{TEST_DB_NAME}'
                AND pid <> pg_backend_pid();
            """))
            # Drop and recreate test database
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
            await conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}" TEMPLATE template0'))

        # Initialize test database schema
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        yield

    finally:
        # Drop database after all tests
        try:
            async with maintenance_engine.connect() as conn:
                # Force drop active connections again before final drop
                await conn.execute(text(f"""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '{TEST_DB_NAME}'
                    AND pid <> pg_backend_pid();
                """))
                await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        except Exception as e:
            print(f"Warning: Failed to drop test database: {e}")
        finally:
            await maintenance_engine.dispose()



@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Get a test database session with proper cleanup."""
    TestingSessionLocal = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        # Clean up all tables after each test to ensure isolation
        async with engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
        await session.close()


@pytest_asyncio.fixture(scope="function")
async def client(db_session, engine) -> AsyncGenerator[AsyncClient, None]:
    """Provide an httpx AsyncClient with the get_db dependency overridden.

    Provide a fresh AsyncSession per request to avoid sharing the same
    AsyncSession across concurrent requests (AsyncSession is not safe for
    concurrent use). We create a sessionmaker bound to the provided test
    engine and yield a new session for each dependency call.
    """
    # override dependency to return a fresh session per request
    async def _get_db_override():
        TestingSessionLocal = sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _get_db_override
    from httpx import ASGITransport

    # Common headers for all requests
    headers = {
        "Accept": "application/json",
    }
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=headers,
        follow_redirects=True,
    ) as ac:
        try:
            yield ac
        finally:
            app.dependency_overrides.pop(get_db, None) # Only remove the override this fixture added


@pytest_asyncio.fixture
async def user_factory(db_session: AsyncSession):
    """
    Fixture that returns a factory for creating test users.
    This allows creating multiple unique users within a single test.
    """
    from app.models.user import User
    from app.schemas.user import UserCreate
    from app.services import user_service
    from app.core.security import get_password_hash
    import uuid

    async def _create_user(
        email: str | None = None,
        password: str = "SecurePass123!",
        full_name: str = "Test User",
        role: str = UserRole.APPRENTICE,
        is_active: bool = True
    ) -> User:
        if email is None:
            email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        user = User(
            email=email.lower(),
            full_name=full_name,
            role=role,
            is_active=is_active,
            hashed_password=get_password_hash(password)
        )
        # Persist the user in the provided db_session and return it.
        db_session.add(user)
        # Commit the transaction so the user is visible to other sessions
        await db_session.commit()
        await db_session.refresh(user)
        return user

    # Return the factory function to tests
    return _create_user
@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    """
    Creates a default test user for simple tests.
    This is function-scoped to ensure test isolation.
    """
    from app.core.security import get_password_hash
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("TestPass123!"),
        role=UserRole.APPRENTICE,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    """
    Returns a headers dict with the authorization token for test_user.
    This fixture creates a token directly without using the API endpoint.
    """
    from app.core.security import create_access_token
    
    # Create token directly
    token = create_access_token(
        data={
            "sub": test_user.email,
            "aud": settings.JWT_AUDIENCE,  # Set the audience
            "role": test_user.role,  # Include role in claims
            "jti": str(test_user.id)  # Add JWT ID
        }
    )
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


@pytest_asyncio.fixture
async def use_test_user(test_user: User):
    """
    Fixture to override `get_current_user` dependency to always return the
    provided `test_user`. Use this in tests that don't need full token
    validation but require a stable authenticated user object.

    Usage:
        async def test_something(client, use_test_user):
            # requests through `client` will receive `test_user` as the
            # current user for dependencies that depend on `get_current_user`.
    """
    async def _override_current_user():
        return test_user

    # Install override
    app.dependency_overrides[get_current_user] = _override_current_user
    try:
        yield
    finally:
        # Clean up override after the test so other tests are unaffected
        app.dependency_overrides.pop(get_current_user, None)
