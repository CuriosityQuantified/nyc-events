"""Anonymous Profile and Saved Event persistence models."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Profile(Base):
    """Anonymous-first application state keyed by a device-token digest."""

    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    device_token_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True
    )
    user_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ProfileDeviceAlias(Base):
    """A merged device-token digest mapped directly to one canonical Profile."""

    __tablename__ = "profile_device_aliases"

    device_token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    profile_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SavedEvent(Base):
    """An Event deliberately kept by one Profile."""

    __tablename__ = "saved_events"

    profile_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    event_guid: Mapped[str] = mapped_column(
        String,
        ForeignKey("event_repository.guid", ondelete="CASCADE"),
        primary_key=True,
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Interest(Base):
    """One durable Facet followed by a Profile."""

    __tablename__ = "interests"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    facet_type: Mapped[str] = mapped_column(String(32), nullable=False)
    facet_value: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(100), nullable=False)
    # Composite Interests: every member Facet must match one Event
    # (facet_type is "composite" and normalized_value is the canonical key).
    facets: Mapped[list[dict[str, str]] | None] = mapped_column(JSON, nullable=True)
    alert_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    origin: Mapped[str] = mapped_column(String(16), nullable=False)
    origin_idempotency_key: Mapped[str | None] = mapped_column(
        String(128), nullable=True, unique=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class MatchedEvent(Base):
    """An automatic Event suggestion kept separate from Saved Events."""

    __tablename__ = "matched_events"

    profile_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    event_guid: Mapped[str] = mapped_column(
        String,
        ForeignKey("event_repository.guid", ondelete="CASCADE"),
        primary_key=True,
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="active", server_default="active"
    )
    matched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PreferenceAudit(Base):
    """Secret-free evidence for one approved concierge preference write."""

    __tablename__ = "preference_audits"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    interest_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("interests.id", ondelete="CASCADE"), nullable=False
    )
    origin: Mapped[str] = mapped_column(String(16), nullable=False)
    outcome: Mapped[str] = mapped_column(String(16), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(
        String(128), nullable=False, unique=True
    )
    facet_type: Mapped[str] = mapped_column(String(32), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(100), nullable=False)
    alert_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
