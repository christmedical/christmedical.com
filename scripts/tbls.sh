#!/usr/bin/env bash
# Run tbls from PATH or the pinned Docker image (.tbls-version).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION_FILE="$ROOT/.tbls-version"
CONFIG="$ROOT/.tbls.yml"

if command -v tbls >/dev/null 2>&1; then
  exec tbls -c "$CONFIG" "$@"
fi

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "tbls not in PATH and missing $VERSION_FILE" >&2
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"
IMAGE="ghcr.io/k1low/tbls:${VERSION}"

# When tbls runs in Docker, reach host Postgres via host.docker.internal.
if [[ -n "${TBLS_DSN:-}" && "$TBLS_DSN" == *"@localhost:"* ]]; then
  export TBLS_DSN="${TBLS_DSN//@localhost/@host.docker.internal}"
fi

exec docker run --rm \
  -v "$ROOT:/work" \
  -w /work \
  -e TBLS_DSN \
  -e TBLS_DOC_PATH \
  --add-host=host.docker.internal:host-gateway \
  "ghcr.io/k1low/tbls:${VERSION}" \
  -c /work/.tbls.yml \
  "$@"
