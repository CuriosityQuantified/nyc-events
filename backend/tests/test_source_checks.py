"""Offline regression tests for change detection and snapshot preservation."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from sqlalchemy import select

from app.config import get_settings
from app.models.event import CurrentEvent, SyncRun
from app.socrata import (
    SocrataClient,
    SocrataCooldown,
    SocrataError,
    SourceRevision,
    sync_events,
)
from tests.conftest import load_fixture, requires_docker


class VersionedSource:
    def __init__(self):
        self.version = "a" * 64
        self.updated = datetime(2026, 9, 1, tzinfo=UTC)
        self.rows = load_fixture("snapshot_a.json")
        self.downloads = 0
        self.change_during_download = False

    async def fetch_revision(self):
        return SourceRevision(self.version, self.updated)

    async def fetch_all_events(self):
        self.downloads += 1
        if self.change_during_download:
            self.version = "c" * 64
        return self.rows


@requires_docker
async def test_unchanged_check_keeps_snapshot_and_advances_check_time(
    client, db_session
):
    source = VersionedSource()
    await sync_events(db_session, source)
    full = await db_session.scalar(select(SyncRun))
    full.finished_at = datetime.now(UTC) - timedelta(hours=2)
    await db_session.commit()
    snapshot = await db_session.scalar(select(CurrentEvent).limit(1))
    snapshot_at = snapshot.snapshot_at
    assert (await client.get("/ingestion-health/ready")).status_code == 503

    await sync_events(db_session, source)
    assert source.downloads == 1
    db_session.expire_all()
    snapshot = await db_session.scalar(select(CurrentEvent).limit(1))
    assert snapshot.snapshot_at == snapshot_at
    runs = (await db_session.scalars(select(SyncRun).order_by(SyncRun.id))).all()
    assert [run.status for run in runs] == ["succeeded", "unchanged"]
    freshness = (await client.get("/freshness")).json()
    assert freshness["is_stale"]["value"] is False
    assert (
        freshness["last_successful_sync"]["value"]
        != freshness["last_successful_check"]["value"]
    )
    assert freshness["source_updated_at"]["value"] == source.updated.isoformat()
    assert (await client.get("/ingestion-health/ready")).status_code == 200


@requires_docker
async def test_changed_source_full_refresh_and_forced_deployment_refresh(db_session):
    source = VersionedSource()
    await sync_events(db_session, source)
    source.version = "b" * 64
    source.rows[0]["title"] = "Updated by NYC Parks"
    await sync_events(db_session, source)
    updated = await db_session.get(CurrentEvent, source.rows[0]["guid"])
    assert updated.title == "Updated by NYC Parks"
    await sync_events(db_session, source, force=True)
    assert source.downloads == 3


@requires_docker
async def test_daily_full_refresh_uses_last_download_not_last_check(db_session):
    source = VersionedSource()
    await sync_events(db_session, source)
    full = await db_session.scalar(select(SyncRun))
    full.finished_at = datetime.now(UTC) - timedelta(days=1, minutes=1)
    await db_session.commit()
    await sync_events(db_session, source)
    assert source.downloads == 2


@requires_docker
async def test_snapshot_and_success_evidence_commit_together(db_session):
    source = VersionedSource()
    await sync_events(db_session, source)
    original_title = source.rows[0]["title"]
    source.rows[0]["title"] = "Uncommitted change"
    source.version = "b" * 64
    commit = db_session.commit
    calls = 0

    async def fail_snapshot_commit():
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("simulated final commit failure")
        await commit()

    with (
        patch.object(db_session, "commit", side_effect=fail_snapshot_commit),
        pytest.raises(RuntimeError, match="final commit"),
    ):
        await sync_events(db_session, source)
    event = await db_session.get(CurrentEvent, source.rows[0]["guid"])
    assert event.title == original_title
    runs = (await db_session.scalars(select(SyncRun).order_by(SyncRun.id))).all()
    assert [run.status for run in runs] == ["succeeded", "failed"]


@requires_docker
@pytest.mark.parametrize("failure", ["invalid", "mid-pagination", "empty"])
async def test_failed_new_revision_does_not_advance_checkpoint(db_session, failure):
    source = VersionedSource()
    await sync_events(db_session, source)
    source.version = "b" * 64
    if failure == "invalid":
        source.rows = [{"guid": "new-row"}]
    elif failure == "empty":
        source.rows = []
    else:
        source.change_during_download = True
    with pytest.raises(SocrataError):
        await sync_events(db_session, source)
    runs = (await db_session.scalars(select(SyncRun).order_by(SyncRun.id))).all()
    assert [run.status for run in runs] == ["succeeded", "failed"]
    assert runs[0].source_version == "a" * 64
    assert runs[1].source_version is None
    assert (await db_session.scalars(select(CurrentEvent))).all()
    source.change_during_download = False
    source.rows = load_fixture("snapshot_a.json")
    await sync_events(db_session, source)
    assert source.downloads == 3


async def test_metadata_check_uses_query_dataset_and_metadata_changes_change_revision():
    metadata = {"id": "w3wp-dpdi", "rowsUpdatedAt": 1789478150, "viewLastModified": 123}
    requests = []

    def respond(request):
        requests.append(request)
        return httpx.Response(200, json=metadata)

    async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as transport:
        source = SocrataClient(http_client=transport)
        first = await source.fetch_revision()
        assert await source.fetch_revision() == first
        metadata["viewLastModified"] = 124
        assert (await source.fetch_revision()).version != first.version
    assert all(
        r.method == "GET" and r.url.path == "/api/views/w3wp-dpdi.json"
        for r in requests
    )


@pytest.mark.parametrize(
    "metadata",
    [
        {},
        {"id": "other", "rowsUpdatedAt": 123},
        {"id": "w3wp-dpdi", "rowsUpdatedAt": None},
    ],
)
async def test_invalid_metadata_cannot_count_as_unchanged(metadata):
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _: httpx.Response(200, json=metadata))
    ) as transport:
        with pytest.raises(SocrataError, match="metadata"):
            await SocrataClient(http_client=transport).fetch_revision()


async def test_rate_limit_retry_respects_retry_after():
    responses = [
        httpx.Response(429, headers={"Retry-After": "17"}),
        httpx.Response(200, json=[]),
    ]
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _: responses.pop(0))
    ) as transport:
        with patch("app.socrata.asyncio.sleep", new_callable=AsyncMock) as sleep:
            await SocrataClient(http_client=transport).fetch_all_events()
    sleep.assert_awaited_once_with(17)


@requires_docker
async def test_long_retry_after_survives_the_next_scheduled_execution(db_session):
    requests = []

    def throttle(request):
        requests.append(request)
        return httpx.Response(429, headers={"Retry-After": "3600"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(throttle)) as transport:
        source = SocrataClient(http_client=transport)
        with pytest.raises(SocrataCooldown):
            await sync_events(db_session, source)
        await sync_events(db_session, source)
    assert len(requests) == 1
    runs = (await db_session.scalars(select(SyncRun).order_by(SyncRun.id))).all()
    assert [run.status for run in runs] == ["failed", "deferred"]
    assert runs[0].retry_not_before > datetime.now(UTC) + timedelta(minutes=59)


@requires_docker
async def test_worker_deadline_records_failure_and_releases_lock(
    db_session, monkeypatch
):
    import asyncio

    import redis.asyncio as aioredis

    from app.sync import SYNC_LOCK_NAME, run

    settings = get_settings()
    monkeypatch.setattr(settings, "sync_run_timeout_seconds", 0.1)
    source = VersionedSource()

    async def blocked():
        await asyncio.sleep(10)

    source.fetch_all_events = blocked
    connection = aioredis.from_url(settings.redis_url)
    try:
        with pytest.raises(TimeoutError):
            await run(source=source, redis_client=connection)
        assert await connection.get(SYNC_LOCK_NAME) is None
        evidence = await db_session.scalar(select(SyncRun))
        assert evidence.status == "failed"
        assert evidence.failure_code == "CancelledError"
    finally:
        await connection.aclose()
