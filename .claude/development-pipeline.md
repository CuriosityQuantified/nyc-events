# Development pipeline — nyc-events

Repo-local companion to the `autonomous-issue-worker` skill (§2 issue selection,
§5 agent briefs, §6 gate suite). This file is the authority for **this**
repository's environment, gate commands, CI state, and issue map. The global
skill carries the process; this file carries the project facts.

Keep it here, not in `~/.claude/skills/` — a user-level skill is shared by every
project, so per-repo commands do not belong in it.

Last verified: 2026-08-15.

---

## Identity

- **Main/coordinator path**: `/Users/halgorithm/workspaces/AI/nyc-events-repo`
  (remote `https://github.com/CuriosityQuantified/nyc-events`, private, `main`).
- **Backend worktree**: `/Users/halgorithm/workspaces/AI/nyc-events-backend`
  on persistent branch `backend`.
- **Frontend worktree**: `/Users/halgorithm/workspaces/AI/nyc-events-frontend`
  on persistent branch `frontend`.
- **Commit identity**: `CuriosityQuantified <curiosityquantified@gmail.com>`.

## Current state — NO application code yet

The repo contains only specification and design artifacts:

- `HANDOFF.md` — product concept, NYC Parks "Upcoming 14 Days" data source,
  sync/ingestion requirements. Binds as the project spec.
- `frontend/` — all frontend artifacts, consolidated here 2026-08-15:
  - `frontend/FRONTEND_CONCEPT.md` — consensus frontend direction (mobile-first,
    list-first explorer with optional map, grounded NL search, explicit unknown
    states, official-detail handoffs).
  - `frontend/nyc-events-mvp-v2.html` — Open Design export, primary entry;
    `frontend/nyc-events-mvp.html` is the second screen and
    `frontend/nyc-events-mvp-preview.png` the render.
  - `frontend/DESIGN-HANDOFF.md` and `frontend/DESIGN-MANIFEST.json` define
    tokens, responsive matrix, and the screen/module map.

  **These are sketches, not a contract** (`docs/adr/0007`). Their visual
  direction carries forward — colour, type hierarchy, card layout, the List/Map
  toggle, bottom navigation. Their markup and hand-rolled state machine do not.
  `DESIGN-MANIFEST.json` asserts "Preserve visual hierarchy, responsive behavior,
  and interactive states" and a one-file-per-screen policy; that clause is
  **overridden** and must not be treated as binding. It was emitted by a design
  export tool, not authored as a decision.

  The original `nyc-events-frontend-prototype.zip` was removed once its five
  files were confirmed byte-identical to the tracked copies above.

## Stack — decided 2026-08-15

Chosen in a `/grill-with-docs` session; each decision has an ADR in `docs/adr/`.
`CONTEXT.md` at the repo root is the glossary and binds terminology in code,
issues, and PRs.

- **Backend**: Python FastAPI, `uv`, Alembic. **Frontend**: Next.js. Separate
  deployables (`0001`).
- **Hosting**: Railway — Postgres, Redis, API service, sync worker (`0003`).
  Cloudflare is DNS/CDN/R2 only; it sells no managed Postgres.
- **Auth**: Clerk, over anonymous device profiles that may be claimed (`0004`).
- **Concierge**: `deepagents` inside FastAPI, two tools, no interpreter (`0008`),
  on OpenRouter `nvidia/nemotron-3.5-lightning:free` with
  `deepseek/deepseek-v4-flash-0731` as fallback.

## Gate commands

- **Env**: not yet provisioned in-tree. No `backend/`, no `frontend/package.json`,
  no lockfile. The stack above is decided but uncreated — the scaffold issues
  stand it up.
- **Unit tests**: `cd backend && uv run pytest -v`. **No test may reach the
  network** (`docs/adr/0005`); fixtures live in `backend/tests/fixtures/`.
- **Build**: `cd frontend && npm run build`.
- **Regressions**: Playwright MCP UAT, from the first UI issue onward, at both a
  phone and a desktop viewport.

## Code graph

graphify 0.9.43, installed 2026-08-15 via `uv tool install "graphifyy[mcp]"`
(PyPI package is **`graphifyy`**, double-y; the CLI is `graphify`, at
`~/.local/bin/graphify`). Rebuild with `graphify update .` (AST-only, no LLM, no
API cost); stage `graphify-out/` with the commit. The required `graph` CI job
rebuilds with graphify 0.9.43 and fails on any tracked-output drift.

