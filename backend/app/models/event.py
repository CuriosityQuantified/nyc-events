"""Event SQLAlchemy model for NYC Parks events."""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models import Base


class Event(Base):
    """A single NYC Parks event identified by its source guid."""

    __tablename__ = "events"

    guid = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    official_event_url = Column(String, nullable=True)
    location_key = Column(String, nullable=True, index=True)
    location_id = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    start_datetime = Column(DateTime(timezone=True), nullable=True)
    end_datetime = Column(DateTime(timezone=True), nullable=True)
    categories = Column(JSONB, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    borough = Column(String, nullable=True)
    registration_status = Column(String, nullable=True)
    registration_description = Column(String, nullable=True)
    is_free_explicit = Column(Boolean, nullable=True)
    accessibility_mentioned = Column(Boolean, nullable=True)
    raw_data = Column(JSONB, nullable=True)
    synced_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
