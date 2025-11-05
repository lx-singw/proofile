from pydantic import BaseModel
from typing import Optional


# Pydantic model for creating a profile
class ProfileCreate(BaseModel):
    user_id: int
    headline: str
    summary: Optional[str] = None

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