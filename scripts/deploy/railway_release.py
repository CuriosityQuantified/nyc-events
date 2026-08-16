#!/usr/bin/env python3
"""Deterministic Railway discovery and deployment evidence helpers."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

TERMINAL_FAILURES = {"FAILED", "CRASHED", "REMOVED", "SKIPPED"}


class RailwayCommandError(RuntimeError):
    def __init__(self, operation: str, return_code: int, diagnostic: str) -> None:
        self.operation = operation
        self.return_code = return_code
        self.diagnostic = diagnostic
        super().__init__(f"Railway {operation} failed ({diagnostic}, exit {return_code})")


def classify_cli_diagnostic(stderr: str | None) -> str:
    message = (stderr or "").lower()
    if "unauthorized" in message or "authentication" in message:
        return "unauthorized"
    if "forbidden" in message or "permission" in message or "access denied" in message:
        return "forbidden"
    if "not found" in message:
        return "not-found"
    return "command-failed"


def parse_json_output(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        for line in reversed(text.splitlines()):
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue
    raise ValueError("command produced no JSON")


def run_json(command: list[str], operation: str = "railway-command") -> Any:
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as error:
        raise RailwayCommandError(
            operation,
            error.returncode,
            classify_cli_diagnostic(error.stderr),
        ) from None
    return parse_json_output(result.stdout)


def named_records(value: Any) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    if isinstance(value, dict):
        if isinstance(value.get("id"), str) and isinstance(value.get("name"), str):
            records.append(value)
        for child in value.values():
            records.extend(named_records(child))
    elif isinstance(value, list):
        for child in value:
            records.extend(named_records(child))
    return records


def exact_named(value: Any, name: str, kind: str) -> dict[str, Any]:
    matches = [record for record in named_records(value) if record["name"] == name]
    unique = {record["id"]: record for record in matches}
    if len(unique) != 1:
        raise ValueError(f"expected exactly one Railway {kind} named {name!r}; found {len(unique)}")
    return next(iter(unique.values()))


def domain_names(value: Any) -> set[str]:
    domains: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"domain", "hostname"} and isinstance(child, str):
                domains.add(child.removeprefix("https://").rstrip("/"))
            else:
                domains.update(domain_names(child))
    elif isinstance(value, list):
        for child in value:
            domains.update(domain_names(child))
    return domains


def https_origin(value: str) -> str:
    """Return a canonical HTTPS origin with no credentials, port, or URL tail."""
    parsed = urllib.parse.urlparse(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.port is not None
        or parsed.path not in {"", "/"}
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("public origin must be a bare https origin")
    return f"https://{parsed.hostname}"


def choose_origin(domains: set[str], requested: str | None) -> str:
    if requested:
        origin = https_origin(requested)
        if urllib.parse.urlparse(origin).hostname not in domains:
            raise ValueError("configured public origin is not a Railway service domain")
        return origin
    if "eventmatch.nyc" in domains:
        return "https://eventmatch.nyc"
    if len(domains) != 1:
        raise ValueError(f"public origin is ambiguous; Railway reported {sorted(domains)}")
    return f"https://{next(iter(domains))}"


def deployment_records(value: Any) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    if isinstance(value, dict):
        if isinstance(value.get("id"), str) and isinstance(value.get("status"), str):
            records.append(value)
        for child in value.values():
            records.extend(deployment_records(child))
    elif isinstance(value, list):
        for child in value:
            records.extend(deployment_records(child))
    return records


def public_deployment(record: dict[str, Any]) -> dict[str, Any]:
    raw_meta = record.get("meta")
    meta: dict[str, Any] = raw_meta if isinstance(raw_meta, dict) else {}
    return {
        "id": record["id"],
        "status": record["status"],
        "createdAt": record.get("createdAt"),
        "canRollback": record.get("canRollback"),
        "commitSha": meta.get("commitSha"),
    }


def write_outputs(path: str | None, values: dict[str, str]) -> None:
    if not path:
        print(json.dumps(values, sort_keys=True))
        return
    with Path(path).open("a", encoding="utf-8") as handle:
        for key, value in values.items():
            if "\n" in value:
                raise ValueError(f"multiline GitHub output is forbidden: {key}")
            handle.write(f"{key}={value}\n")


def write_status_evidence(
    path: str | None,
    status: str,
    error: BaseException | None = None,
) -> None:
    if not path:
        return
    evidence: dict[str, Any] = {"status": status}
    if error:
        evidence["errorType"] = type(error).__name__
    if isinstance(error, RailwayCommandError):
        evidence.update(
            {
                "operation": error.operation,
                "returnCode": error.return_code,
                "diagnostic": error.diagnostic,
            }
        )
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")


def discover(args: argparse.Namespace) -> int:
    write_status_evidence(args.evidence_output, "started")
    services = run_json(
        ["railway", "service", "list", "--project", args.project_id, "--environment", args.environment, "--json"],
        "service-list",
    )
    service = exact_named(services, args.service_name, "service")
    domains = domain_names(
        run_json(
            [
                "railway",
                "domain",
                "list",
                "--project",
                args.project_id,
                "--environment",
                args.environment,
                "--service",
                service["id"],
                "--json",
            ],
            "domain-list",
        )
    )
    origin = choose_origin(domains, args.origin or None)
    write_outputs(
        args.github_output,
        {"project_id": args.project_id, "service_id": service["id"], "origin": origin},
    )
    write_outputs(
        args.github_env,
        {
            "RAILWAY_PROJECT_ID": args.project_id,
            "RAILWAY_SERVICE_ID": service["id"],
            "PUBLIC_ORIGIN": origin,
        },
    )
    write_status_evidence(args.evidence_output, "success")
    return 0


def deployment_command(args: argparse.Namespace) -> list[str]:
    return [
        "railway",
        "deployment",
        "list",
        "--project",
        args.project,
        "--environment",
        args.environment,
        "--service",
        args.service,
        "--limit",
        "50",
        "--json",
    ]


def snapshot(args: argparse.Namespace) -> int:
    records = deployment_records(run_json(deployment_command(args)))
    Path(args.output).write_text(json.dumps([public_deployment(item) for item in records], indent=2) + "\n")
    if args.github_output:
        previous = next((item for item in records if item["status"] == "SUCCESS"), None)
        write_outputs(args.github_output, {"previous_id": previous["id"] if previous else ""})
    if args.github_env:
        previous = next((item for item in records if item["status"] == "SUCCESS"), None)
        write_outputs(
            args.github_env,
            {"PREVIOUS_DEPLOYMENT_ID": previous["id"] if previous else ""},
        )
    return 0


def wait_deployment(args: argparse.Namespace) -> int:
    before = {item["id"] for item in json.loads(Path(args.before).read_text())}
    deadline = time.monotonic() + args.timeout
    selected: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        candidates = [item for item in deployment_records(run_json(deployment_command(args))) if item["id"] not in before]
        if candidates:
            candidates.sort(key=lambda item: str(item.get("createdAt", "")), reverse=True)
            selected = candidates[0]
            status = selected["status"]
            if status == "SUCCESS":
                Path(args.output).write_text(json.dumps(public_deployment(selected), indent=2) + "\n")
                write_outputs(args.github_output, {"deployment_id": selected["id"]})
                write_outputs(args.github_env, {"DEPLOYMENT_ID": selected["id"]})
                return 0
            if status in TERMINAL_FAILURES:
                raise RuntimeError(f"Railway deployment {selected['id']} ended in {status}")
        time.sleep(args.interval)
    selected_id = selected["id"] if selected else "not-created"
    raise TimeoutError(f"Railway deployment {selected_id} did not reach SUCCESS")


def fetch_revision(origin: str) -> str:
    request = urllib.request.Request(
        f"{https_origin(origin)}/api/revision",
        headers={
            "Accept": "application/json",
            "User-Agent": "EventMatch-Deployment-Probe/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status != 200:
            raise RuntimeError(f"revision endpoint returned HTTP {response.status}")
        value = json.load(response)
    revision = value.get("revision") if isinstance(value, dict) else None
    if not isinstance(revision, str):
        raise ValueError("revision endpoint returned no revision")
    return revision


def wait_revision(args: argparse.Namespace) -> int:
    deadline = time.monotonic() + args.timeout
    last = "unreachable"
    while time.monotonic() < deadline:
        try:
            last = fetch_revision(args.origin)
            if last == args.expected:
                evidence = {"origin": args.origin, "expected": args.expected, "observed": last}
                Path(args.output).write_text(json.dumps(evidence, indent=2) + "\n")
                return 0
        except (OSError, ValueError, RuntimeError, urllib.error.URLError) as error:
            last = type(error).__name__
        time.sleep(args.interval)
    raise TimeoutError(f"public origin did not cut over to {args.expected}; last observation: {last}")


def capture_revision(args: argparse.Namespace) -> int:
    try:
        revision = fetch_revision(args.origin)
    except (OSError, ValueError, RuntimeError, urllib.error.URLError):
        if not args.allow_missing:
            raise
        revision = ""
    write_outputs(args.github_output, {"revision": revision})
    write_outputs(args.github_env, {"PREVIOUS_REVISION": revision})
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser()
    commands = root.add_subparsers(dest="command", required=True)

    discover_parser = commands.add_parser("discover")
    discover_parser.add_argument("--project-id", required=True)
    discover_parser.add_argument("--service-name", required=True)
    discover_parser.add_argument("--environment", required=True)
    discover_parser.add_argument("--origin", default="")
    discover_parser.add_argument("--github-output")
    discover_parser.add_argument("--github-env")
    discover_parser.add_argument("--evidence-output")
    discover_parser.set_defaults(handler=discover)

    for name, handler in (("snapshot", snapshot), ("wait-deployment", wait_deployment)):
        command = commands.add_parser(name)
        command.add_argument("--project", required=True)
        command.add_argument("--service", required=True)
        command.add_argument("--environment", required=True)
        command.add_argument("--output", required=True)
        command.add_argument("--github-output")
        command.add_argument("--github-env")
        if name == "wait-deployment":
            command.add_argument("--before", required=True)
            command.add_argument("--timeout", type=int, default=1200)
            command.add_argument("--interval", type=int, default=10)
        command.set_defaults(handler=handler)

    revision = commands.add_parser("wait-revision")
    revision.add_argument("--origin", required=True)
    revision.add_argument("--expected", required=True)
    revision.add_argument("--output", required=True)
    revision.add_argument("--timeout", type=int, default=300)
    revision.add_argument("--interval", type=int, default=5)
    revision.set_defaults(handler=wait_revision)

    capture = commands.add_parser("capture-revision")
    capture.add_argument("--origin", required=True)
    capture.add_argument("--github-output")
    capture.add_argument("--github-env")
    capture.add_argument("--allow-missing", action="store_true")
    capture.set_defaults(handler=capture_revision)
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        return args.handler(args)
    except (OSError, subprocess.CalledProcessError, TimeoutError, ValueError, RuntimeError) as error:
        write_status_evidence(
            getattr(args, "evidence_output", None),
            "failed",
            error,
        )
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
