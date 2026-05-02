"""add utm columns to users

Revision ID: 0019_add_utm
Revises: 603c38a86660
Create Date: 2026-05-02
"""

from alembic import op
import sqlalchemy as sa

revision = "0019_add_utm"
down_revision = "603c38a86660"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("utm_source", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("utm_medium", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("utm_campaign", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("utm_content", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("utm_term", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "utm_term")
    op.drop_column("users", "utm_content")
    op.drop_column("users", "utm_campaign")
    op.drop_column("users", "utm_medium")
    op.drop_column("users", "utm_source")
