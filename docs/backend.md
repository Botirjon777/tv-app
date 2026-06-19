# `backend/` — Hotel TV Platform API

The central **Node.js + Fastify** REST API and WebSocket server for the Hotel TV
platform. It stores hotels/rooms/guests in PostgreSQL (via Prisma), receives
guest check-in/out events from **Exely PMS**, pushes real-time updates to the TV
clients (`android/`, `tizen/`) over WebSocket, and exposes the admin API that the
`admin/` dashboard drives.

---

## Overview

The backend is the hub that connects four parties:

```
[Exely PMS] ──webhook──► [Backend + PostgreSQL] ──Redis pub/sub──► [TVs via WebSocket]
                              ▲
                              │ REST (JWT)
                          [Admin panel]
```

- **Exely PMS → backend:** reservation events (created / checked-in / modified /
  checked-out / cancelled) upsert guest records.
- **Backend → TVs:** changes publish to a per-room Redis channel; each TV holds a
  WebSocket and reacts (refresh config, clear guest, show announcement, change
  background, reboot).
- **Admin → backend:** staff manage rooms, services, content, and devices over a
  JWT-protected REST API.

---

## Tech stack

| Concern | Choice (version) |
| --- | --- |
| HTTP server | Fastify **^4.27.0** |
| WebSocket | @fastify/websocket **^8.3.1** |
| Auth | @fastify/jwt **^8.0.1** (admin) + device tokens (TVs) |
| ORM / DB | Prisma **^5.16.0** + **PostgreSQL** |
| Pub/sub & cache | ioredis **^5.4.1** (Redis) |
| Media storage | @aws-sdk/client-s3 + s3-request-presigner **^3.600.0** (S3 / MinIO) |
| Validation | Zod **^3.23.8** |
| Passwords | bcryptjs **^2.4.3** |
| Language / tooling | TypeScript **^5.5.3**, ts-node-dev, pino-pretty |

All routes are served under the `/api/v1` prefix; `/health` is unprefixed.

---

## Project structure

```
backend/
├── prisma/
│   └── schema.prisma          # Hotel, Room, RoomGuest, HotelService, HotelContent, WeatherCache
├── src/
│   ├── index.ts               # bootstrap: register plugins + routes, /health, PORT/HOST
│   ├── plugins/
│   │   ├── prisma.ts          # PrismaClient → server.prisma
│   │   └── redis.ts           # Redis client + subscriber → server.redis / server.redisSub
│   ├── routes/
│   │   ├── room.ts            # TV-facing endpoints (X-Device-Token) + WS /ws
│   │   ├── admin.ts           # admin API (JWT, requireAdmin)
│   │   ├── devices.ts         # POST /devices/register (Zod-validated)
│   │   └── webhooks.ts        # POST /webhooks/exely (HMAC-verified)
│   └── services/
│       ├── pushService.ts     # Redis pub/sub: pushToRoom / broadcastToHotel
│       └── weatherService.ts  # OpenWeatherMap + 15-min PostgreSQL cache
├── Dockerfile                 # multi-stage; runs prisma migrate deploy on start
├── docker-compose.yml         # backend + postgres + redis + (optional) minio
└── package.json
```

---

## Data model (Prisma / PostgreSQL)

| Model | Key fields | Notes |
| --- | --- | --- |
| **Hotel** | `name`, `city`, `countryCode`, `timezone`, `defaultLanguage`, `logoUrl` | has rooms, services, content |
| **Room** | `hotelId`, `roomNumber`, `floor`, unique `deviceToken`, `deviceType`, `backgroundUrl`, `lastSeenAt` | unique `(hotelId, roomNumber)` |
| **RoomGuest** | `roomId`, `exelyReservationId`, name, `guestLanguage`, `checkIn`, `checkOut` | upserted from Exely |
| **HotelService** | `hotelId`, `label` (JSON i18n), `iconUrl`, `sortOrder`, `available`, `deepLink` | shown on TVs |
| **HotelContent** | `hotelId`, `contentType`, `title`/`body` (JSON i18n), `mediaUrl`, `active`, `displayFrom`/`displayUntil`, `priority` | scheduled content |
| **WeatherCache** | `cityKey` (PK), `data` (JSON), `fetchedAt` | 15-minute TTL |

**Enums:** `DeviceType` = `android_tv | tizen` · `ContentType` = `background | announcement | menu_item | promo`.

---

## API surface

