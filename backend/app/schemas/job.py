"""
Pydantic schemas for Job objects.
"""
from pydantic import BaseModel, ConfigDict

# --- Base Schema ---
class JobBase(BaseModel):
    """Shared attributes for a job."""
    title: str
    description: str
    company_name: str
    location: str | None = None

# --- Schemas for API Operations ---
class JobCreate(JobBase):
    """Schema for creating a new job."""
    pass

class JobUpdate(JobBase):
    """Schema for updating an existing job. All fields are optional."""
    title: str | None = None
    description: str | None = None
    company_name: str | None = None

class JobRead(JobBase):
    """Schema for reading a job from the API."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    employer_id: int