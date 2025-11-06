from pydantic import BaseModel
from typing import Optional

from pydantic import Field


# Pydantic model for creating a profile
class ProfileCreate(BaseModel):
    headline: str = Field(..., max_length=100)
    summary: str = Field(..., max_length=500)

# Pydantic model for updating a profile
class ProfileUpdate(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None


# Pydantic model for data validation and response serialization
class ProfileResponse(BaseModel):
    id: int
    user_id: int
    headline: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True  # Used to be orm_mode = True