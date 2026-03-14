"""create users and onboarding_profiles tables

Revision ID: 0001
Revises:
Create Date: 2026-03-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "onboarding_profiles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "segment",
            sa.Enum(
                "student", "junior", "founder", "manager", "other",
                name="user_segment",
            ),
            nullable=False,
        ),
        sa.Column(
            "primary_goal",
            sa.Enum(
                "interview", "pitch", "conference", "defense", "other",
                name="user_goal",
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("onboarding_profiles")
    op.execute("DROP TYPE IF EXISTS user_goal")
    op.execute("DROP TYPE IF EXISTS user_segment")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
