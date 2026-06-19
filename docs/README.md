# Documentation

This repository contains **two independent product lines** that happen to share a
monorepo:

### 1. Hotel TV platform
A custom in-room **TV launcher** for hotels (Android TV + Samsung Tizen) with a
Node backend and an admin dashboard, integrated with **Exely PMS** for automated
check-in/check-out personalization.

### 2. Hotel Menu
A separate, self-contained **in-room dining ordering** web app (guest QR menu +
kitchen POS + admin). Not connected to the TV platform.

---

## Per-project documentation

| Project | Doc | What it is | Stack |
| --- | --- | --- | --- |
| `android/` | [android.md](./android.md) | Flutter TV launcher — **the current TV client**, builds for Android TV + Tizen | Flutter / Dart, Riverpod |
| `backend/` | [backend.md](./backend.md) | Central API + WebSocket server for the TV platform | Fastify, Prisma, PostgreSQL, Redis |
| `tizen/` | [tizen.md](./tizen.md) | **Legacy** HTML5 Tizen web app (superseded by `android/`) | Vanilla JS, Tizen WRT |
| `admin/` | [admin.md](./admin.md) | Staff dashboard to monitor/control the TVs | Next.js, React Query |
| `hotel-menu/` | [hotel-menu.md](./hotel-menu.md) | In-room dining ordering platform (guest / POS / admin) | Next.js, Prisma, SQLite |

---

## How the Hotel TV pieces fit together

```
                ┌───────────────┐
  Exely PMS ───▶│   backend/    │◀──── admin/  (manage rooms, services, content)
  (webhooks)    │ Fastify + DB  │      (Next.js dashboard, JWT)
                │ Redis pub/sub │
                └──────┬────────┘
                       │ device token + WebSocket (/api/v1/ws)
            ┌──────────┴───────────┐
            ▼                      ▼
       android/                 tizen/
   (Flutter, Android TV       (legacy HTML5
    + Tizen — current)         web app)
```

- The TV clients register for a **device token**, fetch `/room/config`, and hold
  a **WebSocket** for live updates (refresh, clear guest, announcement,
  background, reboot).
- The **admin** panel and **Exely** webhooks both mutate backend state, which
  fans out to the relevant TVs via Redis pub/sub.

## Hotel Menu (independent)

`hotel-menu/` is a standalone Next.js app with its **own** database (SQLite) and
API (Next.js route handlers) — it does not use `backend/`. See
[hotel-menu.md](./hotel-menu.md) for its three surfaces (guest menu, kitchen POS,
admin), multi-hotel model, en/ru/uz auto-translation, and UZS pricing.

---

## Quick start pointers

- **TV platform:** start `backend/` (see [backend.md](./backend.md)), then run
  `android/` with Flutter; manage it from `admin/`.
- **Hotel Menu:** `cd hotel-menu && npm install && npm run setup && npm run dev`
  (see [hotel-menu.md](./hotel-menu.md)).

Each doc has its own detailed setup, configuration, and API sections.
