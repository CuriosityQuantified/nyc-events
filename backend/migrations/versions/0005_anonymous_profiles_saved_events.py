"""Create anonymous Profiles and Saved Events.

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-16
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("device_token_hash", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(device_token_hash) = 64",
            name="ck_profiles_device_token_hash_length",
        ),
        sa.UniqueConstraint("device_token_hash", name="uq_profiles_device_token_hash"),
        sa.UniqueConstraint("user_id", name="uq_profiles_user_id"),
    )
    op.create_table(
        "saved_events",
        sa.Column(
            "profile_id",
            sa.Uuid(),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "event_guid",
            sa.String(),
            sa.ForeignKey("event_repository.guid", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "saved_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_saved_events_event_guid", "saved_events", ["event_guid"])


def downgrade() -> None:
    op.drop_index("ix_saved_events_event_guid", table_name="saved_events")
    op.drop_table("saved_events")
    op.drop_table("profiles")
