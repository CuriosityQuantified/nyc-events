# Issue #8 handoff — frontend walking skeleton

## Ownership

- Job: `f042c1b2752c`
- Repository: `CuriosityQuantified/nyc-events`
- Worktree: `/Users/halgorithm/workspaces/AI/nyc-events-frontend`
- Persistent branch: `frontend` tracking `origin/frontend`
- Open Design project: `nyc-events-frontend-issue-8-ed4f`

## Current stop condition

**Blocker: Codex CLI has no authentication on this host.**

The Codex CLI (v0.144.3) is installed at `/opt/homebrew/bin/codex` but `codex login status` returns `Not logged in`. All headless authentication paths have been exhausted:

1. **No OPENAI_API_KEY or CODEX_ACCESS_TOKEN** in the shell environment.
2. **No keychain entry** — `security find-generic-password` for `codex`, `openai`, and `OPENAI` all return "item not found".
3. **~/.codex/config.toml** contains only a project trust entry; no credential or token.
4. **`codex login --device-auth`** requires interactive browser login (device code flow with a one-time code at `auth.openai.com/codex/device`). It cannot complete headlessly.
5. **`codex login --with-api-key`** and `--with-access-token` read from stdin — no credential source available to pipe.

Three Open Design agents are available: `claude`, `codex`, `hermes`. Codex is the only one that lacks auth. The initial `frontend-design` run succeeded with Claude, but the prior Claude polish run also failed with `auth_required`. Hermes is available and authenticated but the issue instructions specify `agent=codex`.

The two required Open Design skill passes (`impeccable-design-polish` and `web-design-guidelines`) cannot run until Codex is authenticated.

## Open Design evidence

| Pass | Skill | Run ID | Agent | Terminal status | Artifact or preview |
|---|---|---|---|---|---|
| Initial design | `frontend-design` | `22ac9e6a-c2ab-40bd-9e72-5f3b08376753` | Claude | `succeeded` | Registered `preview.html`; HTTP 200; title `ParkMatch NYC — Walking Skeleton Preview`; 390x844 render inspected |
| Failed prior Claude polish | `impeccable-design-polish` | `24fb05eb-80fa-4dba-bb77-2da285e05f98` | Claude | `failed`; `auth_required` | None; do not retry with Claude |
| Failed Codex polish | `impeccable-design-polish` | `5d1584b1-c544-4717-9c5d-af08d0cbb62c` | Codex `gpt-5.6-sol` | `failed`; `AGENT_AUTH_REQUIRED`; HTTP 401 | None |
| Failed Codex audit | `web-design-guidelines` | `4c6d3e94-ebbd-45dd-9892-553df268a60a` | Codex default | `failed`; `AGENT_AUTH_REQUIRED`; HTTP 401 | None |

The initial registered preview is credible and complete. It shows the mobile brand, search, filter and date strips, List/Map control, event cards, and fixed bottom navigation.

## Codex auth evidence (collected 2026-08-15)

```
$ codex --version
codex-cli 0.144.3

$ codex login status
Not logged in

$ cat ~/.codex/config.toml
[projects."/Users/halgorithm/workspaces/AI/open-design"]
trust_level = "trusted"

$ security find-generic-password -s "codex"
SecKeychainSearchCopyNext: The specified item could not be found in the keychain.

$ security find-generic-password -s "openai"
SecKeychainSearchCopyNext: The specified item could not be found in the keychain.

$ env | grep -iE 'codex|openai'
(no output — no matching environment variables)

$ codex login --device-auth
(requires interactive browser login at auth.openai.com/codex/device — cannot complete headlessly)
```

## Implementation and audit work (complete)

Implementation commit `5ede74d` and CI/CD strengthening commit `a6416e1` are pushed. The four required sequential subagent phases are complete:

1. **Implementation + CI** — Next.js shell with design tokens, EventCard, ListMapToggle, BottomNav; Playwright UAT at phone (390x844) and desktop (1440x900); Vitest component tests; accessibility scan.
2. **Code review** — Reviewed against issue spec and repository standards. Fixes applied.
3. **Code simplification** — Changed code reviewed for clarity and duplication. No issues.
4. **Security review** — No actionable findings.

