from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Ensure we use asyncpg
db_url = settings.DATABASE_URL
if "postgresql://" in db_url and "+asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    db_url,
    pool_pre_ping=True,
    echo=True
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    """FastAPI dependency to get a DB session."""
    async with AsyncSessionLocal() as session:
        yield session
