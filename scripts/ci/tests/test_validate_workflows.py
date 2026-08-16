from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from scripts.ci.validate_workflows import (  # noqa: E402
    CI_PATH,
    DEPLOY_PATH,
    load_workflow,
    validate_workflows,
)


class WorkflowPolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.ci = load_workflow(CI_PATH)
        self.deploy = load_workflow(DEPLOY_PATH)

    def test_repository_workflows_pass_policy(self) -> None:
        self.assertEqual(validate_workflows(self.ci, self.deploy), [])

    def test_pull_request_deployment_is_rejected(self) -> None:
        broken = copy.deepcopy(self.deploy)
        broken["on"]["pull_request"] = None
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("only on push" in error for error in errors))

    def test_missing_protected_context_is_rejected(self) -> None:
        broken = copy.deepcopy(self.ci)
        del broken["jobs"]["graph"]
        errors = validate_workflows(broken, self.deploy)
        self.assertTrue(any("protected job names" in error for error in errors))

    def test_unpinned_action_and_allow_failure_are_rejected(self) -> None:
        broken = copy.deepcopy(self.ci)
        broken["jobs"]["backend"]["steps"][0]["uses"] = "actions/checkout@v4"
        broken["jobs"]["backend"]["steps"][0]["continue-on-error"] = "true"
        errors = validate_workflows(broken, self.deploy)
        self.assertTrue(any("not SHA-pinned" in error for error in errors))
        self.assertTrue(any("continue-on-error" in error for error in errors))

    def test_unpinned_railway_cli_is_rejected(self) -> None:
        broken = copy.deepcopy(self.deploy)
        install_step = broken["jobs"]["deploy-frontend"]["steps"][2]
        install_step["run"] = install_step["run"].replace(
            "a66321d03f8970db2be727ca9b8861b6e55a788f81c5864ff367432b22a9d8e8",
            "",
        )
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("a66321" in error for error in errors))

    def test_missing_backend_deployment_is_rejected(self) -> None:
        broken = copy.deepcopy(self.deploy)
        del broken["jobs"]["deploy-backend"]
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("deployment jobs missing" in error for error in errors))

    def test_frontend_must_wait_for_backend_cutover(self) -> None:
        broken = copy.deepcopy(self.deploy)
        del broken["jobs"]["deploy-frontend"]["needs"]
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("wait for the backend" in error for error in errors))

    def test_human_and_machine_readable_evidence_is_required(self) -> None:
        broken = copy.deepcopy(self.ci)
        for step in broken["jobs"]["backend"]["steps"]:
            if "run" in step:
                step["run"] = step["run"].replace("$GITHUB_STEP_SUMMARY", "$REMOVED_SUMMARY")
        errors = validate_workflows(broken, self.deploy)
        self.assertTrue(any("backend has no human-readable summary" in error for error in errors))

    def test_deployment_requires_project_scoped_railway_auth(self) -> None:
        broken = copy.deepcopy(self.deploy)
        backend = broken["jobs"]["deploy-backend"]
        backend["env"].pop("RAILWAY_TOKEN", None)
        backend["env"]["RAILWAY_API_TOKEN"] = "${{ secrets.RAILWAY_API_TOKEN }}"
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("project-scoped RAILWAY_TOKEN" in error for error in errors))

    def test_deployment_requires_configured_project_id(self) -> None:
        broken = copy.deepcopy(self.deploy)
        broken["jobs"]["deploy-backend"]["env"].pop("CONFIGURED_RAILWAY_PROJECT_ID", None)
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("RAILWAY_PROJECT_ID" in error for error in errors))

    def test_single_quoted_graphql_is_rejected(self) -> None:
        broken = copy.deepcopy(self.deploy)
        step = broken["jobs"]["deploy-backend"]["steps"][11]
        step["run"] += "\nrailway api 'mutation($id: String!) { deploymentRollback(id: $id) }'"
        errors = validate_workflows(self.ci, broken)
        self.assertTrue(any("single-quoted GraphQL" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
