#!/usr/bin/env bash
# Generate docs/schema using ephemeral Postgres + tbls containers (no host DB required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NETWORK="${CM_SCHEMA_NETWORK:-cm-schema-docs}"
PG_CONTAINER="${CM_SCHEMA_PG:-cm-schema-pg}"
VERSION="$(tr -d '[:space:]' < "$ROOT/.tbls-version")"

cleanup() {
  docker rm -f "$PG_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create "$NETWORK" >/dev/null 2>&1 || true

docker run -d --rm --name "$PG_CONTAINER" --network "$NETWORK" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=christ_medical \
  postgres:16-alpine >/dev/null

echo "Waiting for Postgres..."
for _ in $(seq 1 30); do
  if docker run --rm --network "$NETWORK" postgres:16-alpine \
    pg_isready -h "$PG_CONTAINER" -U postgres -d christ_medical >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

export TBLS_DSN="postgresql://postgres:password@${PG_CONTAINER}:5432/christ_medical?sslmode=disable"

docker run --rm --network "$NETWORK" \
  -v "$ROOT:/work" -w /work \
  -e TBLS_DSN \
  postgres:16-alpine \
  sh -ec "apk add --no-cache postgresql-client bash >/dev/null && bash scripts/apply-api-schema.sh"

docker run --rm --network "$NETWORK" \
  -v "$ROOT:/work" -w /work \
  -e TBLS_DSN \
  "ghcr.io/k1low/tbls:${VERSION}" \
  -c /work/.tbls.yml doc --rm-dist

bash "$ROOT/scripts/extract-schema-er-mermaid.sh"

echo "Schema docs written to docs/schema/"
