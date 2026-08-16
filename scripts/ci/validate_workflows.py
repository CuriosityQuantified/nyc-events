#!/usr/bin/env python3
"""Fail-closed policy checks for the repository's GitHub workflows."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
CI_PATH = ROOT / ".github/workflows/ci.yml"
DEPLOY_PATH = ROOT / ".github/workflows/deploy-production.yml"
PROTECTED_JOBS = {"backend", "frontend", "graph", "secrets"}
DEPLOY_JOBS = {"deploy-backend", "deploy-frontend"}
TRUSTED_EVENTS = {"push", "workflow_dispatch"}
SHA_PIN = re.compile(r"^[^@]+@[0-9a-f]{40}$")


def load_workflow(path: Path) -> dict[str, Any]:
    value = yaml.load(path.read_text(encoding="utf-8"), Loader=yaml.BaseLoader)
    if not isinstance(value, dict):
        raise ValueError(f"{path} is not a workflow mapping")
    return value


def event_names(workflow: dict[str, Any]) -> set[str]:
    events = workflow.get("on", {})
    if isinstance(events, str):
        return {events}
    if isinstance(events, list):
        return set(events)
    if isinstance(events, dict):
        return set(events)
    return set()


def iter_steps(workflow: dict[str, Any]):
    for job_name, job in workflow.get("jobs", {}).items():
        for step in job.get("steps", []):
            yield job_name, step


def validate_workflows(ci: dict[str, Any], deploy: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    ci_jobs = ci.get("jobs", {})
    deploy_jobs = deploy.get("jobs", {})

    missing = PROTECTED_JOBS - set(ci_jobs)
    if missing:
        errors.append(f"protected job names missing: {sorted(missing)}")
    if "pull_request" not in event_names(ci):
        errors.append("CI must run for pull requests")
    if event_names(deploy) != TRUSTED_EVENTS:
        errors.append("production workflow may run only on push and workflow_dispatch")
    if "pull_request" in event_names(deploy):
        errors.append("production credentials must never enter pull-request code")
    missing_deploy = DEPLOY_JOBS - set(deploy_jobs)
    if missing_deploy:
        errors.append(f"full-stack deployment jobs missing: {sorted(missing_deploy)}")
    frontend_needs = deploy_jobs.get("deploy-frontend", {}).get("needs")
    if frontend_needs != "deploy-backend":
        errors.append("frontend deployment must wait for the backend deployment")

    for workflow_name, workflow in (("CI", ci), ("deployment", deploy)):
        if workflow.get("permissions") != {"contents": "read"}:
            errors.append(f"{workflow_name} must default to contents: read")
        if "continue-on-error" in str(workflow):
            errors.append(f"{workflow_name} contains continue-on-error")
        for job_name, job in workflow.get("jobs", {}).items():
            if "timeout-minutes" not in job:
                errors.append(f"{workflow_name} job {job_name} has no timeout")

    concurrency = ci.get("concurrency", {})
    if concurrency.get("cancel-in-progress") not in ("${{ github.event_name == 'pull_request' }}",):
        errors.append("CI may cancel only stale pull-request runs")
    deploy_concurrency = deploy.get("concurrency", {})
    if str(deploy_concurrency.get("cancel-in-progress", "")).lower() != "false":
        errors.append("production deployments must never cancel in progress")

    for job_name, job in deploy_jobs.items():
        if job.get("environment") != "production":
            errors.append(f"deployment job {job_name} must use the production environment")

    for job_name in DEPLOY_JOBS & set(deploy_jobs):
        job_text = str(deploy_jobs[job_name])
        for required in (
            "railway-v5.41.2-amd64.deb",
            "a66321d03f8970db2be727ca9b8861b6e55a788f81c5864ff367432b22a9d8e8",
        ):
            if required not in job_text:
                errors.append(f"deployment job {job_name} is missing {required}")

    for workflow_name, workflow in (("CI", ci), ("deployment", deploy)):
        for job_name, step in iter_steps(workflow):
            action = step.get("uses")
            if action and not SHA_PIN.match(action):
                errors.append(f"{workflow_name} {job_name} action is not SHA-pinned: {action}")

    for job_name, job in ci_jobs.items():
        if "secrets." in str(job):
            condition = str(job.get("if", ""))
            if "push" not in condition or "workflow_dispatch" not in condition:
                errors.append(f"CI job {job_name} can receive secrets outside trusted events")

    deploy_text = str(deploy)
    ci_text = str(ci)
    for job_name in ("backend", "frontend", "contract", "security"):
        if "GITHUB_STEP_SUMMARY" not in str(ci_jobs.get(job_name, {})):
            errors.append(f"CI job {job_name} has no human-readable summary")
    for required in (
        "coverage.xml",
        "playwright-report",
        "artifacts/contract",
    ):
        if required not in ci_text:
            errors.append(f"CI workflow is missing evidence or summary output: {required}")
    for required in (
        "EXPECTED_DEPLOY_REVISION",
        "BACKEND_PUBLIC_ORIGIN",
        "railway up backend --path-as-root",
        "railway up frontend --path-as-root",
        "test:production",
        "deploymentRollback",
        "playwright-production-report",
    ):
        if required not in deploy_text:
            errors.append(f"production workflow is missing {required}")
    return errors


def main() -> int:
    errors = validate_workflows(load_workflow(CI_PATH), load_workflow(DEPLOY_PATH))
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("workflow policy passed: protected names, trust boundaries, pins, timeouts, full-stack deploy and rollback")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
