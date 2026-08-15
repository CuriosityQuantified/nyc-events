# Issue #8 handoff — frontend walking skeleton

## Ownership

- Job: `f042c1b2752c`
- Repository: `CuriosityQuantified/nyc-events`
- Worktree: `/Users/halgorithm/workspaces/AI/nyc-events-frontend`
- Persistent branch: `frontend` tracking `origin/frontend`
- Open Design project: `nyc-events-frontend-issue-8-ed4f`

## Current stop condition

**No authentication or Open Design blocker remains.**

`codex login status` returns `Logged in using ChatGPT`. Both required final Open Design passes completed successfully and produced valid `preview.html` artifacts.

## Open Design evidence

| Pass | Skill | Run ID | Agent | Terminal status | Artifact or preview |
|---|---|---|---|---|---|
| Initial design | `frontend-design` | `22ac9e6a-c2ab-40bd-9e72-5f3b08376753` | Claude | `succeeded` | Registered `preview.html`; mobile preview inspected |
| Failed prior Claude polish | `impeccable-design-polish` | `24fb05eb-80fa-4dba-bb77-2da285e05f98` | Claude | `failed`; `auth_required` | Historical only; do not retry |
| Final polish | `impeccable-design-polish` | `7ed4e731-de0d-4e1b-a067-22522d933247` | Hermes `gpt-5.6-sol` | `succeeded`; deliverable valid | `preview.html`; `impeccable-polish-report.md`; contrast, focus, semantics, touch targets, reduced motion, safe-area and overflow fixes |
| Final guidelines audit | `web-design-guidelines` | `c5aa9438-c04e-4bbe-acb6-27a3312a3acf` | Codex `gpt-5.6-sol` | `succeeded`; deliverable valid | `preview.html`; `web-design-guidelines-report.md`; skip navigation, live result counts, control state, accessible names and disabled map semantics |

The Open Design desktop renderer socket was unavailable, so its report records static DOM/CSS geometry. Repository Playwright remains the authoritative rendered phone/desktop verification and must pass against the exact final Railway revision.

## Codex auth evidence (historical before user login; resolved 2026-08-15)

The earlier failed checks below explain the original handoff. Current verification is `codex login status` → `Logged in using ChatGPT`.

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
- Initial deployment `a8613965-2734-4b44-8b3b-f3b94b692600` reported `SUCCESS` but public requests returned HTTP 502 because Next.js listened on 8080 while the domain targeted 3000
- Set Railway `PORT=3000`; replacement deployment `95c228dc-b827-4374-80de-233cc8612070` is `SUCCESS` and public requests return HTTP 200
- The deployed revision is still commit `5ede74d`; production Playwright against it returned 28/30, with the two fail-closed axe checks exposing accessibility defects fixed in later branch commit `a6416e1`
- Uncommitted lane-owned additions now present: `frontend/playwright.production.config.ts` and `test:production`; missing `PLAYWRIGHT_BASE_URL` fails closed

Deploy and verify the final pushed commit before completion. The exact final revision must pass 30/30 production Playwright at both viewports.

## Required finish sequence (ordered next actions)

1. Review the successful Open Design polish and guidelines reports; apply only justified changes not already covered by the tested source implementation.
2. Preserve, validate, and commit `playwright.production.config.ts`, the `test:production` package script, and this handoff update.
3. Run `npm ci`, `npm test --if-present`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` from `frontend/`.
4. Run `PATH="$HOME/.local/bin:$PATH" graphify update .`, stage all tracked outputs, and verify a second regeneration has no drift.
5. Remove this handoff only after every blocking criterion is complete.
6. Commit as `CuriosityQuantified <curiosityquantified@gmail.com>`, push `frontend`, and create exactly one PR to `main` titled `fix #8: Frontend walking skeleton` with `Closes #8`. Do not merge until protected checks pass.
7. Deploy the exact final commit to Railway. Run `PLAYWRIGHT_BASE_URL=https://frontend-production-1f632.up.railway.app npm run test:production`; require 30/30 at 390×844 and 1440×900 with axe, keyboard, geometry, screenshots, console/page-error and no-overflow checks.
8. Record deployment ID, exact revision, Playwright report/traces/screenshots, and CI/CD delta in the PR. Production failure blocks merge.

## Acceptance criteria status

- [x] Next.js application rendering a shell with sketch's colour, type hierarchy, card layout, List/Map toggle, and bottom navigation
- [x] Responsive at phone and desktop viewports using CSS breakpoints only
- [x] Playwright UAT runs at both viewports (wired through npm test)
- [x] Production build succeeds
- [x] Sketch's markup and hand-rolled state machine are not carried over
- [x] `impeccable-design-polish` Open Design pass succeeded (`7ed4e731-de0d-4e1b-a067-22522d933247`)
- [x] `web-design-guidelines` Open Design pass succeeded with authenticated Codex (`c5aa9438-c04e-4bbe-acb6-27a3312a3acf`)
- [ ] Final branch revision deployed and verified at production origin with 30/30 production Playwright
- [x] Graphify refreshed and committed in `a6416e1`; refresh again after the final Open Design edit
- [ ] PR created
