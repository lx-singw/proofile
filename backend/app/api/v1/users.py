"""
API endpoints for user management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core import security
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    hashed_password = security.pwd_context.hash(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_password, full_name=user_in.full_name, role=user_in.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user