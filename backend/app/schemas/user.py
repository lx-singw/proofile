"""
Pydantic schemas for User model.

These schemas define the data shape for API requests and responses,
providing validation and serialization.
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole
from app.core.security import validate_password_strength

# --- Base Schema ---
# Shared properties for all user-related schemas.
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.APPRENTICE

# --- Create Schema ---
# Properties to receive via API on creation.
class UserCreate(UserBase):
    password: str = Field(..., description="Password must meet complexity requirements")

    @field_validator("password")
    def validate_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v

    @field_validator("email")
    def normalize_email(cls, v: str) -> str:
        return v.lower()

# --- Read Schema ---
# Properties to return via API.
# This prevents sensitive data like hashed_password from being exposed.
class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Update Schema ---
# Properties to receive on update. All are optional.
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, max_length=72) # Add validation
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None