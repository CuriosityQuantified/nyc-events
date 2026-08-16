"""Add Event content hashes and lifecycle classifications.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-16
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from typing import Any

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLES = ("event_repository", "current_events")
_ALLOWED_STATUSES = "'new', 'changed', 'unchanged', 'cancelled', 'expired', 'removed'"


def _content_hash(raw_data: Any) -> str:
    canonical = json.dumps(
        raw_data,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode()).hexdigest()


def upgrade() -> None:
    op.execute("DROP VIEW events")
    for table_name in _TABLES:
        op.add_column(
            table_name,
            sa.Column("content_hash", sa.String(length=64), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("lifecycle_status", sa.String(length=16), nullable=True),
        )

    bind = op.get_bind()
    for table_name in _TABLES:
        rows = bind.execute(
            sa.text(f"SELECT guid, raw_data FROM {table_name}")
        ).mappings()
        for row in rows:
            bind.execute(
                sa.text(
                    f"UPDATE {table_name} "
                    "SET content_hash = :content_hash, "
                    "lifecycle_status = 'unchanged' WHERE guid = :guid"
                ),
                {"guid": row["guid"], "content_hash": _content_hash(row["raw_data"])},
            )
        op.alter_column(table_name, "content_hash", nullable=False)
        op.alter_column(table_name, "lifecycle_status", nullable=False)
        op.create_check_constraint(
            f"ck_{table_name}_lifecycle_status",
            table_name,
            f"lifecycle_status IN ({_ALLOWED_STATUSES})",
        )
    op.execute("CREATE VIEW events AS SELECT * FROM current_events")


def downgrade() -> None:
    op.execute("DROP VIEW events")
    for table_name in reversed(_TABLES):
        op.drop_constraint(
            f"ck_{table_name}_lifecycle_status", table_name, type_="check"
        )
        op.drop_column(table_name, "lifecycle_status")
        op.drop_column(table_name, "content_hash")
    op.execute("CREATE VIEW events AS SELECT * FROM current_events")
