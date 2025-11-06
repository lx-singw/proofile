"""
The Main Application (backend/app/main.py)
This is the heart of the backend. It initializes the FastAPI application, includes our API router,
and adds a simple /health check endpoint so we can confirm everything is running.
"""
import logging
import os
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
from urllib.parse import urlparse
from contextlib import asynccontextmanager
from app.core import config, database
from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize connections
    logger.info("--- Application Startup ---")
    # Log environment and a redacted DB URL to verify config
    logger.info(f"Environment: {config.settings.ENVIRONMENT}")
    if config.settings.DATABASE_URL:
        parsed_url = urlparse(config.settings.DATABASE_URL)
        safe_url = parsed_url._replace(netloc=f"****:****@{parsed_url.hostname}:{parsed_url.port}").geturl()
        logger.info(f"Database URL: {safe_url}")
    else:
        logger.error("DATABASE_URL is not set!")
    try:
        import redis.asyncio as redis
        app.state.redis = redis.from_url(config.settings.REDIS_URL, encoding="utf8", decode_responses=True)
        logger.info("Redis connection established.")
    except Exception as e:
        logger.warning(f"Redis connection skipped: {e}")
        app.state.redis = None

    yield

    # Shutdown: Close connections
    if getattr(app.state, "redis", None):
        try:
            await app.state.redis.close()
            logger.info("Redis connection closed.")
        except Exception:
            pass
    await database.dispose_engine()

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
if getattr(config.settings, "TRUSTED_HOSTS", None):
    middleware.append(Middleware(TrustedHostMiddleware, allowed_hosts=config.settings.TRUSTED_HOSTS))

app = FastAPI(title=config.settings.PROJECT_NAME, lifespan=lifespan, debug=getattr(config.settings, "DEBUG", False), middleware=middleware)

# CORS configuration
cors_origins = getattr(config.settings, "BACKEND_CORS_ORIGINS", []) or []
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
app.include_router(api_router, prefix=config.settings.API_V1_STR)

# Standardized exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.exception(f"HTTPException caught: {exc.status_code} {exc.detail}", exc_info=exc)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.exception("RequestValidationError caught", exc_info=exc)
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.get("/health", tags=["health"])  # Lightweight readiness/liveness probe
def health_check():
    """
    Simple health check endpoint to confirm the API is running.
    """
    return {"status": "ok", "project_name": config.settings.PROJECT_NAME}
