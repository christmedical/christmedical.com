#!/usr/bin/env bash
# After `railway login`, run from repo root to push RAILWAY_TOKEN to GitHub Actions.
set -euo pipefail

CONFIG="${HOME}/.railway/config.json"
if [[ ! -f "$CONFIG" ]]; then
  echo "No Railway config. Run: railway login" >&2
  exit 1
fi

TOKEN="$(node -e "const j=require(process.env.HOME+'/.railway/config.json'); const t=j.user?.token; if(!t) process.exit(1); process.stdout.write(t)")" || {
  echo "No Railway token in config. Run: railway login" >&2
  exit 1
}

if ! railway whoami >/dev/null 2>&1; then
  echo "Railway token expired. Run: railway login" >&2
  exit 1
fi

gh secret set RAILWAY_TOKEN --body "$TOKEN"
echo "Set GitHub secret RAILWAY_TOKEN (repo: christmedical/christmedical.com)"