Additional strengthening in the continuation:
- Deterministic Vitest and Testing Library component tests for ListMapToggle, EventCard, and BottomNav.
- Wired unit tests and Playwright through the existing protected `npm test --if-present` command.
- Added `@axe-core/playwright` fail-closed accessibility scan.
- Added keyboard List/Map journeys.
- Added viewport-intersection geometry checks and screenshot attachments.
- Console and page-error checks after every common journey.
- Fixed accessibility failures: muted/active color contrast, heading order, landmark containment.

## Latest local gates

| Gate | Result |
|---|---|
| Clean install: `npm ci` | PASS; 0 vulnerabilities |
| Protected frontend test path: `npm test --if-present` | PASS through `npm test`; 30/30 Playwright tests |
| Accessibility: axe at 390x844 and 1440x900 | PASS; 0 violations |
| Keyboard List/Map journeys | PASS at both viewports |
| Geometry, viewport intersection, screenshots, no page errors | PASS |
| ESLint: `npm run lint` | PASS |
| TypeScript: `npx tsc --noEmit` | PASS |
| Production build: `npm run build` | PASS |
| Graphify | PASS; refreshed after the CI/CD changes; 307 nodes, 338 edges; second rebuild reported no topology changes |

Tests use only local mock data. No live third-party API calls.

## Railway evidence

- Project: `nyc-events` (`05794e8d-aece-4c90-be70-05b5822d2ac4`)
- Service: `frontend` (`1bd939d3-3c95-4a28-ac78-382fbb861aac`)
- Production URL: `https://frontend-production-1f632.up.railway.app`
- First upload: deployment `a8613965-2734-4b44-8b3b-f3b94b692600`, terminal status `SUCCESS`

The first upload contains commit `5ede74d`. Deploy and verify the final pushed commit before completion.

## Required finish sequence (ordered next actions)

1. **Authenticate Codex CLI** — a human must run `codex login --device-auth` interactively, complete the browser flow, and verify `codex login status` shows authenticated. Alternatively, pipe an API key: `printenv OPENAI_API_KEY | codex login --with-api-key`. Or try `agent=hermes` if the issue owner approves it as an alternative to Codex.
2. Run `impeccable-design-polish` with `agent=codex` (or approved alternative); poll to terminal success; inspect the real artifact and preview.
3. Run `web-design-guidelines` with `agent=codex` (or approved alternative); poll to terminal success; inspect the real artifact and preview.
4. Apply only justified `frontend/` fixes.
5. Run `npm ci`, `npm test --if-present`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` from `frontend/`.
6. Deploy the final commit to Railway. Verify at the public origin with phone and desktop viewports: List/Map, keyboard, axe, geometry, viewport intersection, screenshots, and no console or page errors.
7. Run `PATH="$HOME/.local/bin:$PATH" graphify update .`, stage all tracked outputs, and verify `git diff --exit-code graphify-out/graph.json`.
8. Remove this handoff only after every blocking criterion is complete.
9. Commit as `CuriosityQuantified <curiosityquantified@gmail.com>`, push `frontend`, and create exactly one PR to `main` titled `fix #8: Frontend walking skeleton` with `Closes #8`. Do not merge.

## Acceptance criteria status

- [x] Next.js application rendering a shell with sketch's colour, type hierarchy, card layout, List/Map toggle, and bottom navigation
- [x] Responsive at phone and desktop viewports using CSS breakpoints only
- [x] Playwright UAT runs at both viewports (wired through npm test)
- [x] Production build succeeds
- [x] Sketch's markup and hand-rolled state machine are not carried over
- [ ] **BLOCKED** — `impeccable-design-polish` Open Design pass (Codex auth required)
- [ ] **BLOCKED** — `web-design-guidelines` Open Design pass (Codex auth required)
- [ ] Deployed and verified at production origin
- [x] Graphify refreshed and committed in `a6416e1`; refresh again after the final Open Design edit
- [ ] PR created
