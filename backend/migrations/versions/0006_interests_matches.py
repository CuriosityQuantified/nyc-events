"""Create Interests, Matches, and approved-preference audit evidence.

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-16
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "interests",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "profile_id",
            sa.Uuid(),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("facet_type", sa.String(length=32), nullable=False),
        sa.Column("facet_value", sa.String(length=100), nullable=False),
        sa.Column("normalized_value", sa.String(length=100), nullable=False),
        sa.Column(
            "alert_enabled", sa.Boolean(), server_default=sa.true(), nullable=False
        ),
        sa.Column("origin", sa.String(length=16), nullable=False),
        sa.Column("origin_idempotency_key", sa.String(length=128), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "facet_type IN ('borough', 'category', 'registration')",
            name="ck_interests_facet_type",
        ),
        sa.CheckConstraint(
            "origin IN ('manual', 'concierge')", name="ck_interests_origin"
        ),
        sa.UniqueConstraint(
            "profile_id",
            "facet_type",
            "normalized_value",
            name="uq_interests_profile_facet_value",
        ),
        sa.UniqueConstraint(
            "origin_idempotency_key", name="uq_interests_origin_idempotency_key"
        ),
    )
    op.create_index("ix_interests_profile_id", "interests", ["profile_id"])

    op.create_table(
        "matched_events",
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
            "status", sa.String(length=16), server_default="active", nullable=False
        ),
        sa.Column(
            "matched_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('active', 'dismissed', 'promoted')",
            name="ck_matched_events_status",
        ),
    )
    op.create_index("ix_matched_events_event_guid", "matched_events", ["event_guid"])

    op.create_table(
        "preference_audits",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "profile_id",
            sa.Uuid(),
            sa.ForeignKey("profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "interest_id",
            sa.Uuid(),
            sa.ForeignKey("interests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("origin", sa.String(length=16), nullable=False),
        sa.Column("outcome", sa.String(length=16), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("facet_type", sa.String(length=32), nullable=False),
        sa.Column("normalized_value", sa.String(length=100), nullable=False),
        sa.Column("alert_enabled", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("origin = 'concierge'", name="ck_preference_audits_origin"),
        sa.CheckConstraint(
            "outcome IN ('approved', 'edited')",
            name="ck_preference_audits_outcome",
        ),
        sa.UniqueConstraint("idempotency_key", name="uq_preference_audits_key"),
    )


def downgrade() -> None:
    op.drop_table("preference_audits")
    op.drop_index("ix_matched_events_event_guid", table_name="matched_events")
    op.drop_table("matched_events")
    op.drop_index("ix_interests_profile_id", table_name="interests")
    op.drop_table("interests")
