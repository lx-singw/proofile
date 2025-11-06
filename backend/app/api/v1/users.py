"""
API Endpoints for Users.
"""
from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.api.v1 import deps
from app.services import user_service

router = APIRouter()

@router.post("", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
):
    """
    Create a new user.
    """
    try:
        user = await user_service.create_user(db=db, user_in=user_in)
        return user
    except IntegrityError:
        # This will be caught if the email already exists due to the unique constraint.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )