"""SQLAlchemy model definitions."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


from app.models.event import CurrentEvent, EventRepository, SyncRun  # noqa: E402, F401
from app.models.profile import (  # noqa: E402, F401
    Interest,
    MatchedEvent,
    PreferenceAudit,
    Profile,
    ProfileDeviceAlias,
    SavedEvent,
)
