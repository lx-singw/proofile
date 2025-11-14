"""
FastAPI dependencies for the application.

Dependencies are used for things like getting a database session or
getting the current authenticated user.
"""
import asyncio
from dataclasses import dataclass, replace
import time
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

# --- Core Dependencies ---
from app.core.database import get_db
from app.core import security
from app.core.config import settings # Import settings to get JWT_AUDIENCE
from app.models.user import User, UserRole
from app.schemas.token import TokenData
import logging

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 5.0

@dataclass(frozen=True)
class CachedUser:
    id: int
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool

_token_cache: dict[str, tuple[CachedUser, float]] = {}
_token_locks: dict[str, asyncio.Lock] = {}
_MAX_CACHE_SIZE = 1000

def _evict_expired_cache_entries():
    """Remove expired entries to prevent unbounded cache growth."""
    now = time.monotonic()
    expired = [token for token, (_, expires_at) in _token_cache.items() if expires_at <= now]
    for token in expired:
        _token_cache.pop(token, None)
        _token_locks.pop(token, None)
    
    # If still too large, remove oldest entries
    if len(_token_cache) > _MAX_CACHE_SIZE:
        sorted_entries = sorted(_token_cache.items(), key=lambda x: x[1][1])
        for token, _ in sorted_entries[:len(_token_cache) - _MAX_CACHE_SIZE]:
            _token_cache.pop(token, None)
            _token_locks.pop(token, None)

# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# --- Authentication Dependencies --- #
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> CachedUser:
    # Periodically clean up expired entries
    if len(_token_cache) > _MAX_CACHE_SIZE * 0.8:
        _evict_expired_cache_entries()
    
    lock = _token_locks.setdefault(token, asyncio.Lock())
    async with lock:
        now = time.monotonic()
        cached_entry = _token_cache.get(token)
        if cached_entry:
            cached_user, expires_at = cached_entry
            if expires_at > now:
                return replace(cached_user)
            _token_cache.pop(token, None)
            _token_locks.pop(token, None)

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            # Decode token with strict audience and expiry validation
            logger.debug("Decoding token length=%s first16=%s", len(token or ""), (token or "")[:16])
            payload = security.decode_access_token(token)
            logger.debug("Decoded payload keys: %s", list(payload.keys()))

            # Extract user identifier
            username = payload.get("sub")
            logger.debug("Username from payload: %r", username)
            if not username:
                logger.warning("Authentication failed: missing subject in token")
                raise credentials_exception

        except JWTError as e:
            logger.warning("Authentication failed: token validation error - %s", str(e))
            raise credentials_exception from e

        logger.debug("Looking up user by email=%s", username)
        try:
            result = await db.execute(select(User).where(User.email == username))
            user = result.scalar_one_or_none()
            logger.debug("User lookup result: %s", getattr(user, 'email', None))
        except Exception as e:
            logger.exception("Database error during user lookup: %s", e)
            raise credentials_exception from e
        
        if user is None:
            logger.warning("Authentication failed: user not found for email=%s", username)
            raise credentials_exception
        
        logger.debug("User authenticated successfully: %s", username)
        cached_user = CachedUser(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role if isinstance(user.role, UserRole) else UserRole(user.role),
            is_active=user.is_active,
        )
        _token_cache[token] = (cached_user, now + _CACHE_TTL_SECONDS)
        return replace(cached_user)

async def get_current_active_user(
    current_user: CachedUser = Depends(get_current_user)
) -> CachedUser:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user