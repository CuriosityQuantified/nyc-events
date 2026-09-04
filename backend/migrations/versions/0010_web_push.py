"""Add in-app notifications and Web Push subscriptions.

Revision ID: 0010
Revises: 0009
Create Date: 2026-09-02
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notifications",
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
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pushed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("push_enabled", sa.Boolean(), server_default="false", nullable=False),
    )
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "profile_id",
            sa.Uuid(),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("endpoint", sa.Text(), nullable=False, unique=True),
        sa.Column("p256dh", sa.String(255), nullable=False),
        sa.Column("auth", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_push_subscriptions_profile_id", "push_subscriptions", ["profile_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_push_subscriptions_profile_id", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_table("notifications")
