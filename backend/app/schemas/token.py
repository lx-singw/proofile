"""
Pydantic schemas for tokens.
"""
from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = Field(None, alias="sub")
    issuer: Optional[str] = Field(None, alias="iss")
    audience: Optional[str] = Field(None, alias="aud")