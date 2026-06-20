#!/usr/bin/env bash
# Push RAILWAY_TOKEN to GitHub Actions (repo secret).
# Token source (first match wins):
#   1. RAILWAY_TOKEN in environment
#   2. RAILWAY_TOKEN= in repo-root .env (gitignored)
#   3. ~/.railway/config.json after `railway login`
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN=""

if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
  TOKEN="$RAILWAY_TOKEN"
elif [[ -f "$ROOT/.env" ]]; then
  TOKEN="$(grep -E '^RAILWAY_TOKEN=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\r' || true)"
fi

if [[ -z "$TOKEN" ]]; then
  CONFIG="${HOME}/.railway/config.json"
  if [[ -f "$CONFIG" ]]; then
    TOKEN="$(node -e "const j=require(process.env.HOME+'/.railway/config.json'); const t=j.user?.token; if(t) process.stdout.write(t)")" || true
  fi
fi

if [[ -z "$TOKEN" ]]; then
  echo "No Railway token found." >&2
  echo "Create one at https://railway.com/account/tokens and either:" >&2
  echo "  export RAILWAY_TOKEN='...'" >&2
  echo "  add RAILWAY_TOKEN=... to .env" >&2
  exit 1
fi

printf %s "$TOKEN" | gh secret set RAILWAY_TOKEN
echo "Set GitHub secret RAILWAY_TOKEN (repo: christmedical/christmedical.com)"
