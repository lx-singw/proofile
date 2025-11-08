"""
Security-related utilities, including password hashing and JWT token creation.
"""
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel, field_validator, ValidationError
from app.core.config import settings
import re

class PasswordValidator(BaseModel):
    password: str

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        errors = []
        # Length checks first
        if len(v) < settings.PASSWORD_MIN_LENGTH:
            errors.append(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
        if len(v) > settings.PASSWORD_MAX_LENGTH:
            errors.append(f"Password must be less than {settings.PASSWORD_MAX_LENGTH} characters long")

        # Check password complexity individually to match test expectations
        if settings.PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in v):
            errors.append("Password must include uppercase letters")
        if settings.PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in v):
            errors.append("Password must include lowercase letters")
        if settings.PASSWORD_REQUIRE_NUMBERS and not any(c.isdigit() for c in v):
            errors.append("Password must include numbers")
        if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("Password must include special characters")
        
        if errors:
            raise ValueError(", ".join(errors))

        return v

# Use bcrypt for password hashing with stronger settings
pwd_context = CryptContext(
    schemes=["bcrypt"],
    default="bcrypt",
    bcrypt__rounds=12,  # 12 rounds is secure while still being reasonably fast
    deprecated="auto"
)

def validate_password_strength(password: str) -> None:
    """Validate password strength with proper error handling."""
    try:
        PasswordValidator(password=password)
    except ValidationError as e:
        raise ValueError(e.errors()[0]["msg"])

ALGORITHM = "HS256"
REFRESH_AUDIENCE = "proofile:refresh"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain-text password."""
    return pwd_context.hash(password)

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
    audience: str | None = None
):
    """Creates a new JWT access token with standard claims."""
    now = datetime.now(tz=timezone.utc)
    to_encode = data.copy()
    
    # Set standard claims
    to_encode.update({
        "iss": settings.PROJECT_NAME,  # Issuer
        "iat": now,  # Issued at
        "nbf": now,  # Not valid before
        "aud": audience or settings.JWT_AUDIENCE,  # Audience
        "exp": now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))  # Expiry
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str, audience: str | None = None) -> dict:
    """Decodes a JWT access token."""
    try:
        decode_options = {
            "verify_signature": True,
            "verify_aud": True,
            "verify_iss": True,
            "verify_exp": True,
            "require_exp": True,
            "require_aud": True,
            "require_iss": True,
        }
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            audience=audience or settings.JWT_AUDIENCE,
            issuer=settings.PROJECT_NAME,
            options=decode_options,
        )
        # Re-validate critical claims explicitly
        if "sub" not in payload:
            raise JWTError("Token is missing subject claim")
        if "exp" not in payload:
            raise JWTError("Token is missing expiry time")
        return payload
    except JWTError as e:
        raise JWTError(f"Token validation failed: {str(e)}")

def create_refresh_token(
    data: dict,
    expires_delta: timedelta | None = None,
):
    """Creates a refresh token JWT with separate audience and longer expiry."""
    now = datetime.now(tz=timezone.utc)
    to_encode = data.copy()
    to_encode.update({
        "iss": settings.PROJECT_NAME,
        "iat": now,
        "nbf": now,
        "aud": REFRESH_AUDIENCE,
        "exp": now + (expires_delta or timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES))
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_refresh_token(token: str) -> dict:
    """Decodes a refresh token, verifying refresh audience and issuer."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            audience=REFRESH_AUDIENCE,
            issuer=settings.PROJECT_NAME,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
                "require_exp": True,
                "require_aud": True,
                "require_iss": True,
            },
        )
        if "sub" not in payload:
            raise JWTError("Refresh token missing subject")
        return payload
    except JWTError as e:
        raise JWTError(f"Refresh token validation failed: {str(e)}")