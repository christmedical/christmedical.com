#!/usr/bin/env bash
# Stop local/dev processes and Docker stacks, rebuild images when sources changed, start demo stack.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_DEMO=(-f "$ROOT/docker-compose.demo.yaml")
COMPOSE_BASE=(-f "$ROOT/docker-compose.yaml")

# COMPOSE may be "docker compose" or "docker-compose" from Makefile / env.
if [[ -n "${COMPOSE:-}" ]]; then
  read -ra COMPOSE_CMD <<< "$COMPOSE"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Error: docker compose not found. Install Docker Desktop or docker-compose." >&2
  exit 127
fi

cd "$ROOT"

# Load .env for DOCKERHUB_NAMESPACE / IMAGE_TAG when present.
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
export DOCKERHUB_NAMESPACE="${DOCKERHUB_NAMESPACE:-christmedical}"
export IMAGE_TAG="${IMAGE_TAG:-latest}"

compose_label() {
  printf '%s ' "${COMPOSE_CMD[@]}"
}

echo "━━━ Christ Medical: make run ━━━"

echo "→ Stopping Docker stacks (demo + base compose)…"
"${COMPOSE_CMD[@]}" "${COMPOSE_DEMO[@]}" down --remove-orphans 2>/dev/null || true
"${COMPOSE_CMD[@]}" "${COMPOSE_BASE[@]}" down --remove-orphans 2>/dev/null || true

echo "→ Stopping local dev processes (ports 3000/5050, Next.js, API)…"
for port in 3000 5050; do
  if pids="$(lsof -ti :"$port" 2>/dev/null || true)"; then
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
  fi
done
pkill -f "next dev.*$(basename "$ROOT")" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
pkill -f "node.*server\\.js" 2>/dev/null || true
pkill -f "dotnet.*WebAPI" 2>/dev/null || true

echo "→ Building images (Docker rebuilds only changed layers)…"
"${COMPOSE_CMD[@]}" "${COMPOSE_DEMO[@]}" build

echo "→ Starting db + api + web…"
"${COMPOSE_CMD[@]}" "${COMPOSE_DEMO[@]}" up -d

echo ""
echo "Waiting for API…"
ready=0
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:5050/api/v1/patients?tenantId=1&limit=1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -eq 0 ]]; then
  echo "Warning: API not responding yet — check: $(compose_label)${COMPOSE_DEMO[*]} logs api"
fi

echo ""
echo "Waiting for web UI…"
for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "http://localhost:3000/queue" 2>/dev/null || curl -sf -o /dev/null "http://localhost:3000/" 2>/dev/null; then
    break
  fi
  sleep 1
done

"${COMPOSE_CMD[@]}" "${COMPOSE_DEMO[@]}" ps

echo ""
echo "✓ App running"
echo "  UI:  http://localhost:3000"
echo "  API: http://localhost:5050/api"
echo ""
echo "Logs:  $(compose_label)${COMPOSE_DEMO[*]} logs -f web"
echo "Stop:  make demo-down"

if command -v open >/dev/null 2>&1; then
  open "http://localhost:3000/queue" || true
fi
