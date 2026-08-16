"""Event SQLAlchemy model for NYC Parks events."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Event(Base):
    """A single NYC Parks event identified by its source guid."""

    __tablename__ = "events"

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
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
