"""Static MTA subway records and derived current Event locations."""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class SubwaySource(Base):
    """Source and update metadata for one imported transit dataset."""

    __tablename__ = "subway_sources"

    source_id: Mapped[str] = mapped_column(String, primary_key=True)
    attribution: Mapped[str] = mapped_column(String, nullable=False)
    publisher: Mapped[str] = mapped_column(String, nullable=False)
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    developer_url: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    feed_version: Mapped[str] = mapped_column(String, nullable=False)
    feed_start_date: Mapped[str] = mapped_column(String(10), nullable=False)
    feed_end_date: Mapped[str] = mapped_column(String(10), nullable=False)
    archive_sha256: Mapped[str] = mapped_column(String(64), nullable=False)


class SubwayRoute(Base):
    """One stable GTFS subway route and all of its branch geometry."""

    __tablename__ = "subway_routes"

    route_id: Mapped[str] = mapped_column(String, primary_key=True)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("subway_sources.source_id"), nullable=False
    )
    short_name: Mapped[str] = mapped_column(String, nullable=False)
    long_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    route_url: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String(6), nullable=False)
    text_color: Mapped[str] = mapped_column(String(6), nullable=False)
    geometry: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        comment="GeoJSON Feature with longitude-latitude coordinates",
    )


class SubwayStop(Base):
    """One stable GTFS station or directional platform stop."""

    __tablename__ = "subway_stops"

    stop_id: Mapped[str] = mapped_column(String, primary_key=True)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("subway_sources.source_id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location_type: Mapped[int] = mapped_column(Integer, nullable=False)
    parent_station: Mapped[str | None] = mapped_column(
        ForeignKey("subway_stops.stop_id"), nullable=True
    )


class SubwayRouteStop(Base):
    """A route-to-stop association for one GTFS branch shape."""

    __tablename__ = "subway_route_stops"

    route_id: Mapped[str] = mapped_column(
        ForeignKey("subway_routes.route_id"), primary_key=True
    )
    stop_id: Mapped[str] = mapped_column(
        ForeignKey("subway_stops.stop_id"), primary_key=True
    )
    branch_id: Mapped[str] = mapped_column(String, primary_key=True)


class CurrentEventLocation(Base):
    """One unique valid non-null-island location derived from a current Event."""

    __tablename__ = "current_event_locations"

    event_guid: Mapped[str] = mapped_column(
        ForeignKey("current_events.guid", ondelete="CASCADE"), primary_key=True
    )
    ordinal: Mapped[int] = mapped_column(Integer, primary_key=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