- **Freshness gate — do NOT compare `GRAPH_REPORT.md`'s `Built from commit:`
  line to `git rev-parse HEAD`.** graphify deliberately leaves outputs untouched
  when a rebuild finds no topology change ("No code-graph topology changes
  detected; outputs left untouched"), so that line legitimately lags HEAD after
  any commit that does not alter graph structure. Comparing them produces false
  staleness failures. The correct gate is: run `graphify update .`, then
  `git diff --exit-code graphify-out/graph.json` — a non-empty diff means the
  graph was stale and must be staged.
- Baseline 2026-08-15: 77 nodes, 100% EXTRACTED (69 before this file was added —
  the count tracks the spec/design corpus, so it moves whenever docs land).
- Committed: `graph.json`, `graph.html`, `GRAPH_REPORT.md`, and the
  `.graphify_labels.json*` / `.graphify_root` files. Gitignored:
  `graphify-out/cache/`, dated backups (`graphify-out/YYYY-MM-DD/`), and
  `graphify-out/manifest.json` — the manifest is a local scan cache storing
  per-file `mtime`/`seen` timestamps that change on every rebuild regardless of
  content, so committing it both churns and carries machine-specific mtimes
  across clones.
- The issue-worker skill-suite source was briefly checked out inside this repo
  and made up **68.5% of all graph nodes** (146 of 213) — the god-node list
  described the skill suite instead of the project. It was gitignored, then
  relocated out of the repo to
  `~/.claude/skill-sources/claude-code-issue-worker-skill-suite/`; the ignore
  entry is gone because the directory is. If a future graph's communities start
  naming skills or harnesses, find the vendored tooling and move it out before
  trusting any graph conclusion.
- Git hooks installed (`graphify hook install`): post-commit and post-checkout
  rebuild the graph, plus a `merge=graphify` union merge driver for
  `graphify-out/graph.json` (declared in `.gitattributes`).
- Claude Code integration installed (`graphify claude install`, nudge mode): repo
  `CLAUDE.md` graphify section is committed; the PreToolUse hook lives in the
  gitignored `.claude/settings.local.json` because graphify's generated hook
  embeds an absolute interpreter path that would break other clones. Each machine
  re-runs `graphify claude install` itself.
- MCP: the `graphify-mcp` stdio server ships with the `[mcp]` extra. Always pass
  `project_path` on every `mcp__graphify__*` call — see the skill's
  `references/graphify-mcp-project-path.md` and `references/graphify-setup.md`.

## CI

`.github/workflows/ci.yml` defines five jobs. The protected PR job names are
`backend`, `frontend`, `graph`, and `secrets`; renaming one silently removes a
required check unless branch protection is updated too.

- `configuration` — on trusted `main` pushes and manual dispatches only, maps
  every repository secret explicitly and fails on an empty value without
  checkout, dependency execution, or value disclosure. It never receives a PR.
- `backend` — validates the shared contract/mock, then runs `uv sync --frozen`
  and `uv run pytest -v` in `backend/` when that scaffold exists.
- `frontend` — `npm ci`, `npm test --if-present`, `npm run build` in `frontend/`.
- `graph` — rebuilds graphify and fails if any tracked knowledge-graph output drifts.
- `secrets` — fails if `.env` is tracked or a Socrata credential is hardcoded.

Broad repository credentials are not passed to application tests or package
install steps. Integration tickets must inject only their smallest required
subset into a narrow trusted step. `GCP_API_KEY` is not automatically treated
as `GOOGLE_MAPS_BROWSER_API_KEY`; the latter must remain a dedicated,
HTTP-referrer-restricted Maps JavaScript API browser credential.

`backend` and `frontend` each begin with a probe step and **pass trivially when
their directory does not yet exist**. This is deliberate: protection is enabled
on `main` before the code exists, so without the probe the PR that first creates
`backend/` would be blocked by the absence of the thing it is creating. The
checks start enforcing the moment there is something to run.

Playwright UAT is not in the gate yet. It joins with the first UI issue, per
`CLAUDE.md`'s completion requirement — there is nothing to drive before then.

**Branch protection status**: enabled on `main`. Pull requests are required and
the strict required contexts are `backend`, `frontend`, `graph`, and `secrets`.
Missing, skipped, cancelled, or stale-head checks are not green.

## Parallel development lanes

Work runs as **two concurrent agent sessions in separate git worktrees** off this
repository. See `docs/adr/0009-issues-carry-a-lane-label.md` for the decision;
this section is the operational detail.

### Claiming work

Every issue carries exactly one of three labels. A session claims only its own:

| Label | Tree it may touch | Concurrency |
|---|---|---|
| `backend` | `backend/` | runs alongside `frontend` |
| `frontend` | `frontend/` | runs alongside `backend` |
| `fullstack` | both | **serializes — nothing else in flight** |

An unlabelled issue is not claimable. Label it first, or hand off.

Only issues numbered **#6 or higher** are in the autonomous queue. #5 is the
umbrella spec and #2/#3 are legacy requests superseded by the numbered delivery
sequence. A worker also requires `ready-for-agent`, verifies every issue under
`## Blocked by` is closed, and adds `in-progress` before implementation.

Three isolated cron workers enforce this routing:

| Worker | Job ID | Schedule | Checkout |
|---|---|---|---|
| Fullstack | `eccd0c5aebdf` | `10 0,4,8,12,16,20 * * *` | coordinator creates a throwaway worktree |
| Backend | `045d186768ad` | `40 0,4,8,12,16,20 * * *` | persistent `backend` worktree |
| Frontend | `f042c1b2752c` | `10 1,5,9,13,17,21 * * *` | persistent `frontend` worktree |

The fullstack worker runs first in each cycle. Backend/frontend workers refuse
new claims while a fullstack issue is `in-progress`; the fullstack worker refuses
claims while any issue/PR or lane-ahead work exists. Every worker owns a separate
Claude Code process, session, task/result files, and checkout.

### Worktree setup

```bash
git worktree add /Users/halgorithm/workspaces/AI/nyc-events-backend  backend
git worktree add /Users/halgorithm/workspaces/AI/nyc-events-frontend frontend
```

`backend` and `frontend` are long-lived lane branches, not per-ticket feature
branches. Each lane handles one issue and one PR at a time. A lane PR must use a
**merge commit** through the GitHub REST endpoint (`gh api -X PUT
repos/CuriosityQuantified/nyc-events/pulls/<PR>/merge -f merge_method=merge`) and
must not delete, squash, rebase, or force-push the persistent branch. Do not run
`gh pr merge` from a lane worktree: it tries to check out `main`, which is held by
the coordinator worktree. After merge, that worktree fetches and runs `git merge
--ff-only origin/main`, then pushes the aligned lane branch before claiming
another issue. A non-fast-forward is a blocker requiring review.

`fullstack` uses neither persistent lane branch. For each fullstack issue, create
`feat/<issue>-<slug>` from `origin/main` in a temporary
`/Users/halgorithm/workspaces/AI/nyc-events-fullstack-<issue>` worktree. It may
start only when no lane issue or PR is in flight. After green CI, squash-merge
through the same REST endpoint with `merge_method=squash`, delete the remote
branch, remove the worktree, and delete the local branch.

**`.env` does not follow a worktree.** It is untracked, so a new worktree starts
without it and every Socrata call fails with a confusing auth error rather than a
missing-file error. Copy it in before the backend session starts:

```bash
cp /Users/halgorithm/workspaces/AI/nyc-events/.env \
  /Users/halgorithm/workspaces/AI/nyc-events-backend/.env
```

Never commit it; `secrets` in CI fails the PR if it is tracked.

### Conflict hazards

- **Alembic migrations.** Two branches each adding a revision produce two heads
  and a merge that appears clean but leaves the schema unapplied. Only the
  `backend` lane writes migrations; before opening a PR that adds one, confirm
  `alembic heads` reports exactly one.
- **Shared root files** — `CONTEXT.md`, `docs/adr/`, `.github/`, `.claude/`,
  `README`. These belong to neither lane. Change them in their own PR, never
  bundled into a feature branch, or the two worktrees collide on the files whose
  conflicts are hardest to resolve correctly.
- **`graphify-out/graph.json`** is covered by the `merge=graphify` union driver
  declared in `.gitattributes`, so concurrent rebuilds merge rather than conflict.
  The driver must be registered in each worktree's git config — re-run
  `graphify hook install` there if a merge on that file ever conflicts.
- **Lockfiles** (`uv.lock`, `frontend/package-lock.json`) are lane-scoped and
  safe, given the directory split holds.

### The contract that makes this parallel at all

The frontend lane cannot build against an API that does not exist. Publishing the
OpenAPI schema and a mock server **early** — before the endpoints are
implemented — is what lets both lanes run from the start instead of the frontend
idling through the entire backend sequence. Treat that contract issue as a
prerequisite, not a nicety: without it the two-worktree setup buys nothing until
the backend is essentially finished.

## Issue map

**Labels available**: `backend` (#0E8A16), `frontend` (#1D76DB),
`fullstack` (#5319E7). Created 2026-08-15. An issue without one of these is not
claimable by either session.

- **#2** — train-line map overlays and nearby event discovery. Needs a lane label
  (`fullstack` — nearest-station distance is computed server-side per
  `docs/adr/0006`) and it presupposes both the map and the API. Late in the order.
- **#3** — Google Maps with count-scaled location markers. Needs `frontend`.
  Depends on the events API existing or being mocked.

Neither is claimable yet: both presuppose an application shell that does not
exist. Do not expand either into "build the whole app" — hand off instead.

The full sequence they belong to is in
`~/.claude/plans/concurrent-hugging-flamingo.md`, ordered
ETL → sync → DB/API → list+detail UI → profiles/interests/push → map+subway →
concierge.

**Branch protection**: enabled on `main`; PRs and the strict `backend`,
`frontend`, `graph`, and `secrets` contexts are required.

---

**Update this file** when branch protection lands, when `backend/` and
`frontend/` are scaffolded, and whenever a new ADR changes a fact recorded here.
