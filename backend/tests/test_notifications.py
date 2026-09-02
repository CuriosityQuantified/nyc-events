"""Issue #25 notification and Web Push full-stack backend regressions."""

from __future__ import annotations

from uuid import UUID

import pytest
from sqlalchemy import func, select

from app.models.profile import Interest, Notification, Profile, PushSubscription
from app.routes.profiles import _merge_profiles
from app.services.notifications import DeliveryResult, dispatch_push_notifications
from app.services.profile_preferences import (
    apply_concierge_preference,
    set_manual_interest,
)
from tests.conftest import ingest_rows, load_fixture, requires_docker

DEVICE_TOKEN = "device-token-25-abcdefghijklmnopqrstuvwxyz_123456"
OTHER_TOKEN = "other-device-25-abcdefghijklmnopqrstuvwxyz_123456"


def headers(token: str = DEVICE_TOKEN) -> dict[str, str]:
    return {"X-Device-Token": token}


class FakeRedis:
    def __init__(self) -> None:
        self.values: set[str] = set()

    async def set(self, key: str, value: str, *, nx: bool = False):
        if nx and key in self.values:
            return None
        self.values.add(key)
        return True

    async def delete(self, key: str) -> None:
        self.values.discard(key)


class FakeTransport:
    def __init__(self, result: DeliveryResult = DeliveryResult.DELIVERED) -> None:
        self.result = result
        self.messages = []

    async def send(self, subscription, message):
        self.messages.append((subscription, message))
        return self.result


@requires_docker
async def test_match_creates_one_in_app_notification_with_one_step_event_url(
    client, db_session
):
    rows = load_fixture("snapshot_a.json")
    for category in ("Fitness", "Adult Fitness"):
        response = await client.put(
            "/profile/interests",
            headers=headers(),
            json={"facet_type": "category", "facet_value": category},
        )
        assert response.status_code == 200

    await ingest_rows(db_session, rows)
    response = await client.get("/profile/notifications", headers=headers())

    assert response.status_code == 200
    matching = [
        item
        for item in response.json()["notifications"]
        if item["event_guid"] == rows[0]["guid"]
    ]
    assert len(matching) == 1
    assert matching[0]["url"] == f"/events/{rows[0]['guid']}"
    assert await db_session.scalar(select(func.count()).select_from(Notification)) == 1


@requires_docker
async def test_nonapproved_concierge_decisions_create_no_notification(
    client, db_session
):
    profile_response = await client.get("/profile", headers=headers())
    profile_id = UUID(profile_response.json()["id"])
    for decision in (
        "proposed",
        "edited_unapproved",
        "rejected",
        "cancelled",
        "timed_out",
    ):
        assert (
            await apply_concierge_preference(
                db_session,
                profile_id=profile_id,
                facet_type="category",
                facet_value="Fitness",
                alert_enabled=True,
                decision=decision,
                idempotency_key=f"issue-25-{decision}-decision",
            )
            is None
        )
    await ingest_rows(db_session, load_fixture("snapshot_a.json"))
    assert await db_session.scalar(select(func.count()).select_from(Notification)) == 0


@requires_docker
async def test_manual_and_approved_concierge_preferences_share_notification_pipeline(
    client, db_session
):
    manual_profile = Profile(device_token_hash="1" * 64)
    concierge_profile = Profile(device_token_hash="2" * 64)
    db_session.add_all([manual_profile, concierge_profile])
    await db_session.flush()
    await set_manual_interest(
        db_session,
        profile_id=manual_profile.id,
        facet_type="category",
        facet_value="Fitness",
        alert_enabled=True,
    )
    first = await apply_concierge_preference(
        db_session,
        profile_id=concierge_profile.id,
        facet_type="category",
        facet_value="Fitness",
        alert_enabled=True,
        decision="approved",
        idempotency_key="approved-preference-25",
    )
    replay = await apply_concierge_preference(
        db_session,
        profile_id=concierge_profile.id,
        facet_type="category",
        facet_value="Fitness",
        alert_enabled=True,
        decision="approved",
        idempotency_key="approved-preference-25",
    )
    assert replay is first
    manual_profile_id = manual_profile.id
    concierge_profile_id = concierge_profile.id

    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    notifications = (
        await db_session.scalars(select(Notification).order_by(Notification.profile_id))
    ).all()

    assert len(notifications) == 2
    assert {item.profile_id for item in notifications} == {
        manual_profile_id,
        concierge_profile_id,
    }
    assert {item.event_guid for item in notifications} == {rows[0]["guid"]}
    assert all(item.push_enabled for item in notifications)


