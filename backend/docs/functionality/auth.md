# Functionality: Authentication

Source: `src/auth.ts`, `src/routes/admin.ts` (login), `src/config/env.ts`.

The backend has **four** auth mechanisms, each for a different client. See
[../SECURITY.md](../SECURITY.md) for the threat model.

## Admin (JWT)

- **Login**: `POST /api/v1/admin/login` with `{ email, password }`.
- Credentials are a single account from env: `ADMIN_EMAIL` +
  `ADMIN_PASSWORD_HASH` (bcrypt, cost 12).
- On success the server signs a JWT `{ email, role: 'hotel_admin' }` with an 8 h
  expiry and returns `{ token }`.
- **Guard**: `requireAdmin` (`src/auth.ts`) is a `preHandler` on every `/admin/*`
  route. It verifies the JWT **and** checks `role === 'hotel_admin'` — a token
  without that role is rejected `403`.
- Login is rate-limited to **10 attempts / 15 min / IP**.

Create/rotate the password hash:
```bash
npm run hash:password -- 'new-password'   # prints ADMIN_PASSWORD_HASH=...
```

## Device token

- Minted at registration (see [devices-and-tv.md](./devices-and-tv.md)); a random
  32-byte hex string stored on `Room.deviceToken`.
- Sent as the `X-Device-Token` header on `/room/*` and `/hotel/*`, or as `?token=`
  on the WebSocket.
- Matched exactly against the DB; no expiry (rotated by re-registering).

## Internal key

- `X-Internal-Key` header, compared against `INTERNAL_API_KEY`, guards the
  `/menu/data` Prisma bridge. Fails closed (disabled if the key is unset).

## Webhook signature

- HMAC-SHA256 over the raw body with `EXELY_WEBHOOK_SECRET`. See
  [webhooks-pms.md](./webhooks-pms.md).

## Production enforcement

`loadEnv()` refuses to start in production unless `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH`, and `INTERNAL_API_KEY` are all set — so no auth surface can
be left un-configured.
