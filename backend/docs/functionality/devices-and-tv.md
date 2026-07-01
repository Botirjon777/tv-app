# Functionality: Device registration & TV config

Source: `src/routes/devices.ts`, `src/routes/room.ts`.

Covers how a room TV (Android TV or Tizen) enrolls and then fetches everything it
displays.

## Registration

`POST /api/v1/devices/register` (public, 20/hour/IP)
```json
{ "hotel_id": "<uuid>", "room_number": "101", "device_type": "android_tv" }
```
- Validates the body with Zod and checks the hotel exists.
- If the room already exists → **rotates** the device token (used on device
  reset). Otherwise creates the `Room` and mints a fresh token.
- Returns `{ device_token, room_id }`. The TV stores the token and sends it as
  `X-Device-Token` thereafter.

## Room config

`GET /api/v1/room/config` (device token) returns the full render payload:

- **room**: id, number, floor, `backgroundUrl` (falls back to hotel logo)
- **hotel**: name, city, timezone, logo
- **guest**: current guest (first/last name, language, check-in/out,
  `nightsRemaining`) or `null`
- **weather**: cached OpenWeatherMap data (see [weather.md](./weather.md))
- **services**: available `HotelService` rows, sorted
- **announcements**: active `HotelContent` of type `announcement`, within its
  display window

## Heartbeat & content

- `GET /room/ping` — updates `Room.lastSeenAt`; the admin "online" flag is
  `lastSeenAt` within the last 5 minutes.
- `GET /hotel/services` — the hotel's available services.
- `GET /hotel/content/:type` — active content of a given type, date-filtered.

## Real-time updates

The TV also opens a WebSocket for push events (guest changes, background updates,
announcements, reboot). See [realtime-push.md](./realtime-push.md).
