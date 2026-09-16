"""Track the source revision verified by each successful sync or unchanged check."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sync_runs", sa.Column("retry_not_before", sa.DateTime(timezone=True))
    )
    op.add_column("sync_runs", sa.Column("deployment_revision", sa.String(64)))
    op.add_column("sync_runs", sa.Column("source_version", sa.String(64)))
    op.add_column(
        "sync_runs", sa.Column("source_updated_at", sa.DateTime(timezone=True))
    )
    op.create_index(
        "ix_sync_runs_status_finished_at", "sync_runs", ["status", "finished_at"]
    )


def downgrade() -> None:
    op.drop_column("sync_runs", "retry_not_before")
    op.drop_column("sync_runs", "deployment_revision")
    op.drop_index("ix_sync_runs_status_finished_at", table_name="sync_runs")
    op.drop_column("sync_runs", "source_updated_at")
    op.drop_column("sync_runs", "source_version")
