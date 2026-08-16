"""Migration regression gates for the Events schema."""

from __future__ import annotations

import subprocess
import sys

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
    """Revision 0003 must downgrade, upgrade, and re-upgrade cleanly."""
    try:
        _alembic("downgrade", "0001")
        _alembic("upgrade", "head")
        _alembic("upgrade", "head")
        current = _alembic("current")
        assert "0003 (head)" in current.stdout
    finally:
        _alembic("upgrade", "head")


def test_migration_history_has_exactly_one_head():
    """Parallel migration work must not leave an undeployable split head."""
    heads = [line for line in _alembic("heads").stdout.splitlines() if line.strip()]
    assert len(heads) == 1
    assert heads[0].endswith("(head)")
