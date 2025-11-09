import logging
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
        # Strip and lowercase email for consistent comparison
        email = form_data.username.strip().lower()
        password = form_data.password

        # Authenticate user
        user = await authenticate_user(db, email=email, password=password)
        # Access Redis (if available) to track failed login attempts
        redis = None
        try:
            redis = request.app.state.redis
        except Exception:
            redis = None

        if not user:
            # Increment failed login counter keyed by email to implement
            # account-level lockout / throttling separate from global rate-limiting.
            if redis:
                try:
                    key = f"login_fail:{email}"
                    count = await redis.incr(key)
                    # Set expiry window for the counter
                    await redis.expire(key, config.settings.RATE_LIMIT_LOGIN_WINDOW)
                    # If threshold exceeded, return 429 Too Many Requests
                    if count >= config.settings.RATE_LIMIT_LOGIN_REQUESTS:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail="Too many login attempts, try again later",
                        )
                except HTTPException:
                    raise
                except Exception:
                    # Don't let Redis errors break authentication flow
                    logger.exception("Redis error while incrementing login failures for %s", email)

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

        # Create access token with standard claims
        ttl_minutes = config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
        access_token_expires = timedelta(minutes=ttl_minutes)
        
        claims = {
            "sub": user.email,
            "role": user.role,
            "jti": str(user.id),  # JWT ID for tracking tokens
        }
        
        access_token = security.create_access_token(
            data=claims,
            expires_delta=access_token_expires,
            audience=config.settings.JWT_AUDIENCE
        )

        response_data = {
            "access_token": access_token,
            "token_type": "bearer"
        }

        # Issue refresh token cookie (HttpOnly) and a readable CSRF cookie
        try:
            refresh_claims = {
                "sub": user.email,
                "role": user.role,
                "jti": str(user.id),
            }
            refresh_token = security.create_refresh_token(refresh_claims)

            # CSRF token should be readable by JS to mirror as header via axios
            import secrets
            csrf_token = secrets.token_urlsafe(32)

            secure_flag = bool(config.settings.COOKIE_SECURE)
            same_site = (config.settings.COOKIE_SAMESITE or "lax").lower()

            # Set refresh cookie (HttpOnly)
            response.set_cookie(
                key=config.settings.REFRESH_COOKIE_NAME,
                value=refresh_token,
                httponly=True,
                secure=secure_flag,
                samesite=same_site,  # type: ignore[arg-type]
                path="/",
                max_age=config.settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
            )

            # Set CSRF cookie (not HttpOnly)
            response.set_cookie(
                key=config.settings.CSRF_COOKIE_NAME,
                value=csrf_token,
                httponly=False,
                secure=secure_flag,
                samesite=same_site,  # type: ignore[arg-type]
                path="/",
                max_age=60 * 60 * 24,  # 1 day
            )
        except Exception:
            logger.exception("Failed setting refresh/CSRF cookies")
        
        # Successful logins are useful but can be noisy; use DEBUG so operators
        # can enable them when needed without cluttering test output.
        logger.debug("Login successful for user: %s", email)
        # On successful login, clear any failed-attempts counter
        if redis:
            try:
                await redis.delete(f"login_fail:{email}")
            except Exception:
                logger.exception("Redis error while clearing login failures for %s", email)
        return response_data

    except HTTPException: # Re-raise FastAPI HTTPExceptions directly
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
    - Validates XSRF header matches cookie value.
    - Decodes refresh token cookie and issues a fresh access token (JSON).
    """
    try:
        csrf_cookie = request.cookies.get(config.settings.CSRF_COOKIE_NAME)
        csrf_header = request.headers.get(config.settings.CSRF_HEADER_NAME)
        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")

        refresh_token = request.cookies.get(config.settings.REFRESH_COOKIE_NAME)
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

        try:
            payload = security.decode_refresh_token(refresh_token)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from e

        # Build new access token
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

        # Optionally rotate CSRF token for defense-in-depth
        try:
            import secrets
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
async def logout(response: Response):
    """Clear authentication cookies and logout user."""
    # Clear refresh token cookie
    response.delete_cookie(
        key=config.settings.REFRESH_COOKIE_NAME,
        path="/",
        secure=bool(config.settings.COOKIE_SECURE),
        samesite=(config.settings.COOKIE_SAMESITE or "lax").lower()
    )
    # Clear CSRF cookie
    response.delete_cookie(
        key=config.settings.CSRF_COOKIE_NAME,
        path="/",
        secure=bool(config.settings.COOKIE_SECURE),
        samesite=(config.settings.COOKIE_SAMESITE or "lax").lower()
    )
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=schemas.UserRead)
async def get_authenticated_user(current_user=Depends(deps.get_current_active_user)):
    """Return the authenticated user if the access token is valid.

    Frontend will attempt /api/v1/auth/me as a fallback; exposing this makes probing cheaper.
    """
    return current_user