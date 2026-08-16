"""SQLAlchemy model definitions."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


from app.models.event import CurrentEvent, EventRepository, SyncRun  # noqa: E402, F401
