# Christ Medical — Desktop (Electron)

Thin **clinician** desktop shell: a native window that loads the same portal the
iOS/Android WebView shells use. This is **not** the field-hub tray supervisor
(`hub/`); it is an installable client for Windows and macOS.

## Why Electron + electron-builder

Electron gives a Chromium `BrowserWindow` with the same portal UX as mobile,
plus a real app menu, window state, and OS integration. **electron-builder** is
the standard packager for shipping both **Windows NSIS** installers and **macOS
DMG** (drag-to-Applications) from one config — no separate WiX/Inno setup for
this thin shell.

## Requirements

- Node 20+ (22 fine)
- For signed Mac/Windows release builds: Apple Developer ID / Windows code-signing
  cert (optional for local smoke packaging)

## Configure portal URL

Default: `https://login.christmedical.com/`

Override (no discovery — config only):

```bash
# preferred
CHRISTMEDICAL_PORTAL_URL=http://127.0.0.1:3000/ npm start

# shorthand
PORTAL_URL=http://127.0.0.1:3000/ npm start
```

In-app navigation stays on `*.christmedical.com` **or** the host of the
configured portal URL. Everything else opens in the system browser.

## Develop

```bash
cd clients/desktop
npm install
npm start
npm test
```

Optional DevTools: `ELECTRON_DEVTOOLS=1 npm start`

## Package

```bash
# macOS .dmg + .zip (universal)
npm run build:mac

# Windows NSIS x64 installer
npm run build:win

# both (when cross-build tooling allows)
npm run build
```

Artifacts land in `clients/desktop/release/` (gitignored).

| Script | Output |
|--------|--------|
| `npm start` | Run unpackaged app |
| `npm run build:mac` | `Christ Medical-*.dmg`, `.zip` |
| `npm run build:win` | `Christ Medical Setup *.exe` (NSIS) |
| `npm run pack` | Unpackaged `dir` build (faster smoke) |

## Make targets (repo root)

```bash
make clients-desktop-test   # node --test config unit tests
```

## Out of scope (this folder)

- Hub discovery (UDP / mDNS) — later task
- Browser extension — will not ship; use the PWA on Linux/browsers
- Linux Electron build — use the PWA; see [`../README.md`](../README.md)
