# CI/CD extension matrix

Issue #38 establishes the fail-closed baseline. Later issues must add deterministic tests at every applicable seam; passing the baseline unchanged is not evidence for new behavior.

| Change class | Required protected gate | Required additional gate/evidence | Failure that must be caught |
|---|---|---|---|
| Backend logic or API | `backend` | Unit and real Postgres/Redis integration, coverage XML, Docker start smoke | Behavioral regression, database/Redis incompatibility, low coverage, non-starting image |
| Alembic schema | `backend` | Single-head check, downgrade/upgrade/re-upgrade test, container pre-start migration | Split heads, non-idempotent migration, image that cannot migrate production |
| OpenAPI or fixtures | `backend` | `contract` plus frontend consumer test | Invalid schema, golden drift, backend/frontend payload disagreement |
| Frontend component | `frontend` | Vitest component/accessibility assertions and production build | Render, semantics, keyboard, or type regression |
| Frontend journey | `frontend` | Playwright at 390×844 and 1440×900 with axe, keyboard, CSS-pixel geometry, viewport intersection, console/page-error checks, screenshots, HTML and traces | Dead interaction, inaccessible control, overflow/occlusion, runtime error |
| Dependency or lockfile | `security`, `secrets` | `uv lock --check`, hashed pip-audit, `npm ci`, npm audit, actionlint, zizmor | High/critical advisory, unreviewed drift, unsafe workflow permissions, unpinned action |
| Deployment behavior | trusted `Production deployment` | Exact backend and frontend Railway deployment IDs/revisions, backend backing-service health, public-origin production Playwright, deployment artifacts | Railway status without public cutover, wrong revision, backing-service failure, browser-only production defect |
| Cutover or rollback | trusted `Production deployment` | Per-service `rollback_drill=true` marker cutover, `deploymentRollback`, exact revision restoration, backend health and Playwright after rollback; frontend failure also restores the prior backend deployment | Partial full-stack cutover, irreversible release, or rollback that restores the wrong image/configuration |
| Graph-visible code/config | `graph` | Graphify 0.9.43 rebuild and tracked-output diff | Stale canonical Linux knowledge graph |

## Clean-runner commands

- Backend quality: `cd backend && uv sync --frozen && uv lock --check && uv run ruff format --check . && uv run ruff check . && uv run mypy app`
- Backend behavior: `cd backend && uv run pytest -v --cov=app --cov-report=xml:coverage.xml --cov-fail-under=80`
- Backend image: `./scripts/ci/backend_container_smoke.sh`
- Contract: `uv run contracts/validate_contract.py && python3 -m unittest discover -s contracts/tests -v`
- Frontend: `cd frontend && npm ci && npm run format:check && npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run test:e2e`
- Workflow policy: `uv run --with PyYAML==6.0.2 python -m unittest discover -s scripts/ci/tests -v`
- Deployment helpers: `python3 -m unittest discover -s scripts/deploy/tests -v`
- Graph: `PATH="$HOME/.local/bin:$PATH" graphify update .` followed by a tracked-output diff check

## Trust boundary

Pull-request workflows receive no Railway credential. The production workflow runs only for `main` pushes or manual dispatches and selects the `production` GitHub Environment. A production-environment project token is stored as `RAILWAY_TOKEN`, and its non-secret project identifier is stored as `RAILWAY_PROJECT_ID`. The sync-worker creation step alone receives `RAILWAY_API_TOKEN` because Railway rejects service creation under project tokens. The helper removes the project token while it links and creates the missing service, then returns to project-scoped reconciliation, deployment, and verification. `FRONTEND_PUBLIC_ORIGIN` and `BACKEND_PUBLIC_ORIGIN` are optional non-secret repository variables; discovery fails on an ambiguous or non-Railway domain. Both deployed services must expose `/api/revision` and match the exact GitHub SHA at the public origin. Backend cutover must also pass real Postgres and Redis health. Frontend cutover must pass the committed production Playwright suite. Any terminal deployment failure, revision mismatch, backing-service error, accessibility/keyboard/geometry error, console/page error, or browser failure leaves the job red and invokes Railway rollback.

The `production` GitHub Environment has a custom deployment branch policy that accepts `main` only. Manual dispatch from any other ref is blocked before credentials are released.
