from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship, Mapped
from .base import Base, TimestampMixin

class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    company_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Relationship to User
    employer: Mapped["User"] = relationship("User", back_populates="jobs")