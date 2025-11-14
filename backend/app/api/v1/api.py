from fastapi import APIRouter
from app.api.v1 import users, auth, profiles, jobs, ws, ai, resumes
from app.core.config import settings
try:
	# import test_events lazily
	from app.api.v1 import test_events
except Exception:
	test_events = None

api_router = APIRouter(prefix="/api/v1") # Add prefix here for consistency

# Include your endpoint routers here
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])

# Test-only endpoints for e2e / local validation (only enabled in test or when explicitly allowed)
if settings.ENVIRONMENT == "test" or getattr(settings, "ENABLE_TEST_ROUTES", False):
	if test_events is not None:
		api_router.include_router(test_events.router, prefix="/test", tags=["test"])

# WebSocket router for worker notifications (connect to /api/v1/ws/{user_id})
api_router.include_router(ws.router, prefix="/ws", tags=["ws"])