"""Add subscriptions, payments, and usage_counters tables.

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-28

Creates:
  - subscriptions     (one per user, tracks plan + billing period)
  - payments          (payment history from YooKassa)
  - usage_counters    (monthly counters: simulations, documents)

Backfill: every existing user receives a starter subscription and
an empty usage_counter so that limit checks work immediately after
the migration.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── ENUM types ────────────────────────────────────────────────────────────
    op.execute(
        "CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'team')"
    )
    op.execute(
        "CREATE TYPE subscription_status AS ENUM "
        "('active', 'cancelled', 'past_due', 'trialing')"
    )
    op.execute(
        "CREATE TYPE payment_status AS ENUM "
        "('pending', 'succeeded', 'failed', 'refunded')"
    )

    # ── subscriptions ─────────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "plan",
            sa.Enum("starter", "pro", "team", name="plan_type", create_type=False),
            nullable=False,
            server_default="starter",
        ),
        sa.Column(
            "status",
            sa.Enum(
                "active", "cancelled", "past_due", "trialing",
                name="subscription_status",
                create_type=False,
            ),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "period_start",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("yookassa_payment_method_id", sa.String(255), nullable=True),
        sa.Column("yookassa_subscription_id", sa.String(255), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_subscriptions_user_id"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])

    # ── payments ──────────────────────────────────────────────────────────────
    op.create_table(
        "payments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("subscription_id", sa.UUID(), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="RUB"),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "succeeded", "failed", "refunded",
                name="payment_status",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("yookassa_payment_id", sa.String(255), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["subscription_id"], ["subscriptions.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("yookassa_payment_id", name="uq_payments_yookassa_id"),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_subscription_id", "payments", ["subscription_id"])
    op.create_index(
        "ix_payments_yookassa_payment_id", "payments", ["yookassa_payment_id"], unique=True
    )

    # ── usage_counters ────────────────────────────────────────────────────────
    op.create_table(
        "usage_counters",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("simulations_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("documents_uploaded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "period_start",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_usage_counters_user_id"),
    )
    op.create_index("ix_usage_counters_user_id", "usage_counters", ["user_id"])

    # ── Backfill existing users ───────────────────────────────────────────────
    # Create a starter subscription for every user that does not yet have one.
    op.execute(
        """
        INSERT INTO subscriptions (id, user_id, plan, status, period_start, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            u.id,
            'starter',
            'active',
            now(),
            now(),
            now()
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
        )
        """
    )

    # Create a usage counter for every user that does not yet have one.
    op.execute(
        """
        INSERT INTO usage_counters (id, user_id, simulations_used, documents_uploaded, period_start, updated_at)
        SELECT
            gen_random_uuid(),
            u.id,
            0,
            0,
            now(),
            now()
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM usage_counters uc WHERE uc.user_id = u.id
        )
        """
    )


def downgrade() -> None:
    op.drop_index("ix_usage_counters_user_id", table_name="usage_counters")
    op.drop_table("usage_counters")

    op.drop_index("ix_payments_yookassa_payment_id", table_name="payments")
    op.drop_index("ix_payments_subscription_id", table_name="payments")
    op.drop_index("ix_payments_user_id", table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_table("subscriptions")

    op.execute("DROP TYPE IF EXISTS payment_status")
    op.execute("DROP TYPE IF EXISTS subscription_status")
    op.execute("DROP TYPE IF EXISTS plan_type")
