# Architecture

## Overview

```
                         ┌────────────────────────────────────────────┐
   Android TV / Tizen ───┤  X-Device-Token  →  /room/*, /hotel/*, /ws  │
   (my-hotel launcher)   │                                            │
                         │              Fastify backend               │
   Admin panel  ─────────┤  JWT (hotel_admin)  →  /admin/*            │
   (Next.js)             │                                            │
                         │              (this service)                │
   hotel-menu web  ──────┤  X-Internal-Key  →  /menu/data/*           │
   (Next.js)             │  public          →  /menu/* (menu, orders) │
                         │                                            │
   Exely PMS  ───────────┤  HMAC signature  →  /webhooks/exely        │
                         └───────────────┬──────────────┬─────────────┘
                                         │              │
                                   PostgreSQL         Redis
                                   (Prisma)        (pub/sub cache)
                                                        │
                                                  WebSocket push → TVs
```

The whole service is a single Fastify process. In production it sits behind
**Caddy**, which terminates TLS and reverse-proxies to it.

## Bootstrap sequence (`src/index.ts`)

1. **`loadEnv()`** — parse & validate all environment variables with Zod. On any
   problem the process prints the issues and `exit(1)` — nothing else starts.
   (See [CONFIGURATION.md](./CONFIGURATION.md).)
2. Create the Fastify instance with `trustProxy: true`, a 1 MB JSON `bodyLimit`,
   and log redaction for auth headers.
3. Register a raw-body-capturing JSON content-type parser (so webhook HMAC can
   hash the exact bytes received).
4. Install a uniform error handler (hides 5xx internals in production) and a
   JSON 404 handler.
5. Register plugins in order: **security** (helmet + rate-limit) → cors → jwt →
   multipart → websocket → prisma → redis → media.
6. Register route groups under the `/api/v1` prefix.
7. Expose `GET /health`.
8. Wire `SIGINT`/`SIGTERM` to `server.close()` for graceful shutdown.

## Source layout

```
src/
  index.ts              Bootstrap, error handling, graceful shutdown
  auth.ts               requireAdmin guard (JWT + role check)
  config/
    env.ts              Zod env schema, loadEnv(), corsOrigin()
  plugins/
    security.ts         helmet + global rate limit
    prisma.ts           PrismaClient lifecycle (connect/disconnect)
    redis.ts            Two ioredis clients (command + subscriber)
    media.ts            Upload dir + @fastify/static serving at /media
  routes/
    room.ts             TV-facing: /room/config, /room/ping, /hotel/*, /ws
    devices.ts          Device registration + token minting
    admin.ts            Staff API (JWT): rooms, services, content, media, push
    serviceRequests.ts  Guest requests (public POST) + admin list/patch
    menuApi.ts          Public dining REST API (hotels, categories, orders…)
    menuData.ts         Internal raw-Prisma bridge for the hotel-menu app
    webhooks.ts         Exely PMS webhook (HMAC-verified)
  services/
    pushService.ts      Redis pub/sub helpers (pushToRoom, broadcastToHotel)
    weatherService.ts   OpenWeatherMap fetch with DB cache
    telegramService.ts  Optional Telegram notifications
  scripts/
    hash-password.ts    bcrypt hash generator for the admin password
```

## Authentication surfaces

There are **four independent auth mechanisms**, one per client type — see
[SECURITY.md](./SECURITY.md) for details:

| Client | Credential | Used by |
|--------|-----------|---------|
| Room TV | `X-Device-Token` header (32-byte hex, per room) | `/room/*`, `/hotel/*`, `/ws` |
| Admin staff | JWT (`role: hotel_admin`, 8 h expiry) | `/admin/*` |
| hotel-menu server | `X-Internal-Key` header | `/menu/data/*` |
| Exely PMS | HMAC-SHA256 body signature | `/webhooks/exely` |

Public (unauthenticated) endpoints exist for guest-facing dining flows
(`/menu/hotels`, `/menu/products`, `/menu/orders`, `/menu/requests`, …). They are
protected by rate limiting rather than a credential.

## Real-time push

Room state changes (guest checked in, background changed, announcement, reboot)
are delivered to TVs over WebSocket:

1. A route handler calls `pushToRoom(server, roomId, event)`.
2. That `PUBLISH`es a JSON event to the Redis channel `room:<roomId>`.
3. Each connected TV holds a WebSocket at `/api/v1/ws?token=<deviceToken>`; the
   handler `SUBSCRIBE`s a dedicated Redis connection to that room's channel and
   forwards every message to the socket.

Using Redis pub/sub (rather than in-process fan-out) means the backend can be
horizontally scaled — any instance can push to a TV connected to any other
instance.

## Data model

Two logical domains share one Postgres database (see `prisma/schema.prisma`):

- **TV platform**: `Hotel`, `Room`, `RoomGuest`, `HotelService`, `HotelContent`,
  `WeatherCache`. `Room.deviceToken` is the device credential; `RoomGuest` is
  populated from Exely webhooks.
- **Hotel-menu (dining)**: `MenuHotel`, `MenuRoom`, `MenuGuest`, `Category`,
  `Product`, `Recommendation`, `Order`, `OrderItem`, `ServiceRequest`. The
  `Menu*` models are named distinctly so they don't collide with the TV models.

The hotel-menu Next.js app persists through this backend's `/menu/data` bridge
instead of its own SQLite file, so the same Prisma engine runs its queries
against Postgres.
