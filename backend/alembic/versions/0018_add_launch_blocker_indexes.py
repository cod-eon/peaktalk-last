"""Add launch blocker indexes and safety constraints.

Revision ID: 0018_launch_blocker_indexes
Revises: 0017_app_settings
Create Date: 2026-04-30
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0018_launch_blocker_indexes"
down_revision: Union[str, None] = "0017_app_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_simulation_sessions_document_id", "simulation_sessions", ["document_id"])
    op.create_index("ix_simulation_sessions_draft_id", "simulation_sessions", ["draft_id"])
    op.create_index("ix_simulation_sessions_status", "simulation_sessions", ["status"])
    op.create_index("ix_simulation_messages_session_turn", "simulation_messages", ["session_id", "turn_index"])
    op.create_index("ix_speech_drafts_document_id", "speech_drafts", ["document_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])
    op.create_index("ix_scenario_analytics_scenario_period", "scenario_analytics", ["scenario_id", "period_start"])
    op.create_check_constraint("ck_skill_metrics_score_0_1", "skill_metrics", "score >= 0 AND score <= 1")
    op.create_check_constraint(
        "ck_scenarios_recommended_difficulty_1_5",
        "scenarios",
        "recommended_difficulty >= 1 AND recommended_difficulty <= 5",
    )


def downgrade() -> None:
    op.drop_constraint("ck_scenarios_recommended_difficulty_1_5", "scenarios", type_="check")
    op.drop_constraint("ck_skill_metrics_score_0_1", "skill_metrics", type_="check")
    op.drop_index("ix_scenario_analytics_scenario_period", table_name="scenario_analytics")
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_speech_drafts_document_id", table_name="speech_drafts")
    op.drop_index("ix_simulation_messages_session_turn", table_name="simulation_messages")
    op.drop_index("ix_simulation_sessions_status", table_name="simulation_sessions")
    op.drop_index("ix_simulation_sessions_draft_id", table_name="simulation_sessions")
    op.drop_index("ix_simulation_sessions_document_id", table_name="simulation_sessions")
