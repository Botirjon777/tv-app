# Security

This document describes the threat model and the hardening implemented in the
backend. It reflects the code as shipped — every control below is active.

## Threat model

The API is internet-facing. The relevant attackers are:

- **Anonymous internet users** hitting public endpoints (dining, requests,
  device registration) — abuse, spam, resource exhaustion, injection attempts.
- **Credential-stuffing / brute-force** against the admin login.
- **Forgery**: fake PMS webhooks (planting/removing guests) or fake internal
  data-bridge calls (arbitrary DB mutations).
- **Malicious uploads** from a compromised staff account (stored XSS via
  HTML/SVG served from the media origin).
- **Info leakage** through verbose errors or logged secrets.

## Controls implemented

### 1. Fail-fast configuration validation
`src/config/env.ts` validates all env at boot and **exits** on any problem. In
production it *requires* the admin credentials, the internal API key, the Exely
webhook secret, and a non-wildcard `CORS_ORIGIN`. This removes the entire class
of "accidentally deployed without a secret → open endpoint" bugs.

### 2. Authentication, per client type
- **Admin** (`src/auth.ts` `requireAdmin`): verifies the JWT **and** that it
  carries `role: hotel_admin`. A token minted for any other purpose is rejected
  with `403`. Passwords are bcrypt-hashed (cost 12); tokens expire in 8 h.
- **Device**: opaque 32-byte hex token per room, matched exactly.
- **Internal data bridge**: `X-Internal-Key` compared against `INTERNAL_API_KEY`;
  **fails closed** (route returns `503` when the key is unset — never runs
  unauthenticated). This is the single most dangerous endpoint (arbitrary Prisma
  CRUD) and is now impossible to reach without the secret.
- **Webhooks**: HMAC-SHA256 over the *raw* request body, compared with
  `timingSafeEqual`. A raw-body-capturing content-type parser (`src/index.ts`)
  ensures the bytes hashed are exactly what the sender signed — the previous
  `JSON.stringify(req.body)` fallback would not have matched.

### 3. Rate limiting (`@fastify/rate-limit`)
- **Global**: `RATE_LIMIT_MAX` requests / IP / window (default 300/min), keyed on
  the real client IP (correct because `trustProxy` is on behind Caddy). `/health`
  is exempt.
- **Admin login**: 10 attempts / 15 min / IP — brute-force protection.
- **Device register**: 20 / hour / IP — caps room/token creation.
- **Guest requests**: 30 / min / IP — caps spam and Telegram-notification floods.

### 4. Security headers (`@fastify/helmet`)
Sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, HSTS (via
Caddy at the edge too), etc. `crossOriginResourcePolicy` is `cross-origin` so TV
clients can embed media. CSP is disabled deliberately (JSON/media API, no HTML
app served).

### 5. Upload safety (`routes/admin.ts`)
- MIME allowlist (images, MP4/WebM, PDF); anything else → `415` and the stream is
  drained.
- Size cap (`MAX_UPLOAD_MB`, default 50 MB) → `413` on overflow.
- Content-addressed storage: `<random-hex>-<sanitized-filename>`, so filenames
  can't traverse paths or collide. Files are served read-only by
  `@fastify/static`, which cannot execute them.

### 6. Input validation
Public write endpoints (device register, orders, guest check-in, service
requests) validate their bodies with Zod and reject malformed input with `422`.
Query `limit`s are capped (orders 100, admin requests 500). Prisma
parameterises all queries — no string-built SQL.

### 7. Safe error handling & logging
- A global error handler returns `Internal Server Error` for 5xx in production
  (no stack traces / internals leaked); full details are logged server-side.
- The logger **redacts** `authorization`, `x-device-token`, and `x-internal-key`
  headers.
- A JSON 404 handler avoids default HTML error pages.

### 8. Transport & network isolation
- `trustProxy: true` so the app honours `X-Forwarded-*` from Caddy (correct
  client IP for rate limiting, correct scheme).
- In `docker-compose.prod.yml` only Caddy is exposed (80/443). The backend,
  Postgres, and Redis are reachable only on the internal Docker network — the
  database is never published to the host/internet.
- Caddy provides automatic TLS (Let's Encrypt) and adds HSTS + `-Server`.

### 9. Container hardening
- Multi-stage Docker build; runtime image runs as the non-root `node` user.
- `.dockerignore` keeps `.env`, `node_modules`, and VCS out of the image (no
  secrets baked into layers).
- Resource limits and log rotation configured in the production compose.
- Graceful shutdown (SIGTERM) drains connections and closes Prisma/Redis.

## Residual risks & recommended follow-ups

These are known and left as deliberate trade-offs / future work:

- **Device tokens don't expire.** A leaked `X-Device-Token` grants that room's
  config until re-registered. Consider periodic rotation.
- **Single admin, no per-hotel tenancy.** The admin JWT can act on any hotel.
  For true multi-tenant use, embed `hotelId` in the JWT and check it per route.
- **No CSRF tokens** — acceptable because auth is header-based (Bearer), not
  cookies. If you move admin auth to cookies, add CSRF protection.
- **WebSocket token in query string** may appear in proxy logs. Caddy's access
  log format here doesn't log full query strings, but consider a header-based
  handshake if your edge does.
- **Admin mutation payloads** (services/content) are permissive. They're behind
  admin auth, but adding Zod schemas would harden against malformed input.

## Secret handling checklist

- [ ] `.env` is git-ignored (it is) and never committed.
- [ ] `JWT_SECRET`, `INTERNAL_API_KEY`, `EXELY_WEBHOOK_SECRET` generated with
      `npm run gen:secrets` (not reused across environments).
- [ ] `ADMIN_PASSWORD_HASH` generated with `npm run hash:password` (plaintext
      never stored).
- [ ] Strong `POSTGRES_PASSWORD` in the production `.env`.
- [ ] `CORS_ORIGIN` set to explicit origins in production.
- [ ] Rotate any secret that was ever committed or shared.
