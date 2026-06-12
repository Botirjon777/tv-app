# Hotel TV Launcher

A single Flutter codebase that compiles to both **Android TV** (APK) and **Samsung Tizen** (TPK). When a guest checks in via Exely PMS, the room TV instantly shows a personalised welcome screen — no manual staff action required.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Building for Android TV](#building-for-android-tv)
- [Building for Samsung Tizen](#building-for-samsung-tizen)
- [App Screens](#app-screens)
- [Real-Time Events](#real-time-events)
- [Backend API Contract](#backend-api-contract)

---

## Overview

| Component | Technology |
|---|---|
| TV app | Flutter 3 / Dart — single codebase (APK + TPK) |
| Backend API | Node.js + Fastify + TypeScript (in `../backend/`) |
| Database | PostgreSQL + Prisma ORM |
| Exely integration | Webhook handler in backend |
| Admin dashboard | React 18 + shadcn/ui (not yet built) |

**App state machine:**

```
No device token  →  Provisioning screen  (enter room number, register device)
Token + no guest →  Attract screen       (hotel branding, clock, slideshow)
Token + guest    →  Welcome screen       (guest name, stay dates, clock, weather, services)
```

State transitions happen in real-time via WebSocket events pushed from the backend when Exely PMS fires check-in / check-out webhooks.

---

## Prerequisites

### Android TV

| Tool | Version | Notes |
|---|---|---|
| Flutter SDK | 3.x | `flutter --version` |
| Android Studio | Latest | Required for Android SDK |
| Android SDK | API 21+ | Set in Android Studio SDK Manager |
| ADB | Any | For device installation |

Install Flutter: https://docs.flutter.dev/get-started/install

### Samsung Tizen (additional)

| Tool | Version | Notes |
|---|---|---|
| Tizen Studio | 5.x | https://developer.tizen.org/development/tizen-studio |
| flutter-tizen CLI | Latest | https://github.com/flutter-tizen/flutter-tizen |
| Samsung certificate | — | Required to sign TPK for real devices |

Install flutter-tizen after Tizen Studio:

```bash
git clone https://github.com/flutter-tizen/flutter-tizen.git
export PATH="$PATH:/path/to/flutter-tizen/bin"
flutter-tizen doctor
```

> **Note:** Tizen custom launchers only work on commercial B2B displays (Samsung QBxx / QMxx / BExx series) enrolled in Samsung LYNK or VXT. Consumer TVs do not permit replacing the system launcher.

---

## Project Structure

```
android/                          ← Flutter project root
├── lib/
│   ├── main.dart                 ← Entry point (ProviderScope, immersive mode)
│   ├── app.dart                  ← MaterialApp + AppRouter (screen switching)
│   │
│   ├── core/
│   │   ├── constants.dart        ← API_BASE_URL, WS_BASE_URL, storage keys
│   │   ├── platform.dart         ← kIsTizen compile-time constant
│   │   └── storage/
│   │       ├── app_storage.dart          ← Abstract storage interface
│   │       └── shared_prefs_storage.dart ← Android + Tizen implementation
│   │
│   ├── data/
│   │   ├── models/
│   │   │   ├── room_config.dart   ← RoomConfig, GuestInfo, HotelService,
│   │   │   │                          BackgroundConfig, HotelInfo, WeatherData
│   │   │   └── announcement_data.dart ← AnnouncementData, AnnouncementPriority
│   │   ├── api_client.dart        ← Dio HTTP client (X-Device-Token header)
│   │   └── repositories/
│   │       ├── device_repository.dart ← register device, read/clear token
│   │       └── room_repository.dart   ← fetch room config
│   │
│   ├── services/
│   │   └── websocket_service.dart ← WS connection, exponential backoff,
│   │                                   ping/pong keepalive
│   │
│   ├── providers/                 ← Riverpod 2 state management
│   │   ├── storage_provider.dart
│   │   ├── device_token_provider.dart
│   │   ├── room_config_provider.dart  ← AsyncNotifier, clearGuest, updateBackground
│   │   ├── clock_provider.dart        ← 1-second StreamProvider<DateTime>
│   │   ├── announcement_provider.dart ← StateNotifier<AnnouncementData?>
│   │   ├── websocket_provider.dart    ← WS service + event dispatcher
│   │   └── app_screen_provider.dart   ← Derives current screen from state
│   │
│   └── presentation/
│       ├── screens/
│       │   ├── splash_screen.dart       ← Loading indicator while app initialises
│       │   ├── provisioning_screen.dart ← Room number entry + device registration
│       │   ├── attract_screen.dart      ← Unoccupied: hotel branding + clock
│       │   └── welcome_screen.dart      ← Occupied: guest name, dates, services
│       └── widgets/
│           ├── clock_widget.dart        ← HH:mm + date, 1-second updates
│           ├── weather_widget.dart      ← Temperature, icon, description
│           ├── service_grid.dart        ← D-pad-focusable service tiles
│           ├── background_widget.dart   ← Full-screen image or colour + gradient
│           └── announcement_overlay.dart ← Slide-in bar, auto-dismiss
│
├── android/                      ← Android native project
│   └── app/src/main/
│       ├── AndroidManifest.xml   ← CATEGORY_HOME + LEANBACK_LAUNCHER (TV launcher)
│       └── build.gradle.kts      ← applicationId com.hoteltv.launcher, minSdk 21
│
├── tizen/                        ← Tizen native project
│   ├── tizen-manifest.xml        ← profile tv, api-version 6.5, privileges
│   └── project_def.prop          ← flutter-tizen build config
│
├── pubspec.yaml                  ← Dependencies
└── test/
    └── widget_test.dart
```

---

## Configuration

Runtime configuration is passed via `--dart-define` at build time. No secrets are committed.

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | `http://192.168.1.100:3000` | Backend HTTP base URL |
| `WS_BASE_URL` | `ws://192.168.1.100:3000` | Backend WebSocket base URL |
| `IS_TIZEN` | `false` | Set to `true` when building for Tizen |

Example for a production build pointing at your server:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://tv.yourhotel.com \
  --dart-define=WS_BASE_URL=wss://tv.yourhotel.com
```

---

## Building for Android TV

### 1. Install dependencies

```bash
cd android/
flutter pub get
```

### 2. Debug build (USB-connected Android TV)

Enable ADB debugging on the TV: **Settings → Device Preferences → About → Build** (tap 7 times) → enable ADB.

```bash
# Verify device is visible
adb devices

# Run directly on device
flutter run -d <device-id>
```

### 3. Release APK

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=http://YOUR_SERVER:3000 \
  --dart-define=WS_BASE_URL=ws://YOUR_SERVER:3000
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### 4. Install on device

```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

After installation, go to **Settings → Home screen** on the TV and select **Hotel TV** as the default launcher.

### 5. Set as default launcher via ADB (optional)

```bash
adb shell cmd package set-home-activity com.hoteltv.launcher/.MainActivity
```

### Android TV notes

- The app registers itself as a TV launcher via `CATEGORY_HOME` + `CATEGORY_LEANBACK_LAUNCHER` in the manifest.
- `minSdk = 21` (Android 5.0) — covers all Android TV hardware in use.
- Back button is blocked on all main screens (`PopScope(canPop: false)`).
- D-pad navigation uses Flutter's built-in focus system with gold focus highlight on interactive elements.

---

## Building for Samsung Tizen

> Complete Android TV first and confirm the app works on a device before touching the Tizen build. If something breaks, you need to know which toolchain is the problem.

### Prerequisites check

```bash
flutter-tizen doctor
```

All items must be green before proceeding.

### 1. Initialise Tizen project (first time only)

The `tizen/` directory with `tizen-manifest.xml` is already present. If you need to regenerate it:

```bash
cd android/
flutter-tizen create .
```

This merges the Tizen project into the existing Flutter project without overwriting `lib/` or `pubspec.yaml`.

### 2. Debug build (Tizen device / emulator)

```bash
cd android/
flutter-tizen run \
  --dart-define=IS_TIZEN=true \
  --dart-define=API_BASE_URL=http://YOUR_SERVER:3000 \
  --dart-define=WS_BASE_URL=ws://YOUR_SERVER:3000
```

### 3. Release TPK

```bash
flutter-tizen build tpk --release \
  --dart-define=IS_TIZEN=true \
  --dart-define=API_BASE_URL=https://tv.yourhotel.com \
  --dart-define=WS_BASE_URL=wss://tv.yourhotel.com
```

Output: `build/tizen/tpk/hotel_tv_launcher-1.0.0.tpk`

The TPK must be signed with a Samsung distributor certificate before it can be installed on a commercial TV. Set up signing in Tizen Studio: **Tools → Certificate Manager**.

### 4. Install on a commercial TV

**Via Tizen Studio device manager:**

```bash
sdb connect <TV_IP>
sdb devices
flutter-tizen install --device-id <device-id>
```

**Via Samsung LYNK / VXT fleet management:** upload the signed TPK through the LYNK admin portal for OTA deployment to all enrolled devices.

### Tizen manifest summary

```
package:     com.hoteltv.launcher
api-version: 6.5  (Tizen 6.5 — covers QBxx/QMxx/BExx from 2021+)
profile:     tv
privileges:  internet, display, tv.inputdevice
```

### Platform differences handled in code

| Behaviour | Android TV | Samsung Tizen |
|---|---|---|
| Storage | `SharedPreferences` (Android impl) | `SharedPreferences` (Tizen impl via flutter-tizen) |
| WebSocket | Main isolate | Main isolate |
| Platform detection | `kIsTizen = false` | `kIsTizen = true` (via `--dart-define`) |
| Build output | APK | TPK |

---

## App Screens

### Splash screen
Shown while the app reads stored credentials and fetches the initial room config. No interaction required.

### Provisioning screen
Shown on first launch (no device token stored).

1. Enter the room number assigned in the hotel admin dashboard.
2. Tap **REGISTER** — the app calls `POST /api/v1/devices/register` and stores the returned `deviceToken`.
3. The app automatically navigates to the Attract or Welcome screen.

D-pad: focus moves between the text field and the Register button.

### Attract screen
Shown when the room is unoccupied. Displays hotel name, logo, and a live clock. Updates to the Welcome screen automatically when a guest checks in.

### Welcome screen
Shown when the room is occupied.

- **Top-left:** hotel logo or name
- **Top-right:** weather + live clock
- **Centre:** "WELCOME / *Guest Name*" + stay dates
- **Bottom strip:** D-pad-navigable service tiles (Room Service, Spa, Restaurant, etc.)

When a guest checks out the screen returns to Attract automatically.

### Announcement overlay
A bar slides up from the bottom over any screen. Auto-dismisses after the configured duration (default 10 s). Three priority levels:

| Priority | Colour | Use case |
|---|---|---|
| `info` | Blue | General hotel notices |
| `warning` | Amber | Urgent alerts |
| `promo` | Gold | Promotions / offers |

---

## Real-Time Events

The app maintains a persistent WebSocket connection to `WS_BASE_URL/api/v1/ws?token=<deviceToken>` with exponential backoff on disconnect (1 → 2 → 4 → 8 → 16 → 30 s cap) and a 30-second PING / 10-second PONG-timeout keepalive.

| Event type | App action |
|---|---|
| `REFRESH_CONFIG` | Re-fetch room config from API |
| `CLEAR_GUEST` | Remove guest, switch to Attract screen |
| `SHOW_ANNOUNCEMENT` | Show overlay bar for `payload.duration` seconds |
| `UPDATE_BACKGROUND` | Swap background image/colour without reload |
| `REBOOT` | (Android) Reboot device via platform channel |
| `PING` | Reply with `PONG` |

---

## Backend API Contract

All TV endpoints require the `X-Device-Token` header.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/devices/register` | Register device, returns `{ deviceToken }` |
| `GET` | `/api/v1/room/config` | Full room config (guest, services, background, weather) |
| `GET` | `/api/v1/room/ping` | Heartbeat |
| `WS` | `/api/v1/ws?token=` | Real-time event stream |

Backend source: `../backend/` — Node.js 20 / Fastify 4 / TypeScript / Prisma / PostgreSQL / Redis.
