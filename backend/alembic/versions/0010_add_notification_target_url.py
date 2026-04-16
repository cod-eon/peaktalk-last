"""add_notification_target_url

Revision ID: 0010
Revises: 976ed5ce6806
Create Date: 2026-04-14 13:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0010"
down_revision: Union[str, None] = "976ed5ce6806"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notifications", sa.Column("target_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("notifications", "target_url")
