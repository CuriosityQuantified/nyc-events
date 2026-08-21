"""Regression tests for the fail-closed Docker availability probe."""

from __future__ import annotations

import subprocess
import unittest

from backend.tests.docker_probe import probe_docker


class DockerProbeTests(unittest.TestCase):
    def test_retries_a_transient_daemon_failure(self) -> None:
        attempts: list[int] = []
        sleeps: list[float] = []

        def run(*_args, **_kwargs) -> subprocess.CompletedProcess[bytes]:
            attempts.append(1)
            return subprocess.CompletedProcess(
                args=["docker", "info"],
                returncode=1 if len(attempts) == 1 else 0,
            )

        self.assertTrue(
            probe_docker(
                attempts=3,
                retry_delay=0.25,
                run=run,
                sleep=sleeps.append,
            )
        )
        self.assertEqual(len(attempts), 2)
        self.assertEqual(sleeps, [0.25])

    def test_fails_after_the_bounded_retry_budget(self) -> None:
        attempts: list[int] = []
        sleeps: list[float] = []

        def run(*_args, **_kwargs) -> subprocess.CompletedProcess[bytes]:
            attempts.append(1)
            return subprocess.CompletedProcess(args=["docker", "info"], returncode=1)

        self.assertFalse(
            probe_docker(
                attempts=3,
                retry_delay=0.25,
                run=run,
                sleep=sleeps.append,
            )
        )
        self.assertEqual(len(attempts), 3)
        self.assertEqual(sleeps, [0.25, 0.25])


if __name__ == "__main__":
    unittest.main()
