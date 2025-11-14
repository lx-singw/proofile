from __future__ import annotations
from pydantic import BaseModel
from pydantic import ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ResumeTemplateRead(BaseModel):
    id: UUID
    name: str
    preview_image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
