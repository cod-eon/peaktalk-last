"""Add Better Auth core PostgreSQL schema.

Revision ID: 0023_better_auth_schema
Revises: 0022_user_identities
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
revision: str = "0023_better_auth_schema"
down_revision: Union[str, None] = "0022_user_identities"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table("user", sa.Column("id",sa.Text(),nullable=False),sa.Column("name",sa.Text(),nullable=False),sa.Column("email",sa.Text(),nullable=False),sa.Column("emailVerified",sa.Boolean(),nullable=False),sa.Column("image",sa.Text()),sa.Column("createdAt",sa.DateTime(timezone=True),nullable=False),sa.Column("updatedAt",sa.DateTime(timezone=True),nullable=False),sa.PrimaryKeyConstraint("id"),sa.UniqueConstraint("email",name="uq_better_auth_user_email"))
    op.create_table("session",sa.Column("id",sa.Text(),nullable=False),sa.Column("expiresAt",sa.DateTime(timezone=True),nullable=False),sa.Column("token",sa.Text(),nullable=False),sa.Column("createdAt",sa.DateTime(timezone=True),nullable=False),sa.Column("updatedAt",sa.DateTime(timezone=True),nullable=False),sa.Column("ipAddress",sa.Text()),sa.Column("userAgent",sa.Text()),sa.Column("userId",sa.Text(),nullable=False),sa.ForeignKeyConstraint(["userId"],["user.id"],ondelete="CASCADE"),sa.PrimaryKeyConstraint("id"),sa.UniqueConstraint("token",name="uq_better_auth_session_token"))
    op.create_index("ix_better_auth_session_user_id","session",["userId"])
    op.create_table("account",sa.Column("id",sa.Text(),nullable=False),sa.Column("accountId",sa.Text(),nullable=False),sa.Column("providerId",sa.Text(),nullable=False),sa.Column("userId",sa.Text(),nullable=False),sa.Column("accessToken",sa.Text()),sa.Column("refreshToken",sa.Text()),sa.Column("idToken",sa.Text()),sa.Column("accessTokenExpiresAt",sa.DateTime(timezone=True)),sa.Column("refreshTokenExpiresAt",sa.DateTime(timezone=True)),sa.Column("scope",sa.Text()),sa.Column("password",sa.Text()),sa.Column("createdAt",sa.DateTime(timezone=True),nullable=False),sa.Column("updatedAt",sa.DateTime(timezone=True),nullable=False),sa.ForeignKeyConstraint(["userId"],["user.id"],ondelete="CASCADE"),sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_better_auth_account_user_id","account",["userId"])
    op.create_table("verification",sa.Column("id",sa.Text(),nullable=False),sa.Column("identifier",sa.Text(),nullable=False),sa.Column("value",sa.Text(),nullable=False),sa.Column("expiresAt",sa.DateTime(timezone=True),nullable=False),sa.Column("createdAt",sa.DateTime(timezone=True),nullable=False),sa.Column("updatedAt",sa.DateTime(timezone=True),nullable=False),sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_better_auth_verification_identifier","verification",["identifier"])

def downgrade() -> None:
    op.drop_index("ix_better_auth_verification_identifier",table_name="verification");op.drop_table("verification")
    op.drop_index("ix_better_auth_account_user_id",table_name="account");op.drop_table("account")
    op.drop_index("ix_better_auth_session_user_id",table_name="session");op.drop_table("session")
    op.drop_table("user")
