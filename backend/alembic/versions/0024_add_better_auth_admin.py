"""Add Better Auth Admin plugin fields and PeakTalk admin audit events.

Revision ID: 0024_better_auth_admin
Revises: 0023_better_auth_schema
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0024_better_auth_admin"
down_revision: Union[str, None] = "0023_better_auth_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user", sa.Column("role", sa.Text(), nullable=True, server_default="user"))
    op.add_column("user", sa.Column("banned", sa.Boolean(), nullable=True, server_default=sa.false()))
    op.add_column("user", sa.Column("banReason", sa.Text(), nullable=True))
    op.add_column("user", sa.Column("banExpires", sa.DateTime(timezone=True), nullable=True))
    op.alter_column("user", "role", nullable=False, server_default=None)
    op.alter_column("user", "banned", nullable=False, server_default=None)
    op.add_column("session", sa.Column("impersonatedBy", sa.Text(), nullable=True))

    op.create_table(
        "admin_audit_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.String(length=255), nullable=False),
        sa.Column("target_user_id", sa.String(length=255), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("outcome", sa.String(length=16), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_events_created_at", "admin_audit_events", ["created_at"])
    op.create_index("ix_admin_audit_events_target_user_id", "admin_audit_events", ["target_user_id"])


def downgrade() -> None:
    op.drop_index("ix_admin_audit_events_target_user_id", table_name="admin_audit_events")
    op.drop_index("ix_admin_audit_events_created_at", table_name="admin_audit_events")
    op.drop_table("admin_audit_events")
    op.drop_column("session", "impersonatedBy")
    op.drop_column("user", "banExpires")
    op.drop_column("user", "banReason")
    op.drop_column("user", "banned")
    op.drop_column("user", "role")
