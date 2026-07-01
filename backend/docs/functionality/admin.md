# Functionality: Admin API

Source: `src/routes/admin.ts` (and `src/routes/serviceRequests.ts` for requests).

Staff-facing API used by the Next.js admin panel. Every route except login
requires a `hotel_admin` JWT (see [auth.md](./auth.md)).

## Rooms & devices
- `GET /admin/rooms` — all rooms with their latest guest.
- `GET /admin/rooms/:id` — one room + guests + hotel.
- `GET /admin/devices` — rooms with an `online` flag (`lastSeenAt` < 5 min).
- `PUT /admin/rooms/:id/background` — set `backgroundUrl`; pushes
  `UPDATE_BACKGROUND` to the TV.
- `POST /admin/push/:roomId` — push a `SHOW_ANNOUNCEMENT` (`message`, `duration?`).
- `POST /admin/push-reboot/:roomId` — push a `REBOOT`.

## Services
CRUD over `HotelService` (`label` is i18n JSON, plus `iconUrl`, `sortOrder`,
`available`, `deepLink`). Each mutation broadcasts `REFRESH_CONFIG` to the
hotel's TVs.
- `GET /admin/services?hotel_id=` · `POST /admin/services` ·
  `PUT /admin/services/:id` · `DELETE /admin/services/:id`

## Content
CRUD over `HotelContent` (announcements, promos, menu items, backgrounds) with
`displayFrom`/`displayUntil` scheduling and `priority`.
- `GET /admin/content?hotel_id=` · `POST /admin/content` · `PUT /admin/content/:id`

## Media upload
- `POST /admin/media/upload` — see [media-uploads.md](./media-uploads.md).

## Service requests
- `GET /admin/requests?status=&hotelSlug=&limit=` — live guest requests.
- `PATCH /admin/requests/:id` — update status
  (`PENDING|ACKNOWLEDGED|RESOLVED|CANCELLED`).

## Notes
- Mutations that affect what a TV shows push a WebSocket event so screens update
  instantly.
- The admin account is single-tenant: it can act across all hotels. For
  multi-tenant isolation, embed `hotelId` in the JWT and filter per route (see
  residual risks in [../SECURITY.md](../SECURITY.md)).
