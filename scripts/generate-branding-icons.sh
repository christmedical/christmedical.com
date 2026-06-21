#!/usr/bin/env bash
# Regenerate emblem + wordmark assets for frontend/public/branding.
# Emblem: top-center square crop from ChristMedical_Logo.png (no wordmark text).
# Wordmark: full ChristMedical_Logo.png (hero only).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FULL="$ROOT/docs/branding/ChristMedical_Logo.png"
ICON_DOC="$ROOT/docs/branding/ChristMedical_Logo_Icon.png"
DST="$ROOT/frontend/public/branding"
APP="$ROOT/frontend/app"

# Emblem crop on the 1024×1024 artboard — emblem only, no CHRIST/MEDICAL text.
EMBLEM_CROP=580
EMBLEM_OFFSET_X=222

if [[ ! -f "$FULL" ]]; then
  echo "Missing full logo: $FULL" >&2
  exit 1
fi

mkdir -p "$DST"
EMBLEM_TMP="$(mktemp "${TMPDIR:-/tmp}/cm-emblem.XXXXXX.png")"
trap 'rm -f "$EMBLEM_TMP"' EXIT

sips -c "$EMBLEM_CROP" "$EMBLEM_CROP" --cropOffset 0 "$EMBLEM_OFFSET_X" "$FULL" --out "$EMBLEM_TMP" >/dev/null
sips -z 1024 1024 "$EMBLEM_TMP" --out "$ICON_DOC" >/dev/null

sips -z 512 512 "$EMBLEM_TMP" --out "$DST/icon-512.png" >/dev/null
sips -z 192 192 "$EMBLEM_TMP" --out "$DST/icon-192.png" >/dev/null
sips -z 180 180 "$EMBLEM_TMP" --out "$DST/apple-touch-icon.png" >/dev/null
sips -z 32 32 "$EMBLEM_TMP" --out "$DST/favicon-32.png" >/dev/null
cp "$DST/icon-512.png" "$APP/icon.png"
cp "$DST/apple-touch-icon.png" "$APP/apple-icon.png"
cp "$FULL" "$DST/logo-wordmark.png"

echo "Generated emblem (no wordmark) and wordmark in $DST"
