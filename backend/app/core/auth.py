"""
Core authentication logic.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core import security


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
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not security.pwd_context.verify(password, user.hashed_password):
        return None
    return user