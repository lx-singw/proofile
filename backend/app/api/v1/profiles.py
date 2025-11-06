from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

from app.api.v1 import deps
from app.models.profile import Profile
from app.models.user import User
from app.services import profile_service
from app.models.user import UserRole
from app.schemas.profile import ProfileResponse, ProfileCreate, ProfileUpdate

router = APIRouter()

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get the profile of the current authenticated user.
    """
    profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for the current user."
        )
    return profile


@router.get("/", response_model=List[ProfileResponse])
async def read_profiles(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1)
):
    """
    Retrieve a list of profiles with pagination.
    """
    profiles = await profile_service.get_profiles(db=db, skip=skip, limit=limit)
    return profiles


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: int,
    db: AsyncSession = Depends(deps.get_db)
):
    """
    Get a specific profile by its ID.
    """
    profile = await profile_service.get_profile(db, id=profile_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    return profile


@router.patch("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: int,
    profile_update: ProfileUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Update a profile's information.
    """
    profile = await profile_service.get_profile(db, id=profile_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id and current_user.role != UserRole.ADMIN:
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

    updated_profile = await profile_service.update_profile(db=db, profile=profile, profile_in=profile_update)
    return updated_profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Delete a profile.
    """
    profile = await profile_service.get_profile(db, id=profile_id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this profile"
        )

    await profile_service.delete_profile(db=db, profile=profile)

    return None


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create a new profile for the current authenticated user.
    """
    existing_profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A profile for this user already exists."
        )

    try:
        new_profile = await profile_service.create_profile(
            db=db, profile_in=profile_data, user_id=current_user.id
        )
        return new_profile
    except IntegrityError: # Should be rare now, but good as a safeguard.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the profile."
        )