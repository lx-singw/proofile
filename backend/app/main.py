"""
The Main Application (backend/app/main.py)
This is the heart of the backend. It initializes the FastAPI application, includes our API router,
and adds a simple /health check endpoint so we can confirm everything is running.
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
import time
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize connections
    try:
        import redis.asyncio as redis
        app.state.redis = redis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    except Exception as e:
        print(f"Redis connection skipped: {e}")
        app.state.redis = None

    yield

    # Shutdown: Close connections
    if getattr(app.state, "redis", None):
        try:
            await app.state.redis.close()
        except Exception:
            pass

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        # Basic security headers (can be tightened for production)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=()")
        # Simple server-timing for visibility
        response.headers.setdefault("Server-Timing", f"app;dur={(time.time()-start)*1000:.1f}")
        return response

middleware = [
    Middleware(GZipMiddleware, minimum_size=1024),
]

# Conditionally add TrustedHost and Session if configured
if getattr(settings, "TRUSTED_HOSTS", None):
    middleware.append(Middleware(TrustedHostMiddleware, allowed_hosts=settings.TRUSTED_HOSTS))

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan, debug=getattr(settings, "DEBUG", False), middleware=middleware)

# CORS configuration
cors_origins = getattr(settings, "BACKEND_CORS_ORIGINS", []) or []
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=86400,
    )

# Add security headers
app.add_middleware(SecurityHeadersMiddleware)

# API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Standardized exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.get("/health", tags=["health"])  # Lightweight readiness/liveness probe
def health_check():
    """
    Simple health check endpoint to confirm the API is running.
    """
    return {"status": "ok", "project_name": settings.PROJECT_NAME}
