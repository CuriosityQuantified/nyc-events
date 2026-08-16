#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
EVIDENCE=${EVIDENCE_DIR:-"$ROOT/artifacts/backend-container"}
SUFFIX=${GITHUB_RUN_ID:-local}-$$
NETWORK="nyc-events-smoke-$SUFFIX"
POSTGRES="nyc-events-postgres-$SUFFIX"
REDIS="nyc-events-redis-$SUFFIX"
API="nyc-events-api-$SUFFIX"
IMAGE="nyc-events-backend:$SUFFIX"
mkdir -p "$EVIDENCE"

cleanup() {
  docker logs "$POSTGRES" >"$EVIDENCE/postgres.log" 2>&1 || true
  docker logs "$REDIS" >"$EVIDENCE/redis.log" 2>&1 || true
  docker logs "$API" >"$EVIDENCE/api.log" 2>&1 || true
  docker rm -f "$API" "$POSTGRES" "$REDIS" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create "$NETWORK" >/dev/null
docker run -d --name "$POSTGRES" --network "$NETWORK" \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nyc_events postgres:16-alpine >/dev/null
docker run -d --name "$REDIS" --network "$NETWORK" redis:7-alpine >/dev/null

READINESS_MAX_PROBES=${READINESS_MAX_PROBES:-60}
READINESS_STABLE_PROBES=${READINESS_STABLE_PROBES:-3}
READINESS_INTERVAL_SECONDS=${READINESS_INTERVAL_SECONDS:-1}
READINESS_LOG="$EVIDENCE/readiness.log"
: >"$READINESS_LOG"
stable_probes=0
services_ready=false

for probe in $(seq 1 "$READINESS_MAX_PROBES"); do
  postgres_ready=false
  redis_ready=false
  if docker exec "$POSTGRES" pg_isready -U postgres -d nyc_events >/dev/null 2>&1; then
    postgres_ready=true
  fi
  if docker exec "$REDIS" redis-cli ping 2>/dev/null | grep -q PONG; then
    redis_ready=true
  fi

  if [[ "$postgres_ready" == true && "$redis_ready" == true ]]; then
    stable_probes=$((stable_probes + 1))
    printf 'probe=%s postgres=ready redis=ready stable=%s/%s\n' \
      "$probe" "$stable_probes" "$READINESS_STABLE_PROBES" >>"$READINESS_LOG"
    if (( stable_probes >= READINESS_STABLE_PROBES )); then
      services_ready=true
      break
    fi
  else
    if (( stable_probes > 0 )); then
      printf 'probe=%s readiness reset after %s stable probe(s)\n' \
        "$probe" "$stable_probes" >>"$READINESS_LOG"
    fi
    stable_probes=0
    printf 'probe=%s postgres=%s redis=%s stable=0/%s\n' \
      "$probe" "$postgres_ready" "$redis_ready" "$READINESS_STABLE_PROBES" \
      >>"$READINESS_LOG"
  fi
  sleep "$READINESS_INTERVAL_SECONDS"
done

if [[ "$services_ready" != true ]]; then
  docker inspect "$POSTGRES" >"$EVIDENCE/postgres-inspect.json" 2>&1 || true
  docker inspect "$REDIS" >"$EVIDENCE/redis-inspect.json" 2>&1 || true
  printf 'backend smoke dependencies never reached %s consecutive ready probes; see %s and container logs\n' \
    "$READINESS_STABLE_PROBES" "$READINESS_LOG" >&2
  exit 1
fi

docker build -t "$IMAGE" "$ROOT/backend"
DATABASE_URL="postgresql+asyncpg://postgres:postgres@$POSTGRES:5432/nyc_events"
REDIS_URL="redis://$REDIS:6379/0"
docker run --rm --network "$NETWORK" \
  -e DATABASE_URL="$DATABASE_URL" -e REDIS_URL="$REDIS_URL" \
  "$IMAGE" .venv/bin/alembic upgrade head

docker run -d --name "$API" --network "$NETWORK" -p 18000:8000 \
  -e DATABASE_URL="$DATABASE_URL" -e REDIS_URL="$REDIS_URL" \
  "$IMAGE" >/dev/null

for _ in $(seq 1 60); do
  if curl --fail --silent --show-error http://127.0.0.1:18000/health \
    >"$EVIDENCE/health.json"; then
    break
  fi
  sleep 1
done
python3 -c 'import json,sys; value=json.load(open(sys.argv[1])); expected={"status":"healthy","database":"connected","redis":"connected"}; assert value == expected, value' "$EVIDENCE/health.json"
printf '%s\n' 'backend production container migration and health smoke passed'
