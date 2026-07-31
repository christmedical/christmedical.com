# Christ Medical — Client shells

Native / installable shells that load the clinician portal. Default start URL
(same on every platform):

`https://login.christmedical.com/`

Override per shell when pointing at a local hub later — **no hub discovery in
these clients yet** (that ships separately once hub architecture is finalized).

## Layout

| Path | Stack | Platforms |
|------|--------|-----------|
| [`ios/`](ios/) | SwiftUI + `WKWebView`, Xcode 16+, iOS 17+ | iPhone + iPad |
| [`android/`](android/) | Kotlin + `WebView`, AGP 7.4, `minSdk` 24 / `targetSdk` 33 | Phone + tablet |
| [`desktop/`](desktop/) | **Electron** + `BrowserWindow`, electron-builder | Windows + macOS |

## Linux and browsers (no native shell)

Linux clinicians and anyone on a modern browser should use the **PWA**
directly (install from Chrome/Edge/Firefox, or just open the portal URL). We
do **not** ship an Electron build for Linux, and we do **not** build a browser
extension — browsers cannot perform the hub discovery the native shells will
eventually need; that belongs in iOS / Android / desktop.

## iOS

Open `ios/ChristMedical.xcodeproj` in Xcode (install the iOS platform from
**Settings → Components** if needed, then set your Development Team for device
installs). Phone + iPad (`TARGETED_DEVICE_FAMILY = 1,2`).

Shared portal config lives in the `ChristMedicalKit` Swift package (same folder)
so unit tests run without a Simulator:

```bash
cd clients/ios
swift test
```

Or from the repo root: `make clients-ios-test`

## Android

Requires JDK 11+, Android SDK (`ANDROID_HOME`), and platform 33.

```bash
cd clients/android
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

Or from the repo root: `make clients-android-test`

Install the debug APK on a device/emulator:

```bash
./gradlew installDebug
```

## Desktop (Electron)

Thin windowed clinician client (not the hub tray supervisor). Dev and packaging:

```bash
cd clients/desktop
npm install
npm start                 # loads configured portal URL
npm run build:mac         # .dmg + .zip
npm run build:win         # NSIS installer
```

Portal URL override: `CHRISTMEDICAL_PORTAL_URL` (or `PORTAL_URL`). Details:
[`desktop/README.md`](desktop/README.md).

From the repo root: `make clients-desktop-test`

## Shared behavior

- Start URL: `https://login.christmedical.com/` (configurable on desktop via env)
- JavaScript + DOM storage enabled (login flows)
- HTTPS preferred (mobile shells: HTTPS only / no cleartext)
- Back gesture / History menu walks WebView / BrowserWindow history when possible
- Off-domain links open in the system browser
