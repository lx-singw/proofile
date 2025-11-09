from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLAlchemyEnum, event
from sqlalchemy.orm import relationship, Mapped
from typing import Dict, Tuple
from .base import Base, TimestampMixin
import enum

class UserRole(str, enum.Enum):
    APPRENTICE = "apprentice"
    EMPLOYER = "employer"
    ADMIN = "admin"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.APPRENTICE)
    is_active = Column(Boolean, default=True)

    # Relationship to Profile
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Relationship to Jobs
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="employer", cascade="all, delete-orphan")


# Track latest status changes (id, updated_at, is_active) keyed by email
USER_STATUS_CACHE: Dict[str, Tuple[int, datetime, bool]] = {}


@event.listens_for(User, "after_insert")
def _user_after_insert(mapper, connection, target: User) -> None:
    USER_STATUS_CACHE[target.email.lower()] = (
        target.id,
        target.updated_at or datetime.utcnow(),
        target.is_active,
    )


@event.listens_for(User, "after_update")
def _user_after_update(mapper, connection, target: User) -> None:
    USER_STATUS_CACHE[target.email.lower()] = (
        target.id,
        target.updated_at or datetime.utcnow(),
        target.is_active,
    )
