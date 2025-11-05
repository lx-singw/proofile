from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.models.user import UserRole


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    role: Optional[UserRole] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.APPRENTICE


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None


# Properties to return to client
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True