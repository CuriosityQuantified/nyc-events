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

- **Repo path**: `/Users/nicholaspate/Documents/projects/nyc-events`
  (remote `https://github.com/CuriosityQuantified/nyc-events`, private, `main`).
- **Commit identity**: `CuriosityQuantified <nicholas.pate1320@gmail.com>`.

## Current state — NO application code yet

The repo contains only specification and design artifacts:

- `HANDOFF.md` — product concept, NYC Parks "Upcoming 14 Days" data source,
  sync/ingestion requirements. Binds as the project spec.
- `FRONTEND_CONCEPT.md` — consensus frontend direction (mobile-first, list-first
  explorer with optional map, grounded NL search, explicit unknown states,
  official-detail handoffs).
- `design/` — Open Design export. `design/nyc-events-mvp-v2.html` is the primary
  entry and the visual contract; `design/DESIGN-HANDOFF.md` and
  `design/DESIGN-MANIFEST.json` define tokens, responsive matrix, and the
  screen/module map. Treat these as binding for UI work.

## Gate commands

- **Env**: none provisioned. There is no `package.json`, no venv, no lockfile, no
  `node_modules`. Stack is not yet chosen — `HANDOFF.md` / `FRONTEND_CONCEPT.md`
  imply a web front end plus an API-sync backend, but nothing is committed.
- **Unit tests**: NOT DEFINED. No test runner is installed or configured.
- **Regressions**: NOT DEFINED. No e2e/Playwright suite exists.
- **Build**: NOT DEFINED. No build script.

## Code graph

graphify 0.9.43, installed 2026-08-15 via `uv tool install "graphifyy[mcp]"`
(PyPI package is **`graphifyy`**, double-y; the CLI is `graphify`, at
`~/.local/bin/graphify`). Rebuild with `graphify update .` (AST-only, no LLM, no
API cost); stage `graphify-out/` with the commit. There is no CI check enforcing
freshness yet.

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

**There is none.** No `.github/workflows/` directory, and `main` has **no branch
protection** (`protection.enabled: false`, zero required contexts, verified
2026-08-15).

**Fail-closed consequence — read before running the worker here.** §9 of the
skill requires every *required* check to succeed on the final PR head. This repo
currently has zero required checks, so "all required checks green" is vacuously
true and the merge gate provides no protection. Until real CI exists, the first
issue that touches implementation MUST stand up the four named jobs (`unit`,
`regressions`, `code-graph` where applicable, `build`) per pipeline §8.8, and
branch protection should then be enabled on `main`. Do not treat an absent
workflow as a passing gate.

## Issue map (2026-08-15)

- **#2** — train-line map overlays and nearby event discovery (`enhancement`).
- **#3** — Google Maps with count-scaled location markers (`enhancement`).

There is no master-spec/umbrella issue to exclude. Both open issues are UI
features that presuppose an application shell that does not yet exist — verify
the prerequisite scaffolding before selecting either, and hand off rather than
silently expanding scope to build the whole app.

---

**Update this file** once the stack, test runner, and CI workflow land; the
worker's §6 gate suite is unusable here until then.
