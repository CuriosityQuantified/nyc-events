from __future__ import annotations

import json
import sys
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from scripts.deploy.railway_release import (  # noqa: E402
    choose_origin,
    discover,
    deployment_records,
    exact_named,
    https_origin,
    parse_json_output,
    public_deployment,
    write_status_evidence,
)


class RailwayReleaseTests(unittest.TestCase):
    def test_parses_json_after_non_json_cli_notice(self) -> None:
        self.assertEqual(parse_json_output("notice\n{\"id\": \"one\"}\n"), {"id": "one"})

    def test_discovery_requires_one_exact_resource(self) -> None:
        projects = [{"id": "p1", "name": "nyc-events"}, {"id": "p2", "name": "other"}]
        self.assertEqual(exact_named(projects, "nyc-events", "project")["id"], "p1")
        with self.assertRaisesRegex(ValueError, "exactly one"):
            exact_named(projects + [{"id": "p3", "name": "nyc-events"}], "nyc-events", "project")

    def test_origin_must_be_https_and_owned_by_the_service(self) -> None:
        domains = {"eventmatch.nyc", "frontend.up.railway.app"}
        self.assertEqual(choose_origin(domains, "https://eventmatch.nyc"), "https://eventmatch.nyc")
        with self.assertRaisesRegex(ValueError, "https"):
            choose_origin(domains, "http://eventmatch.nyc")
        with self.assertRaisesRegex(ValueError, "not a Railway"):
            choose_origin(domains, "https://example.com")

    def test_origin_rejects_credentials_ports_paths_queries_and_fragments(self) -> None:
        for value in (
            "https://user@eventmatch.nyc",
            "https://eventmatch.nyc:443",
            "https://eventmatch.nyc/path",
            "https://eventmatch.nyc?query=1",
            "https://eventmatch.nyc#fragment",
        ):
            with (
                self.subTest(value=value),
                self.assertRaisesRegex(ValueError, "bare https"),
            ):
                https_origin(value)

    def test_ambiguous_origin_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "ambiguous"):
            choose_origin({"one.example", "two.example"}, None)

    def test_deployment_evidence_excludes_unapproved_metadata(self) -> None:
        raw = {
            "edges": [
                {
                    "node": {
                        "id": "deploy-1",
                        "status": "SUCCESS",
                        "createdAt": "2026-08-15T00:00:00Z",
                        "canRollback": True,
                        "meta": {"commitSha": "abc123", "variables": {"SECRET": "value"}},
                    }
                }
            ]
        }
        record = deployment_records(raw)[0]
        evidence = public_deployment(record)
        self.assertEqual(evidence["commitSha"], "abc123")
        self.assertNotIn("variables", json.dumps(evidence))

    def test_project_scoped_discovery_skips_account_project_listing(self) -> None:
        responses = [
            [{"id": "service-1", "name": "backend"}],
            [{"domain": "backend.example"}],
        ]
        args = Namespace(
            project_id="project-1",
            project_name=None,
            service_name="backend",
            environment="production",
            origin="https://backend.example",
            github_output=None,
            github_env=None,
            evidence_output=None,
        )
        with patch(
            "scripts.deploy.railway_release.run_json",
            side_effect=responses,
        ) as run:
            self.assertEqual(discover(args), 0)
        commands = [call.args[0] for call in run.call_args_list]
        self.assertNotIn(["railway", "list", "--json"], commands)
        self.assertEqual(commands[0][:4], ["railway", "service", "list", "--project"])
        self.assertEqual(commands[0][4], "project-1")

    def test_failure_evidence_is_sanitized_and_parent_is_created(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "nested" / "discover.json"
            write_status_evidence(str(path), "failed", "CalledProcessError")
            evidence = json.loads(path.read_text())
        self.assertEqual(
            evidence,
            {"status": "failed", "errorType": "CalledProcessError"},
        )
        self.assertNotIn("token", json.dumps(evidence).lower())


if __name__ == "__main__":
    unittest.main()
