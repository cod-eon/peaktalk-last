"""Add ON UPDATE CASCADE to all FK constraints referencing users.id

Revision ID: 0005
Revises: 603c38a86660
Create Date: 2026-03-20
"""
from typing import Union
import alembic.op as op

revision: str = '0005'
down_revision: Union[str, None] = '603c38a86660'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # onboarding_profiles.user_id
    op.drop_constraint('onboarding_profiles_user_id_fkey', 'onboarding_profiles', type_='foreignkey')
    op.create_foreign_key(
        'onboarding_profiles_user_id_fkey', 'onboarding_profiles',
        'users', ['user_id'], ['id'],
        ondelete='CASCADE', onupdate='CASCADE',
    )

    # documents.owner_id (check actual column name)
    op.drop_constraint('documents_owner_id_fkey', 'documents', type_='foreignkey')
    op.create_foreign_key(
        'documents_owner_id_fkey', 'documents',
        'users', ['owner_id'], ['id'],
        ondelete='CASCADE', onupdate='CASCADE',
    )

    # speech_drafts.user_id
    op.drop_constraint('speech_drafts_user_id_fkey', 'speech_drafts', type_='foreignkey')
    op.create_foreign_key(
        'speech_drafts_user_id_fkey', 'speech_drafts',
        'users', ['user_id'], ['id'],
        ondelete='CASCADE', onupdate='CASCADE',
    )

    # simulation_sessions.user_id
    op.drop_constraint('simulation_sessions_user_id_fkey', 'simulation_sessions', type_='foreignkey')
    op.create_foreign_key(
        'simulation_sessions_user_id_fkey', 'simulation_sessions',
        'users', ['user_id'], ['id'],
        ondelete='CASCADE', onupdate='CASCADE',
    )

    # projects.user_id
    op.drop_constraint('projects_user_id_fkey', 'projects', type_='foreignkey')
    op.create_foreign_key(
        'projects_user_id_fkey', 'projects',
        'users', ['user_id'], ['id'],
        ondelete='CASCADE', onupdate='CASCADE',
    )


def downgrade() -> None:
    # Revert to ondelete CASCADE only (no onupdate)
    op.drop_constraint('onboarding_profiles_user_id_fkey', 'onboarding_profiles', type_='foreignkey')
    op.create_foreign_key(
        'onboarding_profiles_user_id_fkey', 'onboarding_profiles',
        'users', ['user_id'], ['id'], ondelete='CASCADE',
    )

    op.drop_constraint('documents_owner_id_fkey', 'documents', type_='foreignkey')
    op.create_foreign_key(
        'documents_owner_id_fkey', 'documents',
        'users', ['owner_id'], ['id'], ondelete='CASCADE',
    )

    op.drop_constraint('speech_drafts_user_id_fkey', 'speech_drafts', type_='foreignkey')
    op.create_foreign_key(
        'speech_drafts_user_id_fkey', 'speech_drafts',
        'users', ['user_id'], ['id'], ondelete='CASCADE',
    )

    op.drop_constraint('simulation_sessions_user_id_fkey', 'simulation_sessions', type_='foreignkey')
    op.create_foreign_key(
        'simulation_sessions_user_id_fkey', 'simulation_sessions',
        'users', ['user_id'], ['id'], ondelete='CASCADE',
    )

    op.drop_constraint('projects_user_id_fkey', 'projects', type_='foreignkey')
    op.create_foreign_key(
        'projects_user_id_fkey', 'projects',
        'users', ['user_id'], ['id'], ondelete='CASCADE',
    )
