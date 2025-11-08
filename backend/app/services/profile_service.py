from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate


async def get_profiles(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Profile]:
    """Retrieve profiles with pagination."""
    result = await db.execute(
        select(Profile).offset(skip).limit(limit).order_by(Profile.id)
    )
    return list(result.scalars().all())


async def get_profile(db: AsyncSession, id: int) -> Profile | None:
    """Retrieve a single profile by its ID."""
    result = await db.execute(select(Profile).where(Profile.id == id))
    return result.scalar_one_or_none()


async def get_profile_by_user_id(db: AsyncSession, user_id: int) -> Profile | None:
    """Retrieve a profile by the user's ID."""
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    return result.scalar_one_or_none()


async def create_profile(db: AsyncSession, profile_in: ProfileCreate, user_id: int) -> Profile:
    """Create a new profile for a user."""
    new_profile = Profile(**profile_in.model_dump(), user_id=user_id)
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return new_profile


async def update_profile(db: AsyncSession, profile: Profile, profile_in: ProfileUpdate) -> Profile:
    """
    Update a profile's information safely with row-level locking.
    """
    # Re-fetch the profile with a lock to prevent race conditions
    stmt = select(Profile).where(Profile.id == profile.id).with_for_update()
    result = await db.execute(stmt)
    locked_profile = result.scalar_one_or_none()

    if not locked_profile:
        # This case is unlikely if the initial check passed, but it's good practice
        return None 

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(locked_profile, field, value)
    
    db.add(locked_profile)
    await db.commit()
    await db.refresh(locked_profile)
    return locked_profile


async def delete_profile(db: AsyncSession, profile: Profile) -> None:
    """Delete a profile."""
    await db.delete(profile)
    await db.commit()
    return None