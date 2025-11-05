from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileCreate, ProfileUpdate
from app.api.v1.deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[ProfileResponse])
async def read_profiles(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1)
):
    """
    Retrieve a list of profiles with pagination.
    """
    result = await db.execute(select(Profile).offset(skip).limit(limit))
    profiles = result.scalars().all()
    return profiles


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific profile by its ID.
    """
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    return profile


@router.patch("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: int,
    profile_update: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a profile's information.
    """
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this profile"
        )

    # Get the update data, excluding fields that were not set in the request
    update_data = profile_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a profile.
    """
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this profile"
        )

    await db.delete(profile)
    await db.commit()

    return None


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new profile for a user.
    """
    new_profile = Profile(
        user_id=profile_data.user_id,
        headline=profile_data.headline,
        summary=profile_data.summary
    )
    db.add(new_profile)
    try:
        await db.commit()
        await db.refresh(new_profile)
        return new_profile
    except IntegrityError:
        await db.rollback()
        # This can happen if the user_id doesn't exist (foreign key violation)
        # or if a profile for that user_id already exists (unique constraint).
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create profile. User ID {profile_data.user_id} may not exist or may already have a profile."
        )