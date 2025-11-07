"""
FastAPI dependencies for the application.

Dependencies are used for things like getting a database session or
getting the current authenticated user.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

# --- Core Dependencies ---
from app.core.database import get_db
from app.core import security
from app.core.config import settings # Import settings to get JWT_AUDIENCE
from app.models.user import User
from app.schemas.token import TokenData
import logging

logger = logging.getLogger(__name__)

# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# --- Authentication Dependencies --- #
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode token with strict audience and expiry validation
        # Keep token internals at DEBUG level to avoid noisy logs in production/tests
        logger.debug("Decoding token length=%s first16=%s", len(token or ""), (token or "")[:16])
        payload = security.decode_access_token(token)
        logger.debug("Decoded payload keys: %s", list(payload.keys()))

        # Extract user identifier
        username = payload.get("sub")
        logger.debug("Username from payload: %r", username)
        if not username:
            raise credentials_exception

    except JWTError as e:
        logger.debug("Token decode/validation error: %s", str(e))
        raise credentials_exception from e

    logger.debug("Looking up user by email=%s", username)
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none()
    logger.debug("User lookup result: %s", getattr(user, 'email', None))
    
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user