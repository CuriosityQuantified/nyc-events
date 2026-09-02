from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from io import BytesIO
from argparse import Namespace
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from scripts.deploy.railway_release import (  # noqa: E402
    choose_origin,
    configure_sync_worker,
    discover,
    deployment_records,
    exact_named,
    fetch_revision,
    https_origin,
    parse_json_output,
    main,
    parser,
    public_deployment,
    verify_sync_worker_variables,
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

    def test_sync_worker_reconciliation_is_secret_free_and_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "sync.toml"
            config.write_text(
                """
[deploy]
startCommand = ".venv/bin/python -m app.sync"
cronSchedule = "0 */2 * * *"
restartPolicyType = "NEVER"
""".strip()
                + "\n"
            )
            args = Namespace(
                project_id="project-1",
                environment="production",
                service_name="sync-worker",
                backend_service="backend",
                config=str(config),
                github_output=None,
                github_env=None,
                evidence_output=None,
            )
            with (
                patch(
                    "scripts.deploy.railway_release.run_json",
                    return_value=[{"id": "sync-1", "name": "sync-worker"}],
                ),
                patch("scripts.deploy.railway_release.run_command") as run,
            ):
                self.assertEqual(configure_sync_worker(args), 0)

        config_command = run.call_args_list[0].args[0]
        variables_command = run.call_args_list[1].args[0]
        self.assertIn("deploy.cronSchedule", config_command)
        self.assertIn("0 */2 * * *", config_command)
        self.assertIn("DATABASE_URL=${{backend.DATABASE_URL}}", variables_command)
        self.assertIn("REDIS_URL=${{backend.REDIS_URL}}", variables_command)
        self.assertIn(
            "SOCRATA_API_KEY_SECRET=${{backend.SOCRATA_API_KEY_SECRET}}",
            variables_command,
        )
        self.assertIn("SOCRATA_APP_TOKEN=${{backend.SOCRATA_APP_TOKEN}}", variables_command)
        self.assertIn("VAPID_PRIVATE_KEY=${{backend.VAPID_PRIVATE_KEY}}", variables_command)
        self.assertIn("VAPID_PUBLIC_KEY=${{backend.VAPID_PUBLIC_KEY}}", variables_command)
        self.assertNotIn("secret-value", json.dumps(run.call_args_list))

    def test_worker_variable_evidence_requires_backend_redis_reference(self) -> None:
        required = {
            name: "${{backend." + name + "}}"
            for name in (
                "DATABASE_URL",
                "REDIS_URL",
                "SOCRATA_API_KEY_ID",
                "SOCRATA_API_KEY_SECRET",
                "SOCRATA_APP_TOKEN",
                "VAPID_PRIVATE_KEY",
                "VAPID_PUBLIC_KEY",
                "VAPID_SUBJECT",
            )
        }
        required["DEPLOY_REVISION"] = "revision-1"
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "variables.json"
            args = Namespace(
                project_id="project-1",
                environment="production",
                service="sync-1",
                backend_service="backend",
                expected_revision="revision-1",
                output=str(output),
            )
            with patch("scripts.deploy.railway_release.run_json", return_value=required):
                self.assertEqual(verify_sync_worker_variables(args), 0)
            evidence = json.loads(output.read_text())
        self.assertIn("REDIS_URL", evidence["requiredVariableNames"])
        self.assertIn("VAPID_PRIVATE_KEY", evidence["requiredVariableNames"])
        self.assertEqual(evidence["configuredServiceReference"], "backend")
        self.assertNotIn("values", evidence)

    def test_worker_variable_evidence_rejects_missing_redis_reference(self) -> None:
        variables = {
            "DATABASE_URL": "${{backend.DATABASE_URL}}",
            "SOCRATA_API_KEY_ID": "${{backend.SOCRATA_API_KEY_ID}}",
            "SOCRATA_API_KEY_SECRET": "${{backend.SOCRATA_API_KEY_SECRET}}",
            "SOCRATA_APP_TOKEN": "${{backend.SOCRATA_APP_TOKEN}}",
            "DEPLOY_REVISION": "revision-1",
        }
        args = Namespace(
            project_id="project-1",
            environment="production",
            service="sync-1",
            backend_service="backend",
            expected_revision="revision-1",
            output="unused.json",
        )
        with patch("scripts.deploy.railway_release.run_json", return_value=variables):
            with self.assertRaisesRegex(ValueError, "REDIS_URL"):
                verify_sync_worker_variables(args)


    def test_sync_worker_is_created_once_when_missing(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "sync.toml"
            config.write_text(
                "[deploy]\n"
                'startCommand = "sync"\n'
                'cronSchedule = "0 */2 * * *"\n'
                'restartPolicyType = "NEVER"\n'
            )
            args = Namespace(
                project_id="project-1",
                environment="production",
                service_name="sync-worker",
                backend_service="backend",
                config=str(config),
                github_output=None,
                github_env=None,
                evidence_output=None,
            )
            with (
                patch.dict(
                    os.environ,
                    {
                        "RAILWAY_TOKEN": "project-token",
                        "RAILWAY_API_TOKEN": "workspace-token",
                    },
                    clear=True,
                ),
                patch(
                    "scripts.deploy.railway_release.run_json",
                    side_effect=[[], [{"id": "sync-1", "name": "sync-worker"}]],
                ),
                patch("scripts.deploy.railway_release.run_command") as run,
            ):
                self.assertEqual(configure_sync_worker(args), 0)

        operations = [call.args[1] for call in run.call_args_list]
        self.assertEqual(operations.count("sync-project-link"), 1)
        self.assertEqual(operations.count("sync-service-create"), 1)
        self.assertEqual(operations.count("sync-service-configure"), 1)
        for creation_call in run.call_args_list[:2]:
            creation_environment = creation_call.kwargs["environment"]
            self.assertNotIn("RAILWAY_TOKEN", creation_environment)
            self.assertEqual(
                creation_environment["RAILWAY_API_TOKEN"],
                "workspace-token",
            )

    def test_failed_discovery_writes_actionable_sanitized_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "nested" / "discover.json"
            argv = [
                "railway_release.py",
                "discover",
                "--project-id",
                "project-1",
                "--service-name",
                "backend",
                "--environment",
                "production",
                "--evidence-output",
                str(path),
            ]
            error = subprocess.CalledProcessError(
                1,
                ["railway", "service", "list"],
                stderr="Unauthorized: token secret-value",
            )
            with (
                patch.object(sys, "argv", argv),
                patch("scripts.deploy.railway_release.subprocess.run", side_effect=error),
            ):
                self.assertEqual(main(), 1)
            evidence = json.loads(path.read_text())
        self.assertEqual(
            evidence,
            {
                "status": "failed",
                "errorType": "RailwayCommandError",
                "operation": "service-list",
                "returnCode": 1,
                "diagnostic": "unauthorized",
            },
        )
        self.assertNotIn("secret-value", json.dumps(evidence))

    def test_name_based_account_discovery_is_not_supported(self) -> None:
        with self.assertRaises(SystemExit):
            parser().parse_args(
                [
                    "discover",
                    "--project-name",
                    "nyc-events",
                    "--service-name",
                    "backend",
                    "--environment",
                    "production",
                ]
            )


    def test_revision_probe_uses_a_cloudflare_compatible_user_agent(self) -> None:
        class Response(BytesIO):
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                self.close()

        response = Response(b'{"revision":"revision-1"}')
        with patch(
            "scripts.deploy.railway_release.urllib.request.urlopen",
            return_value=response,
        ) as urlopen:
            self.assertEqual(fetch_revision("https://eventmatch.nyc"), "revision-1")
        request = urlopen.call_args.args[0]
        self.assertEqual(
            request.get_header("User-agent"),
            "EventMatch-Deployment-Probe/1.0",
        )


if __name__ == "__main__":
    unittest.main()
