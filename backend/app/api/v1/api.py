from fastapi import APIRouter
from app.api.v1 import users, auth, profiles, jobs

api_router = APIRouter(prefix="/api/v1") # Add prefix here for consistency

# Include your endpoint routers here
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])