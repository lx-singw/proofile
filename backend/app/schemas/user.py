"""
Pydantic schemas for User model.

These schemas define the data shape for API requests and responses,
providing validation and serialization.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import UserRole

# --- Base Schema ---
# Shared properties for all user-related schemas.
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.APPRENTICE

# --- Create Schema ---
# Properties to receive via API on creation.
# Inherits from UserBase and adds the password.
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72)

# --- Read Schema ---
# Properties to return via API.
# This prevents sensitive data like hashed_password from being exposed.
class UserRead(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True # Replaces orm_mode = True in Pydantic v2

# --- Update Schema ---
# Properties to receive on update. All are optional.
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None