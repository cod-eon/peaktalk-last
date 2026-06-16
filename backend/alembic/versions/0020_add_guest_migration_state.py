"""add guest migration state

Revision ID: 0020_guest_migration_state
Revises: 0019_add_utm
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0020_guest_migration_state"
down_revision: Union[str, None] = "0019_add_utm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "guest_sessions",
        sa.Column("migrated_session_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "guest_sessions",
        sa.Column("migrated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_guest_sessions_migrated_session_id",
        "guest_sessions",
        ["migrated_session_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_guest_sessions_migrated_session_id",
        "guest_sessions",
        "simulation_sessions",
        ["migrated_session_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_guest_sessions_migrated_session_id",
        "guest_sessions",
        type_="foreignkey",
    )
    op.drop_index("ix_guest_sessions_migrated_session_id", table_name="guest_sessions")
    op.drop_column("guest_sessions", "migrated_at")
    op.drop_column("guest_sessions", "migrated_session_id")
