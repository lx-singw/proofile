from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError
import logging
import os

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Pydantic will automatically read from environment variables.
    # We let Docker Compose handle loading the .env file.
    model_config = SettingsConfigDict(extra='ignore')
    
    PROJECT_NAME: str = "Proofile API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://proofile_user:proofile_password@postgres:5432/proofile_dev"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_AUDIENCE: str = "proofile:auth"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    ENVIRONMENT: str = "development"
    # Password settings
    PASSWORD_MIN_LENGTH: int = 8
    # bcrypt has an effective 72-character password limit; keep default aligned with that
    PASSWORD_MAX_LENGTH: int = 72
    PASSWORD_REQUIRE_SPECIAL: bool = True
    PASSWORD_REQUIRE_NUMBERS: bool = True
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    # Optional SQLAlchemy settings
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_POOL_SIZE: int | None = None
    SQLALCHEMY_MAX_OVERFLOW: int | None = None
    SQLALCHEMY_POOL_TIMEOUT: int | None = None
    # Rate limit settings
    RATE_LIMIT_DEFAULT_REQUESTS: int = 60  # requests per minute
    RATE_LIMIT_DEFAULT_WINDOW: int = 60  # seconds
    RATE_LIMIT_LOGIN_REQUESTS: int = 50  # login attempts per minute
    RATE_LIMIT_LOGIN_WINDOW: int = 60  # seconds
    RATE_LIMIT_REGISTRATION_REQUESTS: int = 30  # registrations per minute
    RATE_LIMIT_REGISTRATION_WINDOW: int = 60  # seconds

    # Cookie/CSRF settings (front-end can use XSRF-TOKEN header support)
    CSRF_COOKIE_NAME: str = "XSRF-TOKEN"
    CSRF_HEADER_NAME: str = "X-XSRF-TOKEN"
    COOKIE_SAMESITE: str = "lax"  # 'lax' | 'strict' | 'none'
    COOKIE_SECURE: bool = False  # set True in production behind HTTPS
    REFRESH_COOKIE_NAME: str = "refresh_token"
    # CSRF settings: disable in test/development environment for easier testing
    # In production, always enable CSRF. In development/test, can disable for testing convenience.
    CSRF_ENABLED: bool = True
    # Allow enabling test-only routes (disabled by default)
    ENABLE_TEST_ROUTES: bool = False

try:
    settings = Settings()

    # Align runtime environment with current ENVIRONMENT variable (tests set this dynamically).
    runtime_env = os.getenv("ENVIRONMENT")
    if runtime_env:
        settings.ENVIRONMENT = runtime_env

    # Pytest sets PYTEST_CURRENT_TEST; treat that as test environment for defensive checks.
    if "PYTEST_CURRENT_TEST" in os.environ:
        settings.ENVIRONMENT = "test"

    # Only override CSRF if not explicitly provided via env/config.
    csrf_user_override = "CSRF_ENABLED" in settings.model_fields_set or os.getenv("CSRF_ENABLED") is not None
    if not csrf_user_override:
        settings.CSRF_ENABLED = settings.ENVIRONMENT != "development"

    if settings.ENVIRONMENT == "production" and settings.SECRET_KEY == "your-secret-key-change-in-production":
        raise ValueError("SECRET_KEY must be changed in production environment")
    logger.info("Configuration loaded successfully")
    logger.info(f"CSRF validation: {'ENABLED' if settings.CSRF_ENABLED else 'DISABLED'} (Environment: {settings.ENVIRONMENT})")
except ValidationError as e:
    logger.error(f"Configuration validation failed: {e}")
    raise RuntimeError(f"Invalid configuration: {e}") from e
except Exception as e:
    logger.error(f"Failed to load configuration: {e}")
    raise RuntimeError(f"Configuration loading failed: {e}") from e
