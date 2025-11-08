from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    headline = Column(String(255))
    summary = Column(Text)
    avatar_url = Column(String(255), nullable=True)

    # This creates a back-reference so you can access the user from a profile object
    # and the profile from a user object.
    user = relationship("User", back_populates="profile")