"""Allow one Interest to combine several Facets.

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-16
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "interests",
        sa.Column("facets", sa.JSON(), nullable=True),
    )
    op.drop_constraint("ck_interests_facet_type", "interests", type_="check")
    op.create_check_constraint(
        "ck_interests_facet_type",
        "interests",
        "facet_type IN ('borough', 'category', 'registration', 'composite')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_interests_facet_type", "interests", type_="check")
    op.create_check_constraint(
        "ck_interests_facet_type",
        "interests",
        "facet_type IN ('borough', 'category', 'registration')",
    )
    op.drop_column("interests", "facets")
