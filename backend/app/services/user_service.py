"""
Service layer for user-related operations.

This encapsulates the business logic for creating, retrieving,
and managing users, separating it from the API endpoints.
"""
import logging
import traceback
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """
    Retrieve a user from the database by their email address.
    """
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """
    Retrieve a user from the database by their ID.
    """
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """
    Create a new user in the database.

    - Hashes the password before storing.
    - Creates a new User model instance.
    - Adds it to the session and commits.
    - Refreshes the instance to get the ID and other defaults from the DB.
    """
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role,
    )
    try:
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError:
        await db.rollback()
        raise
    except ValueError:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        try:
            search_path = await db.execute(text("SHOW search_path"))
            logging.getLogger(__name__).error("Current search_path: %s", search_path.scalar())
        except Exception:
            logging.getLogger(__name__).exception("Failed to inspect search_path after user create error")
        logging.getLogger(__name__).error("User creation failed with %s", repr(e))
        logging.getLogger(__name__).debug("User creation traceback:\n%s", traceback.format_exc())
        print("USER_CREATE_ERR:", repr(e), flush=True)
        print("USER_CREATE_TRACE:", traceback.format_exc(), flush=True)
        raise RuntimeError(f"Failed to create user: {e}") from e
 
async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    """
    Update a user's details.
    """
    update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        user.hashed_password = hashed_password

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError:
        await db.rollback()
        raise
    except ValueError:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise RuntimeError(f"Failed to update user: {e}") from e