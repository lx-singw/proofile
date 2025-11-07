import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_db
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
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
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