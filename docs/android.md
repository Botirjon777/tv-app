# `android/` — Hotel TV Launcher (Flutter, Android TV + Tizen)

A **Flutter** application that serves as a custom in-room TV launcher/home screen
for hotels. It replaces the default TV home screen, shows a personalized welcome
when a guest checks in (via Exely PMS), and stays in real-time sync with the
`backend/` over WebSocket.

> Despite the folder name, this is the **cross-platform Flutter project** and is
> the current/primary TV client. It builds for **Android TV** (APK) and, via
> `flutter-tizen`, for **Samsung Tizen** (TPK) — superseding the legacy HTML5
> app in the top-level `tizen/` folder. (The `android/tizen/` subfolder here is
> the Flutter project's Tizen build target, not the legacy app.)

---

## Overview

The app is a state machine with four screens, driven by device/guest state and
live WebSocket events:

| State | Condition | Screen |
| --- | --- | --- |
| **Splash** | initializing | loading spinner |
| **Provisioning** | no device token | room-number entry + device registration |
| **Attract** | token, no guest | hotel branding + clock (unoccupied) |
| **Welcome** | token + guest | greeting, stay dates, services grid, weather |

---

## Tech stack

| Aspect | Details |
| --- | --- |
| Language / SDK | Dart (Flutter 3), Dart SDK `^3.12.0` |
| State management | flutter_riverpod **^2.6.1** |
| HTTP | dio **^5.8.0** |
| WebSocket | web_socket_channel **^3.0.2** |
| Local storage | shared_preferences **^2.3.5** |
| Images | cached_network_image **^3.4.1** |
| i18n | intl **^0.20.2**, flutter_localizations |
| Android build | Gradle (AGP 9.0.1, Kotlin 2.3.20, JVM 17), minSdk 21 |
| Tizen build | flutter-tizen (`tizen/` target, api-version 6.5, profile `tv`) |

No secrets are hardcoded — server URLs are injected at build time via
`--dart-define`.

---

## Project structure

```
android/                                  # Flutter project root
├── lib/
│   ├── main.dart                         # entry: immersive mode, ProviderScope
│   ├── app.dart                          # MaterialApp + AppRouter (screen switching)
│   ├── core/
│   │   ├── constants.dart                # API_BASE_URL / WS_BASE_URL (dart-define)
│   │   ├── platform.dart                 # IS_TIZEN compile-time flag
│   │   └── storage/                      # AppStorage interface + SharedPreferences impl
│   ├── data/
│   │   ├── models/                       # RoomConfig, GuestInfo, HotelService, …, AnnouncementData
│   │   ├── api_client.dart               # Dio client (X-Device-Token header)
│   │   └── repositories/                 # device_repository, room_repository
│   ├── services/
│   │   └── websocket_service.dart        # connect, exponential backoff, ping/pong
│   ├── providers/                        # Riverpod notifiers (token, config, clock, ws, screen)
│   └── presentation/
│       ├── screens/                      # splash, provisioning, attract, welcome
│       └── widgets/                      # clock, weather, service_grid, background, announcement_overlay
├── android/                              # Android native module (Gradle, AndroidManifest)
├── tizen/                                # Tizen build target (tizen-manifest.xml, project_def.prop)
├── pubspec.yaml
└── test/
```

### AndroidManifest highlights

- **Package:** `com.hoteltv.launcher`, label "Hotel TV".
- **Launcher registration:** intent filter with `CATEGORY_HOME` +
  `CATEGORY_LEANBACK_LAUNCHER` → becomes the default TV launcher.
- **Features:** `android.software.leanback` and `touchscreen` both
  `required="false"` (D-pad navigation).
- **Permissions:** `INTERNET`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE(_CONNECTED_DEVICE)`.
- Immersive sticky UI; Back button blocked (`PopScope(canPop: false)`).

---

## Configuration (build-time `--dart-define`)

| Variable | Default | Production example |
| --- | --- | --- |
| `API_BASE_URL` | `http://192.168.1.100:3000` | `https://tv.yourhotel.com` |
| `WS_BASE_URL` | `ws://192.168.1.100:3000` | `wss://tv.yourhotel.com` |
| `IS_TIZEN` | `false` | `true` (Tizen builds) |

`lib/core/platform.dart` exposes `AppPlatform.isTizen` / `isAndroidTV` for
conditional logic.

---

## Building & running

### Android TV

```bash
cd android
flutter pub get
flutter run -d <device-id>            # debug on a connected device

# release APK
flutter build apk --release \
  --dart-define=API_BASE_URL=https://tv.yourhotel.com \
  --dart-define=WS_BASE_URL=wss://tv.yourhotel.com
# → build/app/outputs/flutter-apk/app-release.apk

adb install app-release.apk
adb shell cmd package set-home-activity com.hoteltv.launcher/.MainActivity
```

### Tizen

```bash
cd android
flutter-tizen run --dart-define=IS_TIZEN=true
# (flutter-tizen build tpk … for a packaged TPK)
```

---

## How it works

### HTTP API (header `X-Device-Token`)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/devices/register` | `{ roomNumber }` → `{ deviceToken }` |
| GET | `/api/v1/room/config` | guest, services, background, hotel, weather |
| GET | `/api/v1/room/ping` | heartbeat |
| WS | `/api/v1/ws?token=<deviceToken>` | real-time event stream |

### WebSocket events (server → app)

| Event | Action |
| --- | --- |
| `REFRESH_CONFIG` | re-fetch `/room/config` |
| `CLEAR_GUEST` | Welcome → Attract |
| `SHOW_ANNOUNCEMENT` | slide-in overlay for N seconds |
| `UPDATE_BACKGROUND` | swap background without reload |
| `REBOOT` | reboot the device (Android platform channel) |
| `PING` | auto-reply `PONG` |

The WebSocket service reconnects with exponential backoff (1s → 30s) and runs a
ping every 30s expecting a pong within 10s.

---

## Relationship to the other projects

- **`backend/`** — the API and event source (device-token auth + WebSocket).
- **`tizen/` (top-level)** — the legacy HTML5 client this Flutter app replaces;
  the Tizen build of this project is the modern equivalent.
- **`admin/`** — staff control these TVs (announcements, background, reboot)
  through the backend.
- **Exely PMS** — guest data flows Exely → backend → this app.
- **`hotel-menu/`** — unrelated (separate in-room food-ordering web app).
