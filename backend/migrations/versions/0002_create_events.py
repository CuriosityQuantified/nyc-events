"""Create events table.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-15

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("guid", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("official_event_url", sa.String(), nullable=True),
        sa.Column("location_id", sa.String(), nullable=True),
        sa.Column("location_name", sa.String(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column(
            "start_datetime", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column(
            "end_datetime", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column("categories", JSON(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("borough", sa.String(), nullable=True),
        sa.Column("registration_status", sa.String(), nullable=True),
        sa.Column("registration_description", sa.String(), nullable=True),
        sa.Column("is_free_explicit", sa.Boolean(), nullable=True),
        sa.Column("accessibility_mentioned", sa.Boolean(), nullable=True),
        sa.Column("raw_data", JSON(), nullable=True),
        sa.Column(
            "synced_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("events")
