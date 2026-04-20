"""add scenarios table

Revision ID: 0014_scenarios
Revises: 0013_session_credits
Create Date: 2026-04-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision: str = "0014_scenarios"
down_revision: Union[str, None] = "0013_session_credits"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    category_enum = sa.Enum(
        "budget", "roadmap", "investors", "clients", "people", "crisis",
        name="scenario_category"
    )
    category_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "scenarios",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("category", category_enum, nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("subtitle", sa.String(512), nullable=False),
        sa.Column("situation", sa.Text(), nullable=False),
        sa.Column("simulation_context", sa.Text(), nullable=False),
        sa.Column("recommended_persona", sa.String(64), nullable=False),
        sa.Column("recommended_difficulty", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("tags", ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scenarios_slug", "scenarios", ["slug"], unique=True)
    op.create_index("ix_scenarios_category", "scenarios", ["category"])
    op.create_index("ix_scenarios_is_active", "scenarios", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_scenarios_is_active", table_name="scenarios")
    op.drop_index("ix_scenarios_category", table_name="scenarios")
    op.drop_index("ix_scenarios_slug", table_name="scenarios")
    op.drop_table("scenarios")
    op.execute("DROP TYPE IF EXISTS scenario_category")
