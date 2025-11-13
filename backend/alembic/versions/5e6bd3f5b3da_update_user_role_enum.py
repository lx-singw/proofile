"""Update user role enum values

Revision ID: 5e6bd3f5b3da
Revises: 1c2c5c93d0e7
Create Date: 2026-02-14 10:25:00.000000

"""
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "5e6bd3f5b3da"
down_revision = "1c2c5c93d0e7"
branch_labels = None
depends_on = None


NEW_ROLES = (
    "student",
    "graduate",
    "apprentice",
    "professional",
    "job_seeker",
    "career_changer",
    "remote_worker",
    "freelancer",
    "recruiter",
    "employer",
    "admin",
)

OLD_ROLES = (
    "APPRENTICE",
    "EMPLOYER",
    "ADMIN",
)


def upgrade() -> None:
    bind = op.get_bind()
    new_enum = postgresql.ENUM(*NEW_ROLES, name="userrole_new")
    new_enum.create(bind, checkfirst=False)

    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole_new
        USING COALESCE(LOWER(role::text), 'apprentice')::userrole_new
        """
    )

    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade() -> None:
    bind = op.get_bind()
    old_enum = postgresql.ENUM(*OLD_ROLES, name="userrole_old")
    old_enum.create(bind, checkfirst=False)

    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role TYPE userrole_old
        USING (
            CASE
                WHEN role::text = 'employer' THEN 'EMPLOYER'
                WHEN role::text = 'admin' THEN 'ADMIN'
                ELSE 'APPRENTICE'
            END
        )::userrole_old
        """
    )

    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_old RENAME TO userrole")
