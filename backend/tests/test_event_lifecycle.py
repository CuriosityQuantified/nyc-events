"""Issue #16 executable API gates for Event lifecycle classification."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from tests.conftest import ingest_rows, load_fixture, requires_docker


async def _changes(client, classification: str | None = None):
    params = {"classification": classification} if classification else None
    response = await client.get("/event-changes", params=params)
    assert response.status_code == 200
    return response.json()


@requires_docker
async def test_committed_snapshots_classify_new_changed_and_unchanged_through_api(
    client, db_session
):
    snapshot_a = load_fixture("snapshot_a.json")
    snapshot_b = load_fixture("snapshot_b.json")

    await ingest_rows(db_session, snapshot_a)
    first = await _changes(client)

    assert first["snapshot_at"] is not None
    assert first["total"] == len(snapshot_a)
    assert {item["classification"] for item in first["events"]} == {"new"}
    assert all(len(item["content_hash"]) == 64 for item in first["events"])
    assert all(
        set(item["content_hash"]) <= set("0123456789abcdef") for item in first["events"]
    )

    await ingest_rows(db_session, snapshot_b)

    assert {item["guid"] for item in (await _changes(client, "new"))["events"]} == {
        "2,098,303"
    }
    assert {item["guid"] for item in (await _changes(client, "changed"))["events"]} == {
        "2,181,767"
    }
    assert {
        item["guid"] for item in (await _changes(client, "unchanged"))["events"]
    } == {"2,146,733", "2,095,486"}


@requires_docker
async def test_content_hash_is_stable_for_key_order_and_changes_with_content(
    client, db_session
):
    row = load_fixture("snapshot_a.json")[0]
    await ingest_rows(db_session, [row])
    original = (await _changes(client))["events"][0]["content_hash"]

    reordered = dict(reversed(list(row.items())))
    await ingest_rows(db_session, [reordered])
    unchanged = (await _changes(client))["events"][0]
    assert unchanged["classification"] == "unchanged"
    assert unchanged["content_hash"] == original

    await ingest_rows(db_session, [dict(row, title="A source edit")])
    changed = (await _changes(client))["events"][0]
    assert changed["classification"] == "changed"
    assert changed["content_hash"] != original


@requires_docker
async def test_explicit_cancellation_surfaces_without_word_inference(
    client, db_session
):
    row = load_fixture("snapshot_a.json")[0]
    await ingest_rows(db_session, [row])

    explicit = dict(row, status="cancelled")
    await ingest_rows(db_session, [explicit])
    cancelled = await _changes(client, "cancelled")
    assert cancelled["events"] == [
        {
            "guid": row["guid"],
            "classification": "cancelled",
            "content_hash": cancelled["events"][0]["content_hash"],
            "official_event_url": row["link"],
        }
    ]
    assert (await client.get(f"/events/{row['guid']}")).status_code == 200

    replacement = dict(row, guid="replacement-16", title="Replacement Event")
    await ingest_rows(db_session, [replacement])
    assert {
        item["guid"] for item in (await _changes(client, "cancelled"))["events"]
    } == {row["guid"]}

    not_cancelled = dict(
        row,
        description="Cancellation rules are listed; this Event is not canceled.",
    )
    await ingest_rows(db_session, [not_cancelled])
    assert (await _changes(client, "cancelled"))["events"] == []
    assert (await _changes(client, "changed"))["events"][0]["guid"] == row["guid"]


@requires_docker
async def test_generated_api_schema_documents_lifecycle_contract(client):
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    operation = response.json()["paths"]["/event-changes"]["get"]
    classification = next(
        parameter
        for parameter in operation["parameters"]
        if parameter["name"] == "classification"
    )
    assert set(classification["schema"]["anyOf"][0]["enum"]) == {
        "new",
        "changed",
        "unchanged",
        "cancelled",
        "expired",
        "removed",
    }


@requires_docker
async def test_absence_is_expired_or_removed_and_never_cancelled(client, db_session):
    today = datetime.now(UTC).date()
    template = load_fixture("snapshot_a.json")[0]
    expired = dict(
        template,
        guid="expired-16",
        title="Past Event",
        startdate=(today - timedelta(days=2)).strftime("%m/%d/%Y"),
        enddate=(today - timedelta(days=1)).strftime("%m/%d/%Y"),
        starttime=None,
        endtime=None,
    )
    removed = dict(
        template,
        guid="removed-16",
        title="Future Event",
        startdate=(today + timedelta(days=5)).strftime("%m/%d/%Y"),
        enddate=(today + timedelta(days=5)).strftime("%m/%d/%Y"),
        starttime=None,
        endtime=None,
    )
    retained = dict(template, guid="retained-16", title="Retained Event")

    await ingest_rows(db_session, [expired, removed, retained])
    await ingest_rows(db_session, [retained])

    changes = {item["guid"]: item for item in (await _changes(client))["events"]}
    assert changes["expired-16"]["classification"] == "expired"
    assert changes["removed-16"]["classification"] == "removed"
    assert changes["retained-16"]["classification"] == "unchanged"
    assert (await _changes(client, "cancelled"))["events"] == []
    assert (await client.get("/events/expired-16")).status_code == 404
    assert (await client.get("/events/removed-16")).status_code == 404


@requires_docker
async def test_lifecycle_api_rejects_unknown_filters_and_enforces_page_bounds(
    client, db_session
):
    await ingest_rows(db_session, load_fixture("snapshot_a.json"))

    assert (
        await client.get("/event-changes", params={"classification": "missing"})
    ).status_code == 422
    assert (
        await client.get("/event-changes", params={"page_size": 101})
    ).status_code == 422
    page = await client.get("/event-changes", params={"page_size": 1, "page": 2})
    assert page.status_code == 200
    assert page.json()["total"] == 3
    assert len(page.json()["events"]) == 1
