from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from pathlib import Path
from sqlalchemy import select

from app.core.file_upload import (
    validate_file_size,
    validate_file_extension,
    validate_file_content,
    save_upload_file
)

from app.api.v1 import deps
from app.models.user import User
from app.models.profile import Profile
from app.services import profile_service, profile_cache
from app.models.user import UserRole
from app.schemas.profile import ProfileRead, ProfileCreate, ProfileUpdate

router = APIRouter(redirect_slashes=False)

# Standard error messages
PROFILE_NOT_FOUND = "Profile not found"

@router.get("/", response_model=list[ProfileRead])
@router.get("", response_model=list[ProfileRead], include_in_schema=False)
async def list_profiles(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List profiles with pagination.
    """
    cached = await profile_cache.get_profile_list(skip, limit)
    if cached is not None:
        return cached

    rows = await db.execute(
        select(
            Profile.id,
            Profile.user_id,
            Profile.headline,
            Profile.summary,
            Profile.avatar_url,
        )
        .offset(skip)
        .limit(limit)
        .order_by(Profile.id)
    )
    profile_payload = [dict(row) for row in rows.mappings().all()]
    await profile_cache.set_profile_list(skip, limit, profile_payload)
    return profile_payload

@router.get("/me", response_model=ProfileRead)
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


@router.get("/{profile_id}", response_model=ProfileRead)
async def get_profile(
    profile_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a specific profile by its ID.
    Access is restricted to owners, admins, and employers.
    """
    cached_profile = await profile_cache.get_profile(profile_id)

    if current_user.role not in [UserRole.ADMIN, UserRole.EMPLOYER]:
        if cached_profile and getattr(cached_profile, "user_id", None) == current_user.id:
            return cached_profile

        user_profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
        if not user_profile:
            last_known_id = await profile_cache.get_last_known_profile_id(current_user.id)
            if last_known_id == profile_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=PROFILE_NOT_FOUND
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this profile"
            )
        if user_profile.id != profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this profile"
            )
        profile_read = ProfileRead.model_validate(user_profile)
        await profile_cache.set_profile(profile_read)
        return profile_read

    # Fetch the profile once at the beginning
    if cached_profile:
        return cached_profile

    profile = await profile_service.get_profile(db, id=profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )

    profile_read = ProfileRead.model_validate(profile)
    await profile_cache.set_profile(profile_read)
    return profile_read


@router.post("/", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Create a new profile for the current authenticated user.
    This endpoint replaces the one previously in users.py.
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
        profile_read = ProfileRead.model_validate(new_profile)
        await profile_cache.set_profile(profile_read)
        return profile_read
    except IntegrityError: # Should be rare now, but good as a safeguard.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the profile."
        )


@router.patch("/{profile_id}", response_model=ProfileRead)
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
            detail="Profile not found"
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
    if updated_profile:
        profile_read = ProfileRead.model_validate(updated_profile)
        await profile_cache.set_profile(profile_read)
        return profile_read
    await profile_cache.invalidate_profile(profile_id)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Profile not found"
    )


@router.post("/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Upload a profile avatar."""
    # Get user's profile first
    profile = await profile_service.get_profile_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    # Security validations
    validate_file_size(file)
    validate_file_extension(file.filename)
    await validate_file_content(file)

    # Prepare file path - in production this would be cloud storage
    # For now, store in a local uploads directory
    uploads_dir = Path("uploads/avatars")
    
    # Sanitize filename to prevent path traversal attacks
    if not file.filename or ".." in file.filename or "/" in file.filename or "\\" in file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    file_ext = Path(file.filename).suffix
    unique_filename = f"user_{current_user.id}_avatar{file_ext}"
    file_path = uploads_dir / unique_filename

    try:
        # Save the file
        await save_upload_file(file, file_path)

        # Update profile with avatar URL
        avatar_url = f"/avatars/{unique_filename}"  # URL path, not filesystem path
        profile.avatar_url = avatar_url
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        profile_read = ProfileRead.model_validate(profile)
        await profile_cache.set_profile(profile_read)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Avatar uploaded successfully",
                "avatar_url": avatar_url,
            },
        )
        
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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
            detail="Profile not found"
        )

    # Authorization check: Ensure the current user owns the profile
    if profile.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this profile"
        )

    try:
        await profile_service.delete_profile(db=db, profile=profile)
        await profile_cache.invalidate_profile(profile_id)
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        ) from e