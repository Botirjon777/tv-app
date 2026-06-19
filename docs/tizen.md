# `tizen/` — Legacy Samsung Tizen TV Web App

A **Samsung Tizen TV web application** (HTML5 + vanilla JavaScript) that acts as
an in-room hotel TV launcher. It shows a personalized welcome screen for checked-in
guests, an idle "attract" screen otherwise, and syncs live with the `backend/`
over WebSocket.

> **Status: legacy.** Per the repo root README, this HTML5 Tizen app has been
> **superseded by the Flutter app in `android/`**, which builds for both Android TV
> and Tizen (via `flutter-tizen`). This folder is kept as the original reference
> implementation. Don't confuse it with `android/tizen/` (the Flutter project's
> Tizen build target) — that is a different thing.

---

## Overview

The app is a single-page web app with three screens it switches between:

1. **Provisioning** — first launch; staff enter a room number and hotel ID to
   register the device.
2. **Attract** — unoccupied room: hotel branding, clock/date, a scrolling
   announcements ticker, and a connection indicator.
3. **Welcome** — checked-in guest: personalized greeting, stay info, weather,
   and a grid of hotel services.

App metadata (from `config.xml`): name **Hotel TV**, description *"Hotel room
launcher with Exely PMS integration"*.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Type | Tizen Web app (Tizen WRT / Web Runtime) — packaged as a `.wgt` |
| Languages | HTML5 + **vanilla JavaScript** (modular IIFE pattern) + CSS |
| Framework | None (no npm, bundler, or transpilation) |
| Build | Tizen Studio / Tizen CLI (`tizen_web_project.yaml`, API version 10.0) |
| Target | 1920×1080, landscape-locked; Tizen **4.0+** required |
| Device storage | `tizen.preference` API |

---

## Project structure

```
tizen/
├── config.xml                 # Tizen app manifest (id, privileges, entry point)
├── index.html                 # single page; #screen-provisioning / -attract / -welcome
├── tizen_web_project.yaml      # Tizen Studio build config (profile: tizen, api 10.0)
├── js/
│   ├── api.js                 # REST client + WebSocket URL builder; device storage
│   ├── app.js                 # core state machine, screen rendering, WS event handling
│   └── clock.js               # live clock/date with i18n (en, ru, uz, kk, de, fr, tr…)
├── css/
│   └── style.css              # TV UI (glassmorphic, cursor: none, large fonts)
└── Debug/
    └── tizen.wgt              # built package artifact
```

### `config.xml` highlights

- **App id:** `com.yourcompany.hoteltv` · widget id `https://yourcompany.com/hoteltv`
- **Required Tizen version:** 4.0
- **Privileges:** `internet`, `display`, `tv.inputdevice`
- **Settings:** `background-support=enable`, `screen-orientation=landscape`,
  `context-menu=disable`
- **Entry point:** `index.html`

---

## Building & running

The app is packaged as a Tizen Web Application Widget (`.wgt`).

**Tizen Studio (GUI):** import as a Tizen Web Project (profile `tizen`, API 10.0)
→ Build Project → Package → Run On (connected TV).

**Tizen CLI:**

```bash
tizen build-web -- <project_dir>
tizen package -t wgt -o <output_dir> -- <project_dir>
tizen install -n tizen.wgt -t <device-id>
```

There are no custom build scripts — Tizen Studio / CLI handle packaging.

---

## How it works

### Configuration (stored via `tizen.preference`)

| Key | Purpose |
| --- | --- |
| `backend_url` | Backend base URL (default `https://your-backend.com`) |
| `device_token` | Auth token returned at registration |
| `hotel_id` | Hotel/property identifier |

### Backend integration (`/api/v1`, header `X-Device-Token`)

| Endpoint | Purpose |
| --- | --- |
| `POST /devices/register` | Provision device (room number + hotel ID) → `device_token` |
| `GET /room/config` | Room/guest/services/weather/background/announcements |
| `GET /room/ping` | Heartbeat (every ~60s) |
| `GET /hotel/services` · `/hotel/content/{type}` | Services / content |
| `WS /ws?token=<token>` | Real-time updates (token via query param) |

### WebSocket events (server → TV)

`REFRESH_CONFIG`, `CLEAR_GUEST`, `SHOW_ANNOUNCEMENT`, `UPDATE_BACKGROUND`,
`REBOOT`, `PING`/`PONG`. The client auto-reconnects with exponential backoff
(1s → 30s) and runs a 60s ping watchdog.

### TV-specific UX

- D-pad navigation: Left/Right move between service tiles, Enter activates,
  **Back is blocked** (the app won't exit).
- No mouse cursor (`cursor: none`); focus-driven highlight; large fonts for
  across-the-room readability; auto-scrolling ticker; green/red connection dot.
- Re-fetches config on `visibilitychange` (app resume).

---

## Relationship to the other projects

- **`backend/`** — the single source of config and live events (same device-token
  + WebSocket contract the Flutter app uses).
- **`android/`** — the Flutter successor that now targets both Android TV and
  Tizen; new work should go there.
- **Exely PMS** — guest data arrives at the backend via Exely webhooks and is
  reflected on this screen.
- **`admin/`** — staff control this screen (announcements, background, reboot)
  through the backend.
