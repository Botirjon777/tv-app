# Functionality: Guest service requests

Source: `src/routes/serviceRequests.ts`, `src/services/telegramService.ts`.
Model: `ServiceRequest`.

Lets a guest call for help from the TV launcher or the in-room web page; staff see
it live in the admin dashboard and get a Telegram ping.

## Raising a request (public)
`POST /api/v1/menu/requests` (rate-limited 30/min/IP)
```json
{
  "hotelSlug": "grand",
  "roomNumber": "101",
  "type": "ALARM | SERVICE | TAXI | RECEPTION | PROBLEM",
  "note": "optional (≤500 chars)",
  "guestName": "optional",
  "source": "web | tv"
}
```
- Zod-validated; unknown hotel or inactive hotel → error.
- Persists a `ServiceRequest` with status `PENDING`.
- Fires a **fire-and-forget** Telegram notification — a Telegram failure never
  blocks or fails the guest's request.

## Staff handling (admin, JWT)
- `GET /api/v1/admin/requests?status=&hotelSlug=&limit=` — list (cap 500), newest
  first, with hotel name/slug.
- `PATCH /api/v1/admin/requests/:id` — set status to
  `PENDING | ACKNOWLEDGED | RESOLVED | CANCELLED`.

## Telegram formatting
`formatRequestMessage` builds an HTML message with an emoji per type; all
guest-supplied fields are HTML-escaped before sending. Configure with
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`; if unset the service no-ops and just
logs (the app works fine without Telegram). See [telegram.md](./telegram.md).
