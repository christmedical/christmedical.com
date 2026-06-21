#!/usr/bin/env bash
# Regenerate docs/schema from the database (tbls doc --rm-dist).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${TBLS_DSN:-}" && -z "${DATABASE_URL:-}" ]]; then
  export TBLS_DSN="postgresql://postgres:password@localhost:5432/christ_medical?sslmode=disable"
fi

bash "$ROOT/scripts/apply-api-schema.sh"
bash "$ROOT/scripts/tbls.sh" doc --rm-dist
bash "$ROOT/scripts/extract-schema-er-mermaid.sh"

echo "Schema docs written to docs/schema/"
