import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services import profile_service
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.models.user import User
from app.schemas.user import UserCreate
from app.services import user_service

@pytest.mark.asyncio
async def test_create_profile(db_session: AsyncSession, test_user: User):
    profile_in = ProfileCreate(
        headline="Test Profile Headline",
        summary="This is a test profile summary."
    )
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    assert profile.headline == profile_in.headline
    assert profile.summary == profile_in.summary
    assert profile.user_id == test_user.id


@pytest.mark.asyncio
async def test_get_profile(db_session: AsyncSession, test_user: User):
    profile_in = ProfileCreate(
        headline="Test Profile Headline",
        summary="This is a test profile summary.",
    )
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    retrieved_profile = await profile_service.get_profile(db_session, profile.id)
    assert retrieved_profile
    assert retrieved_profile.id == profile.id


@pytest.mark.asyncio
async def test_get_profile_by_user_id(db_session: AsyncSession, test_user: User):
    profile_in = ProfileCreate(
        headline="Test Profile Headline",
        summary="This is a test profile summary."
    )
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    retrieved_profile = await profile_service.get_profile_by_user_id(db_session, test_user.id)
    assert retrieved_profile
    assert retrieved_profile.user_id == test_user.id


@pytest.mark.asyncio
async def test_get_profiles(db_session: AsyncSession, test_user: User):
    profile_in_1 = ProfileCreate(
        headline="Test Profile Headline 1",
        summary="This is test profile summary 1."
    )
    profile_in_2 = ProfileCreate(
        headline="Test Profile Headline 2",
        summary="This is test profile summary 2.",
    )
    # Create a second user for the second profile
    user_in = UserCreate(email="test2@example.com", password="TestPass123!")
    user = await user_service.create_user(db_session, user_in)
    await profile_service.create_profile(db_session, profile_in_1, test_user.id)
    await profile_service.create_profile(db_session, profile_in_2, user.id)
    profiles = await profile_service.get_profiles(db_session)
    assert len(profiles) == 2


@pytest.mark.asyncio
async def test_update_profile(db_session: AsyncSession, test_user: User):
    profile_in = ProfileCreate(
        headline="Original Headline",
        summary="Original Summary"
    )
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    profile_update = ProfileUpdate(headline="Updated Headline")
    updated_profile = await profile_service.update_profile(db_session, profile, profile_update)
    assert updated_profile.headline == "Updated Headline"


@pytest.mark.asyncio
async def test_delete_profile(db_session: AsyncSession, test_user: User):
    profile_in = ProfileCreate(
        headline="Test Profile Headline",
        summary="This is a test profile summary."
    )
    profile = await profile_service.create_profile(db_session, profile_in, test_user.id)
    await profile_service.delete_profile(db_session, profile)
    deleted_profile = await profile_service.get_profile(db_session, profile.id)
    assert deleted_profile is None
