# API Reference

Base path: **`/api/v1`** (media is served at `/media`, health at `/health`).
All request/response bodies are JSON unless noted. Timestamps are ISO-8601.

## Auth legend

| Symbol | Meaning |
|--------|---------|
| 🌐 Public | No credential (rate-limited) |
| 📺 Device | `X-Device-Token: <hex>` header |
| 🔑 Admin | `Authorization: Bearer <jwt>` with `role: hotel_admin` |
| 🧩 Internal | `X-Internal-Key: <secret>` header |
| 🔏 Signed | HMAC-SHA256 body signature (`X-Exely-Signature`) |

---

## Health

### `GET /health` — 🌐
Liveness probe. Exempt from rate limiting.
```json
{ "status": "ok", "ts": "2026-07-01T10:00:00.000Z" }
```

---

## Device registration — `routes/devices.ts`

### `POST /api/v1/devices/register` — 🌐 (rate-limited 20/hour/IP)
Registers a TV to a room and mints its device token. If the room already exists,
the token is **rotated** (used on device reset).

Body (Zod-validated):
```json
{ "hotel_id": "<uuid>", "room_number": "101", "device_type": "android_tv | tizen" }
```
Response `201` (or `200` on re-register):
```json
{ "device_token": "<64-hex>", "room_id": "<uuid>" }
```
Errors: `400` invalid body, `404` hotel not found.

---

## Room / TV — `routes/room.ts`

