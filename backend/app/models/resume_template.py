from __future__ import annotations
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base, TimestampMixin

class ResumeTemplate(Base, TimestampMixin):
    __tablename__ = "resume_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    preview_image_url = Column(String(1024), nullable=True)
    html_template_body = Column(Text, nullable=False)
