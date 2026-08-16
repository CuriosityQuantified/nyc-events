"""Split current Events from archival Events and record Sync Runs.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _event_columns(*, include_snapshot: bool = False) -> list[sa.Column]:
    columns = [
        sa.Column("guid", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("official_event_url", sa.String()),
        sa.Column("location_key", sa.String()),
        sa.Column("location_id", sa.String()),
        sa.Column("location_name", sa.String()),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("start_datetime", sa.DateTime(timezone=True)),
        sa.Column("end_datetime", sa.DateTime(timezone=True)),
        sa.Column("categories", JSONB()),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("borough", sa.String()),
        sa.Column("registration_status", sa.String()),
        sa.Column("registration_description", sa.String()),
        sa.Column("is_free_explicit", sa.Boolean()),
        sa.Column("accessibility_mentioned", sa.Boolean()),
        sa.Column("raw_data", JSONB()),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    ]
    if include_snapshot:
        columns.append(
            sa.Column("snapshot_at", sa.DateTime(timezone=True), nullable=False)
        )
    return columns


def upgrade() -> None:
    op.rename_table("events", "event_repository")
    op.execute(
        "ALTER INDEX ix_events_location_key RENAME TO ix_event_repository_location_key"
    )
    op.add_column(
        "event_repository",
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.add_column(
        "event_repository",
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table("current_events", *_event_columns(include_snapshot=True))
    op.create_index(
        "ix_current_events_location_key", "current_events", ["location_key"]
    )
    op.execute(
        """
        INSERT INTO current_events
        SELECT guid, title, description, official_event_url, location_key,
               location_id, location_name, start_date, end_date, start_datetime,
               end_datetime, categories, latitude, longitude, borough,
               registration_status, registration_description, is_free_explicit,
               accessibility_mentioned, raw_data, synced_at, synced_at
        FROM event_repository
        """
    )
    op.execute("CREATE VIEW events AS SELECT * FROM current_events")
    op.create_table(
        "sync_runs",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("row_count", sa.Integer()),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("failure_code", sa.String(64)),
    )


def downgrade() -> None:
    op.drop_table("sync_runs")
    op.execute("DROP VIEW events")
    op.drop_index("ix_current_events_location_key", table_name="current_events")
    op.drop_table("current_events")
    op.drop_column("event_repository", "last_seen_at")
    op.drop_column("event_repository", "first_seen_at")
    op.rename_table("event_repository", "events")
    op.execute(
        "ALTER INDEX ix_event_repository_location_key RENAME TO ix_events_location_key"
    )
