"""
Core authentication logic.
"""
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, USER_STATUS_CACHE
from app.core import security

logger = logging.getLogger(__name__)


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> User | None:
    """
    Authenticate a user by email and password.

    Args:
        db: The database session.
        email: The user's email.
        password: The user's password.

    Returns:
        The user object if authentication is successful, otherwise None.
    """
    """
    Authenticate a user by email and password.

    Args:
        db: The database session
        email: The user's email (case-insensitive)
        password: The password to verify

    Returns:
        User object if authentication succeeds, None otherwise
    """
    try:
        # Normalize email and fetch user
        email = email.lower().strip()
        result = await db.execute(
            select(User).where(User.email == email).limit(1)
        )
        user = result.scalars().first()

        if not user:
            logger.debug("authenticate_user: no user found for email=%s", email)
            return None

        cache_entry = USER_STATUS_CACHE.get(user.email.lower())
        if cache_entry and cache_entry[0] == user.id:
            _, cached_updated_at, cached_active = cache_entry
            db_updated_at = user.updated_at or datetime.min
            if cached_updated_at >= db_updated_at:
                user.is_active = cached_active
                logger.debug(
                    "authenticate_user: applied cached active state=%s for email=%s",
                    cached_active,
                    email,
                )

        # If the user exists but is inactive, continue to verify the password
        # to avoid timing differences that could be used for enumeration.
        if not user.is_active:
            logger.debug("authenticate_user: user found but inactive email=%s", email)
            # do not return early; still verify password below and return the user
            # so callers can distinguish inactive accounts and return a specific
            # error message while maintaining similar timing to active accounts.

        # Verify password using the security utilities
        try:
            verified = security.verify_password(password, user.hashed_password)
        except Exception as e:
            logger.exception("Error verifying password for %s: %s", email, e)
            return None

        logger.debug("authenticate_user: password verified=%s for email=%s", verified, email)

        if not verified:
            return None

        return user
    except Exception as e:
        # Log the error but don't expose it to the client
        logger.exception("Authentication error: %s", e)
        return None