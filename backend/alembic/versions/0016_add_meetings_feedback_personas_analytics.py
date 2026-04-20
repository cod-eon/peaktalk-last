"""Add upcoming_meetings, post_meeting_feedback, personalized_personas, scenario_analytics.

Revision ID: 0016_roadmap_features
Revises: 0015_session_artifacts
Create Date: 2026-04-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0016_roadmap_features"
down_revision: Union[str, None] = "0015_session_artifacts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── meeting_status enum ──
    meeting_status_enum = postgresql.ENUM("upcoming", "prepared", "completed", "cancelled", name="meeting_status", create_type=False)
    bind = op.get_bind()
    if not bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'meeting_status'")).scalar():
        meeting_status_enum.create(bind)

    # ── upcoming_meetings ──
    op.create_table(
        "upcoming_meetings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("meeting_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("meeting_type", sa.String(64), nullable=False, server_default="other"),
        sa.Column("scenario_id", sa.UUID(), nullable=True),
        sa.Column("simulation_session_id", sa.UUID(), nullable=True),
        sa.Column("status", meeting_status_enum, nullable=False, server_default="upcoming"),
        sa.Column("reminder_sent", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["scenario_id"], ["scenarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["simulation_session_id"], ["simulation_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_upcoming_meetings_user_id", "upcoming_meetings", ["user_id"])

    # ── meeting_outcome enum ──
    meeting_outcome_enum = postgresql.ENUM("great", "okay", "poor", "postponed", name="meeting_outcome", create_type=False)
    bind = op.get_bind()
    if not bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'meeting_outcome'")).scalar():
        meeting_outcome_enum.create(bind)

    # ── post_meeting_feedback ──
    op.create_table(
        "post_meeting_feedback",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("outcome", meeting_outcome_enum, nullable=False),
        sa.Column("what_helped", sa.Text(), nullable=True),
        sa.Column("what_didnt", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["simulation_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_post_meeting_feedback_session_id", "post_meeting_feedback", ["session_id"], unique=True)
    op.create_index("ix_post_meeting_feedback_user_id", "post_meeting_feedback", ["user_id"])

    # ── personalized_personas ──
    op.create_table(
        "personalized_personas",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("background", sa.Text(), nullable=True),
        sa.Column("communication_style", sa.Text(), nullable=False, server_default=""),
        sa.Column("catch_phrases", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("focus_areas", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("difficulty_hint", sa.Integer(), nullable=False, server_default=sa.text("4")),
        sa.Column("usage_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_personalized_personas_user_id", "personalized_personas", ["user_id"])

    # ── scenario_analytics ──
    op.create_table(
        "scenario_analytics",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("scenario_id", sa.UUID(), nullable=False),
        sa.Column("starts_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("completions_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("payments_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("avg_score", sa.Float(), nullable=True),
        sa.Column("repeat_visit_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["scenario_id"], ["scenarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scenario_analytics_scenario_id", "scenario_analytics", ["scenario_id"])


def downgrade() -> None:
    op.drop_table("scenario_analytics")
    op.drop_table("personalized_personas")
    op.drop_table("post_meeting_feedback")
    op.drop_table("upcoming_meetings")
    op.execute("DROP TYPE IF EXISTS meeting_status")
    op.execute("DROP TYPE IF EXISTS meeting_outcome")
