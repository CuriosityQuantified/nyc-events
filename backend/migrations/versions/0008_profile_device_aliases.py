"""Map merged device tokens to their canonical Profiles.

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-21
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profile_device_aliases",
        sa.Column("device_token_hash", sa.String(length=64), primary_key=True),
        sa.Column(
            "profile_id",
            sa.Uuid(),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(device_token_hash) = 64",
            name="ck_profile_device_aliases_token_hash_length",
        ),
    )
    op.create_index(
        "ix_profile_device_aliases_profile_id",
        "profile_device_aliases",
        ["profile_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_profile_device_aliases_profile_id",
        table_name="profile_device_aliases",
    )
    op.drop_table("profile_device_aliases")
