"""add guest_sessions table

Revision ID: 0012_guest_sessions
Revises: 0011
Create Date: 2026-04-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON

revision: str = "0012_guest_sessions"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "guest_sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("session_token", sa.String(length=36), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("persona", sa.String(length=64), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("messages", JSON(), nullable=False, server_default="[]"),
        sa.Column("turn_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_guest_sessions_session_token", "guest_sessions", ["session_token"], unique=True
    )
    op.create_index(
        "ix_guest_sessions_expires_at", "guest_sessions", ["expires_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_guest_sessions_expires_at", table_name="guest_sessions")
    op.drop_index("ix_guest_sessions_session_token", table_name="guest_sessions")
    op.drop_table("guest_sessions")
