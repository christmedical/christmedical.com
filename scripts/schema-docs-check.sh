#!/usr/bin/env bash
# CI drift check: fail when committed docs/schema differs from live schema.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${TBLS_DSN:-}" ]]; then
  echo "TBLS_DSN is required for schema-docs-check" >&2
  exit 1
fi

bash "$ROOT/scripts/apply-api-schema.sh"
bash "$ROOT/scripts/tbls.sh" diff

echo "Schema docs match the database."
