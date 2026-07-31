# Christ Medical — Mobile apps

Native **iOS (Swift)** and **Android (Kotlin)** shells that load the production portal in a WebView:

`https://login.christmedical.com/`

Both targets are **universal** (phone + tablet). Off-domain links open in the system browser; in-domain navigation (including `*.christmedical.com`) stays in the WebView.

## Layout

| Path | Stack |
|------|--------|
| `ios/` | SwiftUI + `WKWebView`, Xcode 16+, iOS 17+ |
| `android/` | Kotlin + `WebView`, AGP 7.4, `minSdk` 24 / `targetSdk` 33 |

## iOS

Open `ios/ChristMedical.xcodeproj` in Xcode (install the iOS platform from **Settings → Components** if needed, then set your Development Team for device installs). Phone + iPad (`TARGETED_DEVICE_FAMILY = 1,2`).

Shared portal config lives in the `ChristMedicalKit` Swift package (same folder) so unit tests run without a Simulator:

```bash
cd mobile/ios
swift test
```

Or from the repo root: `make mobile-ios-test`

## Android

Requires JDK 11+, Android SDK (`ANDROID_HOME`), and platform 33.

```bash
cd mobile/android
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

Or from the repo root: `make mobile-android-test`

Install the debug APK on a device/emulator:

```bash
./gradlew installDebug
```

## Shared behavior

- Start URL: `https://login.christmedical.com/`
- JavaScript + DOM storage enabled (login flows)
- HTTPS only (no cleartext)
- Back gesture / system back walks WebView history when possible
