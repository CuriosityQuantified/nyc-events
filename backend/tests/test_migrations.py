"""Migration regression gates for the Events schema."""

from __future__ import annotations

import subprocess
import sys
from uuid import uuid4

from sqlalchemy import text

from tests.conftest import requires_docker


def _alembic(*args: str) -> subprocess.CompletedProcess[str]:
    """Run Alembic exactly as the deployment pre-start gate does."""
    return subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        check=True,
        capture_output=True,
        text=True,
    )


@requires_docker
def test_events_migration_upgrade_and_idempotency(postgres_url):
    """Lifecycle migration must downgrade, upgrade, and re-upgrade cleanly."""
    try:
        _alembic("downgrade", "0001")
        _alembic("upgrade", "head")
        _alembic("upgrade", "head")
        current = _alembic("current")
        assert "0008 (head)" in current.stdout
    finally:
        _alembic("upgrade", "head")


def test_migration_history_has_exactly_one_head():
    """Parallel migration work must not leave an undeployable split head."""
    heads = [line for line in _alembic("heads").stdout.splitlines() if line.strip()]
    assert len(heads) == 1
    assert heads[0].endswith("(head)")


@requires_docker
async def test_profile_device_alias_schema_contract_and_cascade(db_session):
    """Migration 0008 enforces the alias key, index, FK, and cascade contract."""
    columns = (
        await db_session.execute(
            text(
                "SELECT column_name, character_maximum_length, is_nullable "
                "FROM information_schema.columns "
                "WHERE table_schema = 'public' "
                "AND table_name = 'profile_device_aliases'"
            )
        )
    ).all()
    by_name = {name: (width, nullable) for name, width, nullable in columns}
    assert by_name["device_token_hash"] == (64, "NO")
    assert by_name["profile_id"] == (None, "NO")

    indexes = (
        await db_session.execute(
            text(
                "SELECT indexname, indexdef FROM pg_indexes "
                "WHERE schemaname = 'public' "
                "AND tablename = 'profile_device_aliases'"
            )
        )
    ).all()
    index_definitions = {name: definition for name, definition in indexes}
    assert "(device_token_hash)" in index_definitions["profile_device_aliases_pkey"]
    assert "(profile_id)" in index_definitions["ix_profile_device_aliases_profile_id"]

    check_constraints = (
        await db_session.execute(
            text(
                "SELECT conname, pg_get_constraintdef(oid) "
                "FROM pg_constraint "
                "WHERE conrelid = 'profile_device_aliases'::regclass "
                "AND contype = 'c'"
            )
        )
    ).all()
    checks_by_name = {name: definition for name, definition in check_constraints}
    hash_length_check = checks_by_name["ck_profile_device_aliases_token_hash_length"]
    assert "char_length" in hash_length_check
    assert "= 64" in hash_length_check

    foreign_key = (
        await db_session.execute(
            text(
                "SELECT ccu.table_name, ccu.column_name, rc.delete_rule "
                "FROM information_schema.table_constraints AS tc "
                "JOIN information_schema.referential_constraints AS rc "
                "ON rc.constraint_schema = tc.constraint_schema "
                "AND rc.constraint_name = tc.constraint_name "
                "JOIN information_schema.constraint_column_usage AS ccu "
                "ON ccu.constraint_schema = rc.unique_constraint_schema "
                "AND ccu.constraint_name = rc.unique_constraint_name "
                "WHERE tc.table_schema = 'public' "
                "AND tc.table_name = 'profile_device_aliases' "
                "AND tc.constraint_type = 'FOREIGN KEY'"
            )
        )
    ).one()
    assert foreign_key == ("profiles", "id", "CASCADE")

    profile_id = uuid4()
    token_hash = "a" * 64
    await db_session.execute(
        text(
            "INSERT INTO profiles (id, device_token_hash) "
            "VALUES (:profile_id, :token_hash)"
        ),
        {"profile_id": profile_id, "token_hash": "b" * 64},
    )
    await db_session.execute(
        text(
            "INSERT INTO profile_device_aliases (device_token_hash, profile_id) "
            "VALUES (:token_hash, :profile_id)"
        ),
        {"token_hash": token_hash, "profile_id": profile_id},
    )
    await db_session.execute(
        text("DELETE FROM profiles WHERE id = :profile_id"),
        {"profile_id": profile_id},
    )
    remaining = await db_session.scalar(
        text(
            "SELECT count(*) FROM profile_device_aliases "
            "WHERE device_token_hash = :token_hash"
        ),
        {"token_hash": token_hash},
    )
    assert remaining == 0
