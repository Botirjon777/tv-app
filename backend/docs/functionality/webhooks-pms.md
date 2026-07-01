# Functionality: Exely PMS webhooks

Source: `src/routes/webhooks.ts`. Raw-body capture: `src/index.ts`.

Keeps room guest data in sync with the hotel's Property Management System
(Exely). When a reservation changes, Exely calls this webhook and the backend
updates `RoomGuest` and pushes a WebSocket event to the TV.

## Endpoint
`POST /api/v1/webhooks/exely`

## Signature verification
- The request is verified with **HMAC-SHA256** over the *raw* request body using
  `EXELY_WEBHOOK_SECRET`, compared with `timingSafeEqual` (`X-Exely-Signature`
  header).
- The backend registers a content-type parser that stores the raw bytes
  (`req.rawBody`) so the HMAC is computed over exactly what Exely signed — a
  re-serialized body would not match.
- In **production** `EXELY_WEBHOOK_SECRET` is required at boot; unsigned webhooks
  are impossible. In development, if the secret is unset the check is skipped
  (with a warning).

## Handled events
| Event | Action |
|-------|--------|
| `reservation.created`, `reservation.checked_in` | Upsert the `RoomGuest`; push `REFRESH_CONFIG` |
| `reservation.modified` | Update guest name + dates; push `REFRESH_CONFIG` |
| `reservation.checked_out`, `reservation.cancelled` | Delete the guest; push `CLEAR_GUEST` |
| anything else | Logged and ignored |

The room is matched by `room_number`. If no matching room exists the webhook
returns `200` with a `room not mapped` note (so Exely doesn't keep retrying).

## Payload shape (abridged)
```json
{
  "event": "reservation.checked_in",
  "hotel_id": "...",
  "reservation": {
    "id": "...", "room_number": "101",
    "arrival_date": "2026-07-01", "departure_date": "2026-07-05",
    "guest": { "first_name": "...", "last_name": "...", "language": "en" }
  }
}
```
