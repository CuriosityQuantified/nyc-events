from __future__ import annotations

import os
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SMOKE = ROOT / "scripts/ci/backend_container_smoke.sh"


class BackendContainerSmokeTests(unittest.TestCase):
    def test_transient_postgres_readiness_does_not_escape_wait_loop(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            bin_dir = root / "bin"
            state = root / "state"
            evidence = root / "evidence"
            bin_dir.mkdir()
            state.mkdir()
            (state / "pg-count").write_text("0\n", encoding="utf-8")
            docker = bin_dir / "docker"
            docker.write_text(
                textwrap.dedent(
                    """\
                    #!/usr/bin/env bash
                    set -euo pipefail
                    state=${FAKE_DOCKER_STATE:?}
                    command=${1:-}
                    shift || true
                    case "$command" in
                      network|logs|rm) exit 0 ;;
                      run) exit 0 ;;
                      exec)
                        shift || true
                        if [[ "${1:-}" == pg_isready ]]; then
                          [[ "${FAKE_POSTGRES_NEVER_READY:-}" != true ]] || exit 2
                          count=$(<"$state/pg-count")
                          count=$((count + 1))
                          printf '%s\\n' "$count" > "$state/pg-count"
                          case "$count" in 1|3|4|5) exit 0 ;; *) exit 2 ;; esac
                        fi
                        if [[ "${1:-}" == redis-cli ]]; then
                          printf 'PONG\\n'
                          exit 0
                        fi
                        exit 0
                        ;;
                      build)
                        printf 'built\\n' > "$state/build"
                        exit 0
                        ;;
                      inspect) printf '{"State":{"Status":"running"}}\\n'; exit 0 ;;
                      *) exit 0 ;;
                    esac
                    """
                ),
                encoding="utf-8",
            )
            docker.chmod(0o755)
            curl = bin_dir / "curl"
            curl.write_text(
                textwrap.dedent(
                    """\
                    #!/usr/bin/env bash
                    set -euo pipefail
                    output=""
                    while (( $# )); do
                      if [[ "$1" == --output ]]; then output=$2; shift 2; else shift; fi
                    done
                    value='{"status":"healthy","database":"connected","redis":"connected"}'
                    if [[ -n "$output" ]]; then
                      printf '%s\\n' "$value" > "$output"
                    else
                      printf '%s\\n' "$value"
                    fi
                    """
                ),
                encoding="utf-8",
            )
            curl.chmod(0o755)
            env = os.environ | {
                "PATH": f"{bin_dir}:{os.environ['PATH']}",
                "FAKE_DOCKER_STATE": str(state),
                "EVIDENCE_DIR": str(evidence),
                "READINESS_INTERVAL_SECONDS": "0",
                "READINESS_MAX_PROBES": "8",
                "READINESS_STABLE_PROBES": "3",
            }
            result = subprocess.run(
                ["bash", str(SMOKE)],
                check=False,
                cwd=ROOT,
                env=env,
                capture_output=True,
                text=True,
                timeout=10,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((state / "build").exists())
            self.assertGreaterEqual(int((state / "pg-count").read_text()), 5)
            self.assertIn("readiness reset", (evidence / "readiness.log").read_text())

            (state / "build").unlink()
            failed_evidence = root / "failed-evidence"
            failed_env = env | {
                "EVIDENCE_DIR": str(failed_evidence),
                "FAKE_POSTGRES_NEVER_READY": "true",
                "READINESS_MAX_PROBES": "2",
            }
            failure = subprocess.run(
                ["bash", str(SMOKE)],
                check=False,
                cwd=ROOT,
                env=failed_env,
                capture_output=True,
                text=True,
                timeout=10,
            )

            self.assertEqual(failure.returncode, 1)
            self.assertFalse((state / "build").exists())
            self.assertIn("never reached 3 consecutive ready probes", failure.stderr)
            self.assertIn(
                "postgres=false", (failed_evidence / "readiness.log").read_text()
            )
            self.assertTrue((failed_evidence / "postgres-inspect.json").exists())
            self.assertTrue((failed_evidence / "redis-inspect.json").exists())


if __name__ == "__main__":
    unittest.main()
