"""
API Endpoints for Jobs.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import deps
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobRead
from app.services import job_service

router = APIRouter()

@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new job posting. Only accessible by users with the 'employer' role.
    """
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can post jobs.",
        )
    
    try:
        job = await job_service.create_job(db=db, job_in=job_in, employer_id=current_user.id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job posting"
        ) from e

@router.get("/", response_model=list[JobRead])
async def list_jobs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10,
):
    """
    List all available job postings.
    """
    jobs = await job_service.get_jobs(db, skip=skip, limit=limit)
    return jobs