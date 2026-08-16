"""Issue #15 gates for the scheduled synchronization worker."""

from __future__ import annotations

import asyncio
import tomllib
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
import pytest_asyncio
import redis.asyncio as aioredis
from sqlalchemy import func, select

from app.config import get_settings
from app.models.event import CurrentEvent, SyncRun
from app.socrata import SocrataError
from app.sync import SYNC_LOCK_NAME, SyncAlreadyRunning, run
from tests.conftest import load_fixture, requires_docker

BACKEND_ROOT = Path(__file__).resolve().parents[1]


class FixtureSource:
    def __init__(self, rows):
        self.rows = rows

    async def fetch_all_events(self):
        return self.rows


class BlockingSource(FixtureSource):
    def __init__(self, rows):
        super().__init__(rows)
        self.started = asyncio.Event()
        self.release = asyncio.Event()

    async def fetch_all_events(self):
        self.started.set()
        await self.release.wait()
        return self.rows


class FailedSource:
    async def fetch_all_events(self):
        raise SocrataError("fixture upstream unavailable")


@pytest_asyncio.fixture
async def redis_client():
    client = aioredis.from_url(get_settings().redis_url)
    await client.ping()
    await client.delete(SYNC_LOCK_NAME)
    yield client
    await client.delete(SYNC_LOCK_NAME)
    await client.aclose()


def test_railway_uses_a_separate_scheduled_worker():
    config = tomllib.loads((BACKEND_ROOT / "railway-sync.toml").read_text())
    deploy = config["deploy"]
    assert deploy == {
        "startCommand": ".venv/bin/python -m app.sync",
        "cronSchedule": "0 */2 * * *",
        "restartPolicyType": "NEVER",
    }

    api_source = (BACKEND_ROOT / "app/main.py").read_text()
    assert "app.sync" not in api_source
    assert "create_task(" not in api_source
    assert get_settings().sync_lock_timeout_seconds > 2 * 60 * 60


@requires_docker
async def test_real_redis_lock_rejects_a_concurrent_sync_run(db_session, redis_client):
    rows = load_fixture("snapshot_a.json")
    source = BlockingSource(rows)
    first = asyncio.create_task(run(source=source, redis_client=redis_client))
    await asyncio.wait_for(source.started.wait(), timeout=5)

    try:
        with pytest.raises(SyncAlreadyRunning, match="already running"):
            await run(source=FixtureSource(rows), redis_client=redis_client)
    finally:
        source.release.set()

    assert await first == len(rows)
    runs = (await db_session.scalars(select(SyncRun))).all()
    assert len(runs) == 1
    assert runs[0].status == "succeeded"


@requires_docker
async def test_worker_records_each_run_and_preserves_snapshot_on_failure(
    db_session, redis_client
):
    rows = load_fixture("snapshot_a.json")
    assert await run(source=FixtureSource(rows), redis_client=redis_client) == len(rows)

    with pytest.raises(SocrataError, match="fixture upstream unavailable"):
        await run(source=FailedSource(), redis_client=redis_client)
    assert await run(source=FixtureSource(rows), redis_client=redis_client) == len(rows)

    runs = (await db_session.scalars(select(SyncRun).order_by(SyncRun.id))).all()
    assert [item.status for item in runs] == ["succeeded", "failed", "succeeded"]
    assert runs[0].row_count == len(rows)
    assert runs[0].finished_at is not None
    assert runs[0].duration_ms is not None and runs[0].duration_ms >= 0
    assert runs[0].failure_code is None
    assert runs[1].row_count is None
    assert runs[1].finished_at is not None
    assert runs[1].duration_ms is not None and runs[1].duration_ms >= 0
    assert runs[1].failure_code == "SocrataError"
    assert "fixture upstream unavailable" not in repr(runs[1].__dict__)
    assert runs[2].row_count == len(rows)

    snapshot_count = await db_session.scalar(
        select(func.count()).select_from(CurrentEvent)
    )
    assert snapshot_count == len(rows)


@requires_docker
async def test_freshness_never_reports_an_old_snapshot_as_current(
    client, db_session, redis_client
):
    rows = load_fixture("snapshot_a.json")
    await run(source=FixtureSource(rows), redis_client=redis_client)
    successful = await db_session.scalar(
        select(SyncRun).where(SyncRun.status == "succeeded")
    )
    assert successful is not None
    successful.finished_at = datetime.now(UTC) - timedelta(
        seconds=get_settings().snapshot_stale_after_seconds + 1
    )
    await db_session.commit()

    response = await client.get("/freshness")
    assert response.status_code == 200
    body = response.json()
    assert body["last_successful_sync"]["value"] == successful.finished_at.isoformat()
    assert body["snapshot_row_count"]["value"] == len(rows)
    assert body["is_stale"]["value"] is True
    assert body["is_stale"]["raw"].startswith("stale after ")
