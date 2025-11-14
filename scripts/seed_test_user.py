"""Seed a deterministic test user into the application's database.

Run this script inside the backend container (poetry run python scripts/seed_test_user.py)
It will create a user with email `e2e+test@example.com` and password `Passw0rd!` if one doesn't already exist.
"""
import asyncio
from app.core.database import AsyncSessionLocal
from app.services import user_service
from app.schemas.user import UserCreate


async def main():
    async with AsyncSessionLocal() as session:
        email = "e2e+test@example.com"
        password = "Passw0rd!"
        user_in = UserCreate(email=email, password=password, full_name="E2E Test User")
        existing = await user_service.get_user_by_email(session, email)
        if existing:
            print(f"User {email} already exists (id={existing.id})")
            return
        user = await user_service.create_user(session, user_in)
        print(f"Created user {user.email} with id={user.id}")


if __name__ == "__main__":
    asyncio.run(main())