@requires_docker
async def test_push_consent_is_profile_owned_and_opt_out_keeps_interests(
    client, db_session
):
    await client.put(
        "/profile/interests",
        headers=headers(),
        json={"facet_type": "borough", "facet_value": "Queens"},
    )
    payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/subscription-25",
        "keys": {"p256dh": "p" * 32, "auth": "a" * 16},
    }
    enabled = await client.put(
        "/profile/push-subscription", headers=headers(), json=payload
    )
    stolen = await client.put(
        "/profile/push-subscription", headers=headers(OTHER_TOKEN), json=payload
    )
    disabled = await client.delete("/profile/push-subscription", headers=headers())

    assert enabled.json() == {"enabled": True}
    assert stolen.status_code == 409
    assert disabled.status_code == 204
    assert await db_session.scalar(select(func.count()).select_from(Interest)) == 1
    assert (
        await db_session.scalar(select(func.count()).select_from(PushSubscription)) == 0
    )


@requires_docker
async def test_push_transport_is_injected_deduplicated_and_handles_expiry(
    client, db_session
):
    rows = load_fixture("snapshot_a.json")
    await client.put(
        "/profile/interests",
        headers=headers(),
        json={"facet_type": "category", "facet_value": "Fitness"},
    )
    await ingest_rows(db_session, rows)
    profile = await db_session.scalar(select(Profile))
    assert profile is not None
    db_session.add(
        PushSubscription(
            profile_id=profile.id,
            endpoint="https://fcm.googleapis.com/fcm/send/dedup-25",
            p256dh="p" * 32,
            auth="a" * 16,
        )
    )
    await db_session.commit()

    redis = FakeRedis()
    transport = FakeTransport()
    assert await dispatch_push_notifications(db_session, redis, transport) == 1
    notification = await db_session.scalar(select(Notification))
    assert notification is not None
    notification.pushed_at = None
    await db_session.flush()
    assert await dispatch_push_notifications(db_session, redis, transport) == 0
    assert len(transport.messages) == 1

    await db_session.execute(select(Notification))
    notification.pushed_at = None
    await redis.delete(f"nyc-events:push:{profile.id}:{rows[0]['guid']}")
    expired = FakeTransport(DeliveryResult.EXPIRED)
    assert await dispatch_push_notifications(db_session, redis, expired) == 0
    assert (
        await db_session.scalar(select(func.count()).select_from(PushSubscription)) == 0
    )


@pytest.mark.parametrize(
    "endpoint",
    [
        "http://fcm.googleapis.com/sub",
        "https://127.0.0.1/sub",
        "https://[::1]/sub",
        "https://fcm.googleapis.com.attacker.test/sub",
        "https://fcm.googleapis.com:8443/sub",
        "https://push.example.test/sub",
    ],
)
@requires_docker
async def test_push_endpoint_rejects_insecure_or_private_targets(client, endpoint):
    response = await client.put(
        "/profile/push-subscription",
        headers=headers(),
        json={
            "endpoint": endpoint,
            "keys": {"p256dh": "p" * 32, "auth": "a" * 16},
        },
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    "endpoint",
    [
        "https://fcm.googleapis.com/fcm/send/sub",
        "https://updates.push.services.mozilla.com/wpush/v2/sub",
        "https://web.push.apple.com/Q/sub",
        "https://wns2-db5p.notify.windows.com/w/?token=sub",
    ],
)
@requires_docker
async def test_push_endpoint_accepts_known_browser_push_services(client, endpoint):
    response = await client.put(
        "/profile/push-subscription",
        headers=headers(),
        json={
            "endpoint": endpoint,
            "keys": {"p256dh": "p" * 32, "auth": "a" * 16},
        },
    )
    assert response.status_code == 200


@requires_docker
async def test_profile_claim_merge_preserves_and_deduplicates_push_state(db_session):
    source = Profile(device_token_hash="3" * 64)
    target = Profile(device_token_hash="4" * 64)
    db_session.add_all([source, target])
    await db_session.flush()
    source_id, target_id = source.id, target.id
    rows = load_fixture("snapshot_a.json")
    await ingest_rows(db_session, rows)
    event_guid = rows[0]["guid"]
    db_session.add_all(
        [
            Notification(
                profile_id=source_id, event_guid=event_guid, push_enabled=True
            ),
            Notification(
                profile_id=target_id, event_guid=event_guid, push_enabled=False
            ),
            PushSubscription(
                profile_id=source_id,
                endpoint="https://fcm.googleapis.com/fcm/send/merge-25",
                p256dh="p" * 32,
                auth="a" * 16,
            ),
        ]
    )
    await db_session.flush()

    await _merge_profiles(db_session, source_id=source_id, target_id=target_id)
    await db_session.flush()

    notifications = (
        await db_session.scalars(
            select(Notification).where(Notification.profile_id == target_id)
        )
    ).all()
    subscription = await db_session.scalar(select(PushSubscription))
    assert len(notifications) == 1
    assert notifications[0].push_enabled is True
    assert subscription is not None
    assert subscription.profile_id == target_id
