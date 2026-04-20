"""Add session_artifacts table for post-session prep card artifacts.

Revision ID: 0015_session_artifacts
Revises: 0014_scenarios
Create Date: 2026-04-20

Changes:
  - Creates artifact_type enum (prep_card)
  - Creates session_artifacts table with FK to simulation_sessions
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0015_session_artifacts"
down_revision: Union[str, None] = "0014_scenarios"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create artifact_type enum
    artifact_type_enum = postgresql.ENUM("prep_card", name="artifact_type", create_type=False)
    bind = op.get_bind()
    exists = bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'artifact_type'")).scalar()
    if not exists:
        artifact_type_enum.create(bind)

    op.create_table(
        "session_artifacts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column(
            "artifact_type",
            artifact_type_enum,
            nullable=False,
            server_default="prep_card",
        ),
        sa.Column("content", JSONB(), nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["session_id"], ["simulation_sessions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_session_artifacts_session_id", "session_artifacts", ["session_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_session_artifacts_session_id", table_name="session_artifacts")
    op.drop_table("session_artifacts")
    op.execute("DROP TYPE IF EXISTS artifact_type")
