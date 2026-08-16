"""Emit secret-free evidence for the current production Event Snapshot."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session_factory, reset_engine
from app.models.event import CurrentEvent


async def snapshot_evidence(session: AsyncSession) -> dict[str, Any]:
    """Return the current row count and the API's deterministic first guid."""
    row_count = await session.scalar(select(func.count()).select_from(CurrentEvent))
    first_guid = await session.scalar(
        select(CurrentEvent.guid)
        .order_by(CurrentEvent.start_datetime.asc().nullslast(), CurrentEvent.guid)
        .limit(1)
    )
    if not row_count or first_guid is None:
        raise RuntimeError("current production Snapshot is empty")
    return {"row_count": row_count, "first_guid": first_guid}


async def _main() -> None:
    try:
        async with get_session_factory()() as session:
            print(json.dumps(await snapshot_evidence(session), sort_keys=True))
    finally:
        await reset_engine()


if __name__ == "__main__":
    asyncio.run(_main())