All require the `X-Device-Token` header (except `/room/ping`, where it's optional).

### `GET /api/v1/room/config` — 📺
Everything the TV renders: room, hotel, current guest, weather, services, active
announcements, computed `nightsRemaining`.

### `GET /api/v1/room/ping` — 📺 (optional token)
Heartbeat; updates `lastSeenAt`. Returns `{ "pong": true }`.

### `GET /api/v1/hotel/services` — 📺
Available services for the device's hotel.

### `GET /api/v1/hotel/content/:type` — 📺
Active `HotelContent` of the given `content_type` (`background | announcement |
menu_item | promo`), filtered by the display-window dates.

### `GET /api/v1/ws?token=<deviceToken>` — 📺 (WebSocket)
Real-time channel. Server pushes events: `REFRESH_CONFIG`, `CLEAR_GUEST`,
`UPDATE_BACKGROUND`, `SHOW_ANNOUNCEMENT`, `REBOOT`. Client may send `{"type":"PING"}`
and receives `{"type":"PONG"}`. Closes `4001` on missing/unknown token.

---

## Admin — `routes/admin.ts` (all 🔑 except login)

### `POST /api/v1/admin/login` — 🌐 (rate-limited 10 / 15 min/IP)
Body `{ "email", "password" }`. Verifies against `ADMIN_EMAIL` +
`ADMIN_PASSWORD_HASH` (bcrypt). Returns `{ "token": "<jwt>" }` (8 h expiry).
Errors: `400` missing fields, `401` bad credentials, `503` admin not configured.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/rooms` | List rooms with latest guest |
| GET | `/admin/rooms/:id` | One room + guests + hotel |
| PUT | `/admin/rooms/:id/background` | Set `backgroundUrl`, push `UPDATE_BACKGROUND` |
| POST | `/admin/push/:roomId` | Push `SHOW_ANNOUNCEMENT` (`message`, `duration?`) |
| GET | `/admin/services?hotel_id=` | List a hotel's services |
| POST | `/admin/services` | Create service, broadcast `REFRESH_CONFIG` |
| PUT | `/admin/services/:id` | Update service, broadcast `REFRESH_CONFIG` |
| DELETE | `/admin/services/:id` | Delete service, broadcast `REFRESH_CONFIG` |
| GET | `/admin/devices` | Rooms + `online` flag (seen < 5 min ago) |
| POST | `/admin/push-reboot/:roomId` | Push `REBOOT` to a TV |
| POST | `/admin/media/upload` | Multipart upload (see below) |
| GET | `/admin/content?hotel_id=` | List content |
| POST | `/admin/content` | Create content item |
| PUT | `/admin/content/:id` | Update content item |
| GET | `/admin/requests?status=&hotelSlug=&limit=` | List service requests |
| PATCH | `/admin/requests/:id` | Update a request's status |

### `POST /api/v1/admin/media/upload` — 🔑
`multipart/form-data`, one file field. Allowed MIME types: JPEG, PNG, GIF, WebP,
AVIF, MP4, WebM, PDF. Max size `MAX_UPLOAD_MB` (default 50 MB). The file is stored
content-addressed (`<random-hex>-<sanitized-name>`).
Response: `{ "publicUrl": "<PUBLIC_BASE_URL>/media/<key>" }`.
Errors: `400` no file, `413` too large, `415` unsupported type.

---

## Dining (hotel-menu) — `routes/menuApi.ts`

Public REST API for the in-room dining app. Responses use the envelope
`{ data, code, message }`.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/menu/hotels` | 🌐 | Active bookable hotels |
| GET | `/menu/categories` | 🌐 | Menu categories (i18n) |
| GET | `/menu/products?categoryId=&availableOnly=1` | 🌐 | Products |
| GET | `/menu/guest?hotelSlug=&roomNumber=` | 🌐 | Currently checked-in guest |
| POST | `/menu/guest/language` | 🌐 | Save guest's preferred language |
| POST | `/menu/guest` | 🌐 | Check a guest in for N days |
| GET | `/menu/orders?hotelSlug=&roomNumber=&active=1&limit=` | 🌐 | Room orders (cap 100) |
| GET | `/menu/orders/:id` | 🌐 | One order + items |
| PUT | `/menu/orders/:id` | 🌐 | Edit items (only while `PENDING`) |
| POST | `/menu/orders` | 🌐 | Place an order (prices snapshotted) |

Order lifecycle status: `PENDING → PREPARING → READY → DELIVERED` (or `CANCELLED`).
All order/guest bodies are Zod-validated; unknown/unavailable products yield `409`.

---

## Service requests — `routes/serviceRequests.ts`

### `POST /api/v1/menu/requests` — 🌐 (rate-limited 30/min/IP)
Guest raises a request. Body: `hotelSlug`, `roomNumber`, `type`
(`ALARM|SERVICE|TAXI|RECEPTION|PROBLEM`), `note?`, `guestName?`, `source?`
(`web|tv`), `payload?`. Fires a Telegram notification (fire-and-forget).

### `GET /api/v1/admin/requests` — 🔑  ·  `PATCH /api/v1/admin/requests/:id` — 🔑
Staff list (filter by `status`, `hotelSlug`, `limit` cap 500) and status update
(`PENDING|ACKNOWLEDGED|RESOLVED|CANCELLED`).

---

## Internal data bridge — `routes/menuData.ts`

### `POST /api/v1/menu/data/:model/:op` — 🧩
Raw Prisma bridge used by the hotel-menu server. Requires `X-Internal-Key`
matching `INTERNAL_API_KEY`. **Fails closed** — if the key isn't configured the
route returns `503` (disabled) rather than running unauthenticated. Only mapped
models (`category, product, recommendation, hotel→menuHotel, room→menuRoom,
order, orderItem`) and a fixed op allowlist are permitted. Body is the Prisma
args object; response `{ data }`.

> ⚠️ This is a powerful endpoint (arbitrary CRUD on menu models). Keep
> `INTERNAL_API_KEY` secret and never expose this route publicly.

---

## Webhooks — `routes/webhooks.ts`

### `POST /api/v1/webhooks/exely` — 🔏
Exely PMS reservation events. Verified with HMAC-SHA256 over the raw body using
`EXELY_WEBHOOK_SECRET` (`X-Exely-Signature` header, timing-safe compare).
Handled events: `reservation.created` / `checked_in` (upsert guest),
`checked_out` / `cancelled` (remove guest), `modified` (update). Each pushes the
relevant WebSocket event to the room. Unknown room → `200` with a note; bad
signature → `401`.
