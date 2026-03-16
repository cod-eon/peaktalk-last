"""add_projects

Revision ID: 603c38a86660
Revises: 0004
Create Date: 2026-03-16 16:42:37.695517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '603c38a86660'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'projects',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column(
            'event_type',
            sa.Enum('interview', 'pitch', 'talk', 'presentation', 'other', name='event_type'),
            nullable=False,
        ),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_projects_user_id'), 'projects', ['user_id'], unique=False)

    op.create_table(
        'project_documents',
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id', 'document_id'),
    )

    op.create_table(
        'project_simulations',
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('simulation_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['simulation_id'], ['simulation_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id', 'simulation_id'),
    )


def downgrade() -> None:
    op.drop_table('project_simulations')
    op.drop_table('project_documents')
    op.drop_index(op.f('ix_projects_user_id'), table_name='projects')
    op.drop_table('projects')
    op.execute("DROP TYPE IF EXISTS event_type")
