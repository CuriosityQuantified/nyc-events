# Automated source checks

The Railway `sync-worker` checks NYC Parks dataset metadata every five minutes.
Visitors read Postgres through our API; browser traffic never reaches Socrata.
An unchanged source produces an `unchanged` Sync Run and leaves event rows alone.
A changed revision, missing snapshot, explicit `--force`, or 24 hours since the
last full download triggers complete pagination and an atomic snapshot replacement.
Metadata is checked again before ingestion; a source revision change during
pagination rejects the download and keeps the previous complete snapshot.

The revision combines the query endpoint, `rowsUpdatedAt`, `viewLastModified`,
and `publicationDate` from `/api/views/{dataset}.json`. Missing or invalid metadata
fails the check instead of treating the source as unchanged. The daily download
is a backstop for missed metadata changes. This is a polling target, not a
guarantee that NYC publishes event changes immediately; the feed advertises daily updates.

`/freshness` distinguishes the last successful source check, the last full sync,
and the update timestamp supplied by NYC. Checks are overdue after 15 minutes.
`/ingestion-health/ready` returns 503 for overdue checks or a missing snapshot;
the independent **Monitor data freshness** GitHub workflow probes it every
15 minutes. Failed runs appear in GitHub Actions and follow the repository's
normal workflow notification settings. GitHub scheduling can be delayed.

Visible online browsers check our `/api/freshness` once per minute and when
returning from a hidden tab or offline state. A new snapshot refreshes the
explorer, map, event detail, Saved events and Matches. Background refresh failures retain
the displayed events. The freshness banner reports when it cannot verify data.

## Worker deployment and recovery

The worker's expected settings live in `backend/railway-sync.toml`. Deployment
applies them through Railway's `serviceInstanceUpdate` API and reads them back
before uploading. It also includes the file in the upload for compatibility,
but does not rely on Railway discovering it. Railway now restricts legacy Config
as Code to services that already used it; adding a file to this worker was ignored.
The older environment-edit path also returned success without persisting these
settings. Deployment manifests had null cron/start commands and ran the Docker
image's web server, while the old smoke test manually executed a sync over SSH.

The deployment gate now verifies the actual deployment manifest and observes
two automatic source checks carrying the expected deployment revision. It does
not invoke the worker to manufacture success. The backend release still forces
a full sync after migrations so parser changes take effect immediately.

If the monitor fails, inspect `/ingestion-health`, the worker's applied deployment
manifest, and Railway execution logs. Confirm the schedule is `*/5 * * * *`,
the start command is `.venv/bin/python -m app.sync`, and restart policy is `NEVER`.
The process must exit after each run. A 240-second deadline and 300-second Redis
lock lease bound runs; keep the lease longer than the deadline when overriding.
Failed checks retain the previous snapshot and are retried on the next schedule.
Socrata 429/transient errors have bounded backoff. A `Retry-After` over 60 seconds
persists a cooldown in Postgres; scheduled checks defer without contacting NYC
until it expires. A deferred check does not count as a successful freshness check.

To force a one-off refresh in the deployed backend container, use
`.venv/bin/python -m app.sync --force`. It uses the same distributed lock.
Never delete or truncate current events to recover a failed sync.

Configuration defaults: `SNAPSHOT_STALE_AFTER_SECONDS=900`,
`SYNC_FULL_REFRESH_SECONDS=86400`, `SYNC_RUN_TIMEOUT_SECONDS=240`,
`SYNC_LOCK_TIMEOUT_SECONDS=300`. Credentials remain in service variables;
`SOCRATA_APP_TOKEN` identifies the application for Socrata throttling.
