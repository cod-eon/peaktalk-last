"""Widen guest_sessions.session_token for opaque token_urlsafe(32) values.

Revision ID: 0025_guest_session_token_widen
Revises: 0024_better_auth_admin
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0025_guest_session_token_widen"
down_revision: Union[str, None] = "0024_better_auth_admin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "guest_sessions",
        "session_token",
        existing_type=sa.String(length=36),
        type_=sa.String(length=64),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "guest_sessions",
        "session_token",
        existing_type=sa.String(length=64),
        type_=sa.String(length=36),
        existing_nullable=False,
    )
