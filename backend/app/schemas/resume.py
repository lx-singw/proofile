from __future__ import annotations
from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import Any, Optional, List
from datetime import datetime
from uuid import UUID

class ResumeBase(BaseModel):
    name: str

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Any] = None

class ResumeRead(ResumeBase):
    id: UUID
    user_id: int
    data: Any = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ResumeListItem(BaseModel):
    id: UUID
    name: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
