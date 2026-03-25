"""merge speech_drafts into documents — unify text context under documents table

Revision ID: 0006
Revises: 603c38a86660
Create Date: 2026-03-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "603c38a86660"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add source column: 'upload' for file uploads, 'text' for typed/pasted text
    op.add_column(
        "documents",
        sa.Column("source", sa.String(8), nullable=False, server_default="upload"),
    )

    # 2. Make storage_path nullable — text documents have no file in storage
    op.alter_column("documents", "storage_path", nullable=True)

    # 3. Copy speech_drafts → documents as source='text' rows
    op.execute(sa.text("""
        INSERT INTO documents
            (id, owner_id, name, storage_path, file_type, extracted_text, parsed_at, source, created_at)
        SELECT
            sd.id,
            sd.user_id          AS owner_id,
            sd.title            AS name,
            NULL                AS storage_path,
            'other'::file_type  AS file_type,
            sd.raw_text         AS extracted_text,
            sd.created_at       AS parsed_at,
            'text'              AS source,
            sd.created_at
        FROM speech_drafts sd
        ON CONFLICT (id) DO NOTHING
    """))

    # 4. Point simulation_sessions.document_id at the new document rows
    #    (only where draft_id was set and document_id was not)
    op.execute(sa.text("""
        UPDATE simulation_sessions
        SET document_id = draft_id
        WHERE draft_id IS NOT NULL
          AND document_id IS NULL
    """))


def downgrade() -> None:
    # Reverse data migration
    op.execute(sa.text("""
        UPDATE simulation_sessions ss
        SET document_id = NULL
        FROM documents d
        WHERE ss.document_id = d.id AND d.source = 'text'
    """))
    op.execute(sa.text("DELETE FROM documents WHERE source = 'text'"))
    op.alter_column("documents", "storage_path", nullable=False)
    op.drop_column("documents", "source")
