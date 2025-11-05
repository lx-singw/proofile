from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.core.config import settings

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Use bcrypt_sha256 to prevent the 72-byte limitation
pwd_context = CryptContext(
    schemes=["bcrypt_sha256"],
    deprecated="auto"
)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str):
    """
    Decodes the access token.
    Raises JWTError on failure.
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    return payload
