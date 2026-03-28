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
    # ── ENUM types (idempotent) ───────────────────────────────────────────────
    # Using PL/pgSQL exception handling because PostgreSQL has no
    # "CREATE TYPE IF NOT EXISTS" syntax.
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'team');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE subscription_status AS ENUM
                ('active', 'cancelled', 'past_due', 'trialing');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE payment_status AS ENUM
                ('pending', 'succeeded', 'failed', 'refunded');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # ── subscriptions ─────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id                          UUID NOT NULL DEFAULT gen_random_uuid(),
            user_id                     UUID NOT NULL,
            plan                        plan_type NOT NULL DEFAULT 'starter',
            status                      subscription_status NOT NULL DEFAULT 'active',
            period_start                TIMESTAMPTZ NOT NULL DEFAULT now(),
            period_end                  TIMESTAMPTZ,
            yookassa_payment_method_id  VARCHAR(255),
            yookassa_subscription_id    VARCHAR(255),
            cancelled_at                TIMESTAMPTZ,
            created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT pk_subscriptions PRIMARY KEY (id),
            CONSTRAINT uq_subscriptions_user_id UNIQUE (user_id),
            CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id)
                REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id
            ON subscriptions (user_id)
    """)

    # ── payments ──────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id                   UUID NOT NULL DEFAULT gen_random_uuid(),
            user_id              UUID NOT NULL,
            subscription_id      UUID,
            amount               NUMERIC(10, 2) NOT NULL,
            currency             VARCHAR(3) NOT NULL DEFAULT 'RUB',
            status               payment_status NOT NULL DEFAULT 'pending',
            yookassa_payment_id  VARCHAR(255) NOT NULL,
            description          VARCHAR(512),
            created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT pk_payments PRIMARY KEY (id),
            CONSTRAINT uq_payments_yookassa_id UNIQUE (yookassa_payment_id),
            CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id)
                REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_payments_subscription_id FOREIGN KEY (subscription_id)
                REFERENCES subscriptions(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_payments_subscription_id ON payments (subscription_id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_payments_yookassa_payment_id ON payments (yookassa_payment_id)")

    # ── usage_counters ────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS usage_counters (
            id                   UUID NOT NULL DEFAULT gen_random_uuid(),
            user_id              UUID NOT NULL,
            simulations_used     INTEGER NOT NULL DEFAULT 0,
            documents_uploaded   INTEGER NOT NULL DEFAULT 0,
            period_start         TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT pk_usage_counters PRIMARY KEY (id),
            CONSTRAINT uq_usage_counters_user_id UNIQUE (user_id),
            CONSTRAINT fk_usage_counters_user_id FOREIGN KEY (user_id)
                REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_usage_counters_user_id ON usage_counters (user_id)")

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
