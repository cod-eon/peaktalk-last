"""Update user_segment and user_goal enums for B2B ICP.

Revision ID: 0009
Revises: 0008
Create Date: 2026-04-09

Adds new values to user_segment (head, customer_facing) and
user_goal (budget_defense, qbr, stakeholder) enums.
Old values (student, junior, interview, conference, defense) are kept
for backward compatibility with existing rows.
"""
from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE user_segment ADD VALUE IF NOT EXISTS 'head'")
        op.execute("ALTER TYPE user_segment ADD VALUE IF NOT EXISTS 'customer_facing'")
        op.execute("ALTER TYPE user_goal ADD VALUE IF NOT EXISTS 'budget_defense'")
        op.execute("ALTER TYPE user_goal ADD VALUE IF NOT EXISTS 'qbr'")
        op.execute("ALTER TYPE user_goal ADD VALUE IF NOT EXISTS 'stakeholder'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    # To fully revert, recreate the enum without the new values — requires table rewrite.
    pass
