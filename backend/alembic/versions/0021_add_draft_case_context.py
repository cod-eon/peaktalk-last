"""add draft case context

Revision ID: 0021_draft_case_context
Revises: 0020_guest_migration_state
Create Date: 2026-06-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0021_draft_case_context"
down_revision: Union[str, None] = "0020_guest_migration_state"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "speech_drafts",
        sa.Column("case_context", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("speech_drafts", "case_context")