### TV-facing (header `X-Device-Token`, no JWT)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/devices/register` | Register a TV (room number + hotel) → `device_token` |
| GET | `/room/config` | Room + hotel + guest + weather + services + active announcements |
| GET | `/room/ping` | Heartbeat (updates `lastSeenAt`) |
| GET | `/hotel/services` | Sorted available services |
| GET | `/hotel/content/:type` | Content of a type, respecting the schedule window |
| WS | `/ws?token=<deviceToken>` | Real-time event stream (PING/PONG keep-alive) |

### Admin (JWT `Authorization: Bearer …`)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/admin/login` | Single admin (env `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`) → 8h JWT |
| GET | `/admin/rooms` · `/admin/rooms/:id` | List rooms / room detail |
| PUT | `/admin/rooms/:id/background` | Set background + push `UPDATE_BACKGROUND` |
| POST | `/admin/push/:roomId` | Push `SHOW_ANNOUNCEMENT` to a room |
| POST | `/admin/push-reboot/:roomId` | Push `REBOOT` |
| GET | `/admin/devices` | Devices with online status (≤5-min `lastSeenAt`) |
| GET/POST/PUT/DELETE | `/admin/services` | Service CRUD (broadcasts `REFRESH_CONFIG`) |
| GET/POST/PUT | `/admin/content` | Content CRUD |
| POST | `/admin/media/presign` | S3 presigned upload URL (returns upload + public URL) |

### Webhooks

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/webhooks/exely` | Exely PMS events (HMAC-SHA256 verified) → upsert guests, push to TVs |

### WebSocket events (server → TV, via Redis channel `room:<roomId>`)

`REFRESH_CONFIG` · `CLEAR_GUEST` · `UPDATE_BACKGROUND {url}` ·
`SHOW_ANNOUNCEMENT {message, duration?}` · `REBOOT` · `PING`.

---

## External integrations

- **Exely PMS** — `POST /webhooks/exely`, HMAC-SHA256 signature checked against
  `EXELY_WEBHOOK_SECRET`. Maps reservations to rooms and pushes `REFRESH_CONFIG`
  / `CLEAR_GUEST`.
- **Redis** — pub/sub fan-out of WebSocket events to the right room(s).
- **S3 / MinIO** — media uploads via presigned URLs (MinIO provided for local dev).
- **OpenWeatherMap** — weather for the welcome screen, cached 15 min in Postgres.

---

## Configuration (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | — (required) | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `JWT_SECRET` | — (required, 64+ chars) | Signs admin JWTs |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | — | Single admin login (bcrypt hash) |
| `EXELY_WEBHOOK_SECRET` | — | Exely HMAC shared secret |
| `OPENWEATHER_API_KEY` | — | Weather lookups |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_REGION` | S3 defaults | Media storage |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | Server bind |
| `NODE_ENV` | `development` | Environment |

---

## Getting started

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL, REDIS_URL, JWT_SECRET, …
npm install

# bring up Postgres + Redis (+ MinIO) for local dev
docker-compose up -d postgres redis

npm run db:migrate            # apply Prisma migrations
npm run db:generate           # generate the Prisma client
npm run dev                   # ts-node-dev on PORT (default 3000)
```

### Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `ts-node-dev --respawn --transpile-only src/index.ts` | Dev server (auto-reload) |
| `build` | `tsc` | Compile to `dist/` |
| `start` | `node dist/index.js` | Run compiled server |
| `db:migrate` | `prisma migrate dev` | Create/apply migrations |
| `db:generate` | `prisma generate` | Generate Prisma client |
| `db:studio` | `prisma studio` | Prisma Studio UI |
| `db:seed` | `ts-node prisma/seed.ts` | Seed data (if `seed.ts` present) |

### Docker

```bash
docker-compose up -d          # backend + postgres + redis (+ minio)
```

The Dockerfile is multi-stage (build → run) and executes
`npx prisma migrate deploy` on container start; the API listens on **3000**.

---

## Relationship to the other projects

- **`android/` & `tizen/`** — the TV clients; they register for a device token,
  hold a WebSocket to `/ws`, and render `/room/config`.
- **`admin/`** — the management UI; a pure client of `/api/v1/admin/*`.
- **Exely PMS** — upstream source of guest/reservation data.
- **`hotel-menu/`** — unrelated; it has its own separate backend (Next.js route
  handlers + SQLite) and does not use this service.
