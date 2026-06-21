#!/usr/bin/env bash
# Copy tbls Mermaid ER block from docs/schema/README.md into frontend/public for marketing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/schema/README.md"
DST="$ROOT/frontend/public/design/schema-er.mmd"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — run make schema-docs first" >&2
  exit 1
fi

sed -n '/^```mermaid/,/^```$/p' "$SRC" | sed '1d;$d' > "$DST"
echo "Wrote $DST"
