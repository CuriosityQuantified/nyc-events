"""Current, archival, and synchronization persistence models."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class EventFields:
    """Columns shared by the current Snapshot and archival repository."""

    guid: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    official_event_url: Mapped[str | None] = mapped_column(String, nullable=True)
    location_key: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    location_id: Mapped[str | None] = mapped_column(String, nullable=True)
    location_name: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    categories: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    borough: Mapped[str | None] = mapped_column(String, nullable=True)
    registration_status: Mapped[str | None] = mapped_column(String, nullable=True)
    registration_description: Mapped[str | None] = mapped_column(String, nullable=True)
    is_free_explicit: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    accessibility_mentioned: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    raw_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    lifecycle_status: Mapped[str] = mapped_column(String(16), nullable=False)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EventRepository(EventFields, Base):
    """The union of all source Events observed in successful Sync Runs."""

    __tablename__ = "event_repository"

    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CurrentEvent(EventFields, Base):
    """One Event in the latest complete successful source Snapshot."""

    __tablename__ = "current_events"

    snapshot_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class SyncRun(Base):
    """Secret-free operational evidence for one attempted synchronization."""

    __tablename__ = "sync_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    row_count: Mapped[int | None] = mapped_column(nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(nullable=True)
    failure_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
