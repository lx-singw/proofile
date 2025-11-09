"""Pydantic schemas for Profile objects.

Includes validation for headline and summary so API input is rejected
when values are empty or exceed allowed lengths. This keeps behaviour
consistent with the tests which expect 422 responses for invalid input.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
import re


# Regex to detect HTML tags. This is a simple check which is sufficient for
# rejecting HTML in plain-text profile fields. We intentionally keep this
# conservative: if any tag-like construct is present, the input is rejected.
HTML_TAG_REGEX = re.compile(r"<[^>]+>")


def contains_html(text: str) -> bool:
    """Return True if the string contains HTML-like tags."""
    return bool(HTML_TAG_REGEX.search(text))


# --- Base Schema ---
class ProfileBase(BaseModel):
    """Shared attributes for a profile."""
    headline: Optional[str] = None
    summary: Optional[str] = None


# --- Schemas for API Operations ---
class ProfileCreate(ProfileBase):
    """Schema for creating a new profile.

    Enforces:
    - headline: required, non-empty (after strip), max 100 chars
    - summary: required, max 500 chars
    """
    headline: str
    summary: str

    @field_validator("headline", mode="before")
    def validate_headline(cls, v):
        if v is None:
            raise ValueError("headline is required")
        if not isinstance(v, str):
            raise TypeError("headline must be a string")
        v = v.strip()
        if len(v) == 0:
            raise ValueError("headline must not be empty")
        if len(v) > 100:
            raise ValueError("headline must be at most 100 characters")
        if contains_html(v):
            raise ValueError("headline must not contain HTML")
        return v

    @field_validator("summary", mode="before")
    def validate_summary(cls, v):
        if v is None:
            raise ValueError("summary is required")
        if not isinstance(v, str):
            raise TypeError("summary must be a string")
        v = v.strip()
        if len(v) > 500:
            raise ValueError("summary must be at most 500 characters")
        if contains_html(v):
            raise ValueError("summary must not contain HTML")
        return v


class ProfileUpdate(ProfileBase):
    """Schema for updating an existing profile. All fields are optional."""

    @field_validator("headline", mode="before")
    def validate_headline_optional(cls, v):
        # allow None (meaning field not provided)
        if v is None:
            return None
        if not isinstance(v, str):
            raise TypeError("headline must be a string")
        v = v.strip()
        if len(v) == 0:
            raise ValueError("headline must not be empty")
        if len(v) > 100:
            raise ValueError("headline must be at most 100 characters")
        if contains_html(v):
            raise ValueError("headline must not contain HTML")
        return v

    @field_validator("summary", mode="before")
    def validate_summary_optional(cls, v):
        if v is None:
            return None
        if not isinstance(v, str):
            raise TypeError("summary must be a string")
        v = v.strip()
        if len(v) > 500:
            raise ValueError("summary must be at most 500 characters")
        if contains_html(v):
            raise ValueError("summary must not contain HTML")
        return v


class ProfileRead(ProfileBase):
    """Schema for reading a profile from the API."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    avatar_url: Optional[str] = None


class ProfileResponse(ProfileRead):
    """Schema for API responses containing profile information."""
    avatar: Optional[str] = None