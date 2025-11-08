"""
Service layer for job-related operations.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.job import Job
from app.schemas.job import JobCreate


async def create_job(db: AsyncSession, job_in: JobCreate, employer_id: int) -> Job:
    """
    Create a new job posting.
    """
    new_job = Job(**job_in.model_dump(), employer_id=employer_id)
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return new_job


async def get_jobs(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Job]:
    """
    Retrieve job postings with pagination.
    """
    result = await db.execute(select(Job).offset(skip).limit(limit).order_by(Job.created_at.desc()))
    return list(result.scalars().all())