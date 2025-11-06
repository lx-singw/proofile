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
    ENVIRONMENT: str = "development"
    # Optional SQLAlchemy settings
    SQLALCHEMY_ECHO: bool = False
    SQLALCHEMY_POOL_SIZE: int | None = None
    SQLALCHEMY_MAX_OVERFLOW: int | None = None
    SQLALCHEMY_POOL_TIMEOUT: int | None = None

settings = Settings()
