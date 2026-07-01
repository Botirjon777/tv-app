# Hotel TV Backend — Documentation

Fastify + Prisma + Redis backend powering the Hotel TV platform: Android TV / Tizen
in-room launchers, the Next.js admin panel, and the in-room dining ("hotel-menu")
web app. It exposes a REST + WebSocket API, syncs guests from the Exely PMS via
webhooks, and pushes real-time events to room TVs.

## Documentation index

| Doc | What's in it |
|-----|--------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Components, request flow, data model, real-time push |
| [API.md](./API.md) | Every endpoint: method, auth, payload, response |
| [CONFIGURATION.md](./CONFIGURATION.md) | All environment variables and how they're validated |
| [SECURITY.md](./SECURITY.md) | Threat model and the hardening that's implemented |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Step-by-step VPS deployment with TLS |
| [functionality/](./functionality/) | One doc per feature area (auth, devices, menu, webhooks, media, …) |

## TL;DR — run locally

```bash
cd backend
cp .env.example .env          # fill in secrets (npm run gen:secrets helps)
npm install
docker compose up -d postgres redis   # or use your own
npx prisma migrate deploy
npm run dev                   # http://localhost:3000/health
```

## TL;DR — deploy to a VPS

```bash
cp .env.production.example .env
npm run gen:secrets                      # paste output into .env
npm run hash:password -- 'admin-pw'      # paste ADMIN_PASSWORD_HASH into .env
# point APP_DOMAIN's DNS at the server, then:
docker compose -f docker-compose.prod.yml up -d --build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide.

## Tech stack

- **Runtime**: Node.js 20, TypeScript (strict), compiled to `dist/`
- **HTTP**: Fastify 4 (`@fastify/jwt`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/multipart`, `@fastify/static`, `@fastify/websocket`)
- **DB**: PostgreSQL 16 via Prisma 5
- **Cache / pub-sub**: Redis 7 (`ioredis`)
- **Validation**: Zod
- **Edge**: Caddy 2 (automatic HTTPS) in the production compose
