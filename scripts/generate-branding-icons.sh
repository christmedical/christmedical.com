#!/usr/bin/env bash
# Regenerate frontend/public/branding icons from docs/branding/ChristMedical_Logo_Icon.png
# (emblem only — no wordmark). Full logo with text: ChristMedical_Logo.png
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/branding/ChristMedical_Logo_Icon.png"
DST="$ROOT/frontend/public/branding"
APP="$ROOT/frontend/app"

if [[ ! -f "$SRC" ]]; then
  echo "Missing icon source: $SRC" >&2
  echo "Crop emblem from ChristMedical_Logo.png or add ChristMedical_Logo_Icon.png" >&2
  exit 1
fi

mkdir -p "$DST"
sips -z 512 512 "$SRC" --out "$DST/icon-512.png" >/dev/null
sips -z 192 192 "$SRC" --out "$DST/icon-192.png" >/dev/null
sips -z 180 180 "$SRC" --out "$DST/apple-touch-icon.png" >/dev/null
sips -z 32 32 "$SRC" --out "$DST/favicon-32.png" >/dev/null
cp "$DST/icon-512.png" "$APP/icon.png"
cp "$DST/apple-touch-icon.png" "$APP/apple-icon.png"

WORDMARK_SRC="$ROOT/docs/branding/ChristMedical_Logo.png"
if [[ -f "$WORDMARK_SRC" ]]; then
  cp "$WORDMARK_SRC" "$DST/logo-wordmark.png"
fi

echo "Generated branding icons from emblem-only logo in $DST"
