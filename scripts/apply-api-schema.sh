#!/usr/bin/env bash
# Apply production API schema migrations (read-only tooling uses this for tbls).
# Order matches api/Infrastructure/DbSchemaBootstrap.cs + Dockerfile SQL copies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/conversion/etl"
PATCH="$ROOT/scripts/sql/api_incremental_patients_patch.sql"

if [[ -z "${TBLS_DSN:-}" && -z "${DATABASE_URL:-}" ]]; then
  export TBLS_DSN="postgresql://postgres:password@localhost:5432/christ_medical?sslmode=disable"
fi

DSN="${TBLS_DSN:-${DATABASE_URL}}"

run_sql() {
  psql "$DSN" -v ON_ERROR_STOP=1 -f "$1"
}

MIGRATIONS=(
  "$SQL/V1__Initial_Schema.sql"
  "$SQL/V4__Patients_spiritual.sql"
  "$SQL/V6__patients_phonetic.sql"
  "$SQL/V7__patients_legacy_contact.sql"
  "$SQL/V9__tenants_and_auth.sql"
  "$PATCH"
  "$SQL/V10__feedback.sql"
  "$SQL/V11__feedback_reviewer_prefs.sql"
  "$SQL/V12__users_first_last_name.sql"
)

for file in "${MIGRATIONS[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing migration: $file" >&2
    exit 1
  fi
  echo "Applying $(basename "$file")..."
  run_sql "$file"
done

echo "API schema migrations applied."
