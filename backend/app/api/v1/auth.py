import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import deps
from app import schemas
from app.core import config, security
from app.core.auth import authenticate_user
from app.schemas.token import Token

router = APIRouter()
logger = logging.getLogger(__name__)


def _validate_csrf(request: Request) -> None:
    """
    Validate CSRF token if enabled.
    In test environment, CSRF validation is disabled for programmatic API testing.
    """
    if not config.settings.CSRF_ENABLED:
        # CSRF validation disabled in test environment
        return
    
    csrf_cookie = request.cookies.get(config.settings.CSRF_COOKIE_NAME)
    csrf_header = request.headers.get(config.settings.CSRF_HEADER_NAME)
    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")


async def _handle_failed_login(redis, email: str):
    """Handle failed login attempt tracking."""
    if not redis:
        return
    
    try:
        key = f"login_fail:{email}"
        count = await redis.incr(key)
        await redis.expire(key, config.settings.RATE_LIMIT_LOGIN_WINDOW)
        if count >= config.settings.RATE_LIMIT_LOGIN_REQUESTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts, try again later",
            )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Redis error while incrementing login failures for %s", email)


async def _create_tokens_and_cookies(user, response: Response):
    """Create access token and set authentication cookies."""
    # Create access token
    ttl_minutes = config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
    access_token_expires = timedelta(minutes=ttl_minutes)
    
    claims = {
        "sub": user.email,
        "role": user.role,
        "jti": str(user.id),
    }
    
    access_token = security.create_access_token(
        data=claims,
        expires_delta=access_token_expires,
        audience=config.settings.JWT_AUDIENCE
    )

    # Set cookies
    try:
        refresh_token = security.create_refresh_token(claims)
        csrf_token = secrets.token_urlsafe(32)
        
        secure_flag = bool(config.settings.COOKIE_SECURE)
        same_site = (config.settings.COOKIE_SAMESITE or "lax").lower()

        response.set_cookie(
            key=config.settings.REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            secure=secure_flag,
            samesite=same_site,
            path="/",
            max_age=config.settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        )

        response.set_cookie(
            key=config.settings.CSRF_COOKIE_NAME,
            value=csrf_token,
            httponly=False,
            secure=secure_flag,
            samesite=same_site,
            path="/",
            max_age=60 * 60 * 24,
        )
    except Exception:
        logger.exception("Failed setting refresh/CSRF cookies")
    
    return access_token


@router.post(
    "/token",
    response_model=Token,
    responses={401: {"description": "Incorrect email or password"}},
)
async def login_for_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(deps.get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    Expects form data with username (email) and password fields.
    """
    try:
        email = form_data.username.strip().lower()
        password = form_data.password

        if config.settings.ENVIRONMENT != "production":
            logger.debug("Login attempt email=%s password_len=%s", email, len(password or ""))

        # Get Redis connection
        redis = getattr(request.app.state, 'redis', None)

        # Authenticate user
        user = await authenticate_user(db, email=email, password=password)
        
        if not user:
            await _handle_failed_login(redis, email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create tokens and set cookies
        access_token = await _create_tokens_and_cookies(user, response)
        
        # Clear failed login counter on success
        if redis:
            try:
                await redis.delete(f"login_fail:{email}")
            except Exception:
                logger.exception("Redis error while clearing login failures for %s", email)
        
        logger.debug("Login successful for user: %s", email)
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Login failed for user '%s': %s", form_data.username, str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh")
async def refresh_access_token(request: Request, response: Response):
    """
    Hybrid refresh endpoint: expects a HttpOnly refresh cookie and a readable CSRF cookie/header.
    - Validates XSRF header matches cookie value (unless disabled in test environment).
    - Decodes refresh token cookie and issues a fresh access token (JSON).
    """
    try:
        _validate_csrf(request)

        refresh_token = request.cookies.get(config.settings.REFRESH_COOKIE_NAME)
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

        try:
            payload = security.decode_refresh_token(refresh_token)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from e

        # Build new access token
        try:
            ttl_minutes = config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
            access_token_expires = timedelta(minutes=ttl_minutes)
            claims = {
                "sub": payload.get("sub"),
                "role": payload.get("role"),
                "jti": payload.get("jti"),
            }
            access_token = security.create_access_token(
                data=claims,
                expires_delta=access_token_expires,
                audience=config.settings.JWT_AUDIENCE,
            )
        except Exception as e:
            logger.exception("Failed to create access token: %s", e)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Token creation failed") from e

        # Optionally rotate CSRF token for defense-in-depth
        try:
            new_csrf = secrets.token_urlsafe(32)
            secure_flag = bool(config.settings.COOKIE_SECURE)
            same_site = (config.settings.COOKIE_SAMESITE or "lax").lower()
            response.set_cookie(
                key=config.settings.CSRF_COOKIE_NAME,
                value=new_csrf,
                httponly=False,
                secure=secure_flag,
                samesite=same_site,  # type: ignore[arg-type]
                path="/",
                max_age=60 * 60 * 24,
            )
        except Exception:
            logger.exception("Failed rotating CSRF cookie")

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Refresh failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not refresh session")

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Clear authentication cookies and logout user."""
    # Validate CSRF token to prevent CSRF attacks (unless disabled in test environment)
    _validate_csrf(request)
    
    # Compute cookie settings once
    secure_flag = bool(config.settings.COOKIE_SECURE)
    same_site = (config.settings.COOKIE_SAMESITE or "lax").lower()
    
    # Clear refresh token cookie
    try:
        response.delete_cookie(
            key=config.settings.REFRESH_COOKIE_NAME,
            path="/",
            secure=secure_flag,
            samesite=same_site
        )
        # Clear CSRF cookie
        response.delete_cookie(
            key=config.settings.CSRF_COOKIE_NAME,
            path="/",
            secure=secure_flag,
            samesite=same_site
        )
    except Exception:
        logger.exception("Failed to clear authentication cookies")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=schemas.UserRead)
async def get_authenticated_user(current_user=Depends(deps.get_current_active_user)):
    """Return the authenticated user if the access token is valid.

    Frontend will attempt /api/v1/auth/me as a fallback; exposing this makes probing cheaper.
    """
    return current_user


@router.patch("/me", response_model=schemas.UserRead)
async def update_user_settings(
    payload: schemas.UserSettingsUpdate,
    current_user=Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db),
):
    """Update authenticated user's settings (email, full_name, password).
    
    Requires current password verification for security.
    """
    from sqlalchemy import select
    from app.models.user import User
    
    # Verify current password
    if not security.pwd_context.verify(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    
    # Update fields
    if payload.email and payload.email.lower() != current_user.email:
        # Check if new email already exists
        result = await db.execute(
            select(User).where(User.email == payload.email.lower()).where(User.id != current_user.id)
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = payload.email.lower()
    
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    
    if payload.new_password:
        current_user.hashed_password = security.pwd_context.hash(payload.new_password)
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user