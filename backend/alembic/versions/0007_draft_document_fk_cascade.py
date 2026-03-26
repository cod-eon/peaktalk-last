"""change speech_drafts.document_id FK from SET NULL to CASCADE

Revision ID: 0007
Revises: 603c38a86660
Create Date: 2026-03-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old FK (SET NULL) and recreate with CASCADE so that deleting a document
    # automatically removes its associated drafts (and their analysis results via
    # the existing CASCADE on ai_analysis_results.draft_id).
    op.drop_constraint(
        "speech_drafts_document_id_fkey", "speech_drafts", type_="foreignkey"
    )
    op.create_foreign_key(
        "speech_drafts_document_id_fkey",
        "speech_drafts",
        "documents",
        ["document_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "speech_drafts_document_id_fkey", "speech_drafts", type_="foreignkey"
    )
    op.create_foreign_key(
        "speech_drafts_document_id_fkey",
        "speech_drafts",
        "documents",
        ["document_id"],
        ["id"],
        ondelete="SET NULL",
    )
