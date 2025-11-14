from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLAlchemyEnum, event
from sqlalchemy.orm import relationship, Mapped
from typing import Dict, Tuple
from .base import Base, TimestampMixin
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    GRADUATE = "graduate"
    APPRENTICE = "apprentice"
    PROFESSIONAL = "professional"
    JOB_SEEKER = "job_seeker"
    CAREER_CHANGER = "career_changer"
    REMOTE_WORKER = "remote_worker"
    FREELANCER = "freelancer"
    RECRUITER = "recruiter"
    EMPLOYER = "employer"
    ADMIN = "admin"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    role = Column(
        SQLAlchemyEnum(
            UserRole,
            name="userrole",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            validate_strings=True,
        ),
        nullable=False,
        default=UserRole.APPRENTICE,
    )
    is_active = Column(Boolean, default=True)

    # Relationship to Profile
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Relationship to Jobs
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="employer", cascade="all, delete-orphan")
    # Relationship to Resumes
    # Use fully-qualified target to avoid import/mapper ordering issues
    resumes: Mapped[list["app.models.resume.Resume"]] = relationship("app.models.resume.Resume", back_populates="user", cascade="all, delete-orphan")


# Track latest status changes (id, updated_at, is_active) keyed by email
USER_STATUS_CACHE: Dict[str, Tuple[int, datetime, bool]] = {}


@event.listens_for(User, "after_insert")
def _user_after_insert(mapper, connection, target: User) -> None:
    try:
        if target.email:
            USER_STATUS_CACHE[target.email.lower()] = (
                target.id,
                target.updated_at or datetime.utcnow(),
                target.is_active,
            )
    except (AttributeError, TypeError) as e:
        # Log but don't fail the transaction if cache update fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to update user status cache on insert: {e}")


@event.listens_for(User, "after_update")
def _user_after_update(mapper, connection, target: User) -> None:
    try:
        if target.email:
            USER_STATUS_CACHE[target.email.lower()] = (
                target.id,
                target.updated_at or datetime.utcnow(),
                target.is_active,
            )
    except (AttributeError, TypeError) as e:
        # Log but don't fail the transaction if cache update fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to update user status cache on update: {e}")


# Ensure related models are imported so SQLAlchemy can locate them when
# configuring mappers in different import orders (prevents mapper lookup errors).
try:
    import app.models.resume  # noqa: F401
except Exception:
    pass
