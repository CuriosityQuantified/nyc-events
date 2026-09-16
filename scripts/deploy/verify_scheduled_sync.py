#!/usr/bin/env python3
"""Prove the deployed worker config and two autonomous source checks."""

from __future__ import annotations

import argparse
import json
import subprocess
import time
import tomllib
import urllib.request
from datetime import datetime
from pathlib import Path


def verify_manifest(deployment: dict, expected: dict) -> None:
    actual = deployment.get("meta", {}).get("serviceManifest", {}).get("deploy", {})
    for key, value in expected.items():
        if actual.get(key) != value:
            raise ValueError(f"Worker deployment does not apply {key}={value!r}")


def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=15) as response:
        return json.load(response)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--service", required=True)
    parser.add_argument("--deployment", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--origin", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--timeout", type=int, default=1200)
    args = parser.parse_args()
    result = subprocess.run(
        [
            "railway",
            "deployment",
            "list",
            "--project",
            args.project,
            "--service",
            args.service,
            "--environment",
            "production",
            "--json",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    deployment = next(
        item for item in json.loads(result.stdout) if item["id"] == args.deployment
    )
    expected = tomllib.loads(Path(args.config).read_text())["deploy"]
    verify_manifest(deployment, expected)
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    (output / "applied-config.json").write_text(json.dumps(expected, indent=2) + "\n")
    deployed_at = datetime.fromisoformat(deployment["createdAt"].replace("Z", "+00:00"))
    deadline = time.monotonic() + args.timeout
    observed: list[dict] = []
    while time.monotonic() < deadline:
        health = fetch_json(args.origin.rstrip("/") + "/ingestion-health")
        if (
            health.get("status") in {"succeeded", "unchanged"}
            and health.get("deployment_revision") == args.revision
        ):
            started = datetime.fromisoformat(health["last_attempted_sync"])
            if started >= deployed_at and (
                not observed
                or started > datetime.fromisoformat(observed[-1]["last_finished_sync"])
            ):
                observed.append(health)
                (output / "scheduled-runs.json").write_text(
                    json.dumps(observed, indent=2) + "\n"
                )
                if len(observed) >= 2:
                    freshness = fetch_json(args.origin.rstrip("/") + "/freshness")
                    if (
                        freshness["is_stale"]["value"]
                        or not freshness["snapshot_row_count"]["value"]
                    ):
                        raise RuntimeError(
                            "Scheduled source checks did not preserve a fresh Snapshot"
                        )
                    (output / "freshness-after.json").write_text(
                        json.dumps(freshness, indent=2) + "\n"
                    )
                    print(
                        "Verified two autonomous checks from the exact worker revision"
                    )
                    return
        time.sleep(15)
    raise TimeoutError("Worker did not produce two autonomous source checks")


if __name__ == "__main__":
    main()
