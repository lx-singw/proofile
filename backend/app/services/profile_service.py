"""
Service layer for profile-related operations.

This encapsulates the business logic for creating, retrieving,
and managing user profiles, separating it from the API endpoints.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate


async def get_profile(db: AsyncSession, id: int) -> Optional[Profile]:
    """
    Retrieve a profile from the database by its primary key.
    """
    return await db.get(Profile, id)


async def get_profile_by_user_id(db: AsyncSession, user_id: int) -> Optional[Profile]:
    """
    Retrieve a profile from the database by the user's ID.
    """
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    return result.scalar_one_or_none()


async def get_profiles(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Profile]:
    """
    Retrieve a list of profiles with pagination.
    """
    result = await db.execute(select(Profile).offset(skip).limit(limit))
    return list(result.scalars().all())


async def create_profile(db: AsyncSession, profile_in: ProfileCreate, user_id: int) -> Profile:
    """
    Create a new profile for a user.
    """
    new_profile = Profile(**profile_in.model_dump(), user_id=user_id)
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return new_profile


async def update_profile(db: AsyncSession, profile: Profile, profile_in: ProfileUpdate) -> Profile:
    """
    Update a profile's information.
    """
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_profile(db: AsyncSession, profile: Profile) -> None:
    """
    Delete a profile from the database.
    """
    await db.delete(profile)
    await db.commit()
    return