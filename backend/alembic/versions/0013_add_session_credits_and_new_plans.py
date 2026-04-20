"""Add session_credits to usage_counters and extend plan_type enum.

Revision ID: 0013_session_credits
Revises: 0012_guest_sessions
Create Date: 2026-04-20

Changes:
  - Adds session_credits INTEGER NOT NULL DEFAULT 0 to usage_counters
  - Extends plan_type enum with: free, per_session, personal
    (keeps existing starter, pro, team values intact)
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013_session_credits"
down_revision: Union[str, None] = "0012_guest_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Extend plan_type enum with new values ────────────────────────────────
    # PostgreSQL requires renaming the old type, creating the new one, then
    # migrating columns.  The simplest safe approach for an append-only change
    # is ALTER TYPE … ADD VALUE (available since PG 9.1), which is
    # non-transactional but safe here because we are only adding values.
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'free';
        EXCEPTION WHEN others THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'per_session';
        EXCEPTION WHEN others THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'personal';
        EXCEPTION WHEN others THEN null;
        END $$;
    """)

    # ── Add session_credits column to usage_counters ─────────────────────────
    op.execute("""
        ALTER TABLE usage_counters
        ADD COLUMN IF NOT EXISTS session_credits INTEGER NOT NULL DEFAULT 0
    """)


def downgrade() -> None:
    # Remove session_credits column
    op.execute("""
        ALTER TABLE usage_counters DROP COLUMN IF EXISTS session_credits
    """)

    # Note: PostgreSQL does not support removing enum values directly.
    # To fully revert the enum, a full type replacement would be required.
    # For a safe downgrade we leave the enum values in place since they are
    # additive and harmless when not referenced by any row.
