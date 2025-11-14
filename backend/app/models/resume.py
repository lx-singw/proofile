from __future__ import annotations
from sqlalchemy import Column, ForeignKey, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin

class Resume(Base, TimestampMixin):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    data = Column(JSONB, nullable=False, server_default='{}')

    # relationships
    # Use fully-qualified target to avoid import/mapper ordering issues
    user = relationship("app.models.user.User", back_populates="resumes")

