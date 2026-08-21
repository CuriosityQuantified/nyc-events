"""Bounded Docker daemon availability probe used by CI test setup."""

from __future__ import annotations

import subprocess
import time
from collections.abc import Callable

Run = Callable[..., subprocess.CompletedProcess[bytes]]
Sleep = Callable[[float], None]


def probe_docker(
    *,
    attempts: int,
    retry_delay: float,
    run: Run = subprocess.run,
    sleep: Sleep = time.sleep,
) -> bool:
    """Return whether Docker answers within a bounded retry budget."""
    if attempts < 1:
        raise ValueError("attempts must be at least 1")

    for attempt in range(attempts):
        try:
            result = run(
                ["docker", "info"],
                capture_output=True,
                timeout=5,
            )
            if result.returncode == 0:
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass

        if attempt + 1 < attempts:
            sleep(retry_delay)

    return False
