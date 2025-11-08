from pydantic_settings import BaseSettings, SettingsConfigDict

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

settings = Settings()
