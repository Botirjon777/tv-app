# `hotel-menu/` — Multi-Tenant In-Room Dining Platform

A **standalone Next.js 14** full-stack application that lets hotel guests order
food and request services from their room by scanning a QR code, relays those
orders to a kitchen POS **and a Telegram staff group**, and gives each hotel's
manager a self-service dashboard to run their own menu, rooms, and settings.

> **Self-contained.** Unlike the older revision of this doc, `hotel-menu/` no
> longer proxies through `backend/`. It owns its data directly in **MongoDB**
> (Atlas) via Prisma, runs on **port 3000**, and has no dependency on
> `backend/`, `my-hotel/`, `android/`, or `tizen/`. The only shared thing is the
> repository.

---

## Overview

The system has **four surfaces**, each tuned for a different device and user:

| Surface | Route | Audience | Device |
| --- | --- | --- | --- |
| **Guest menu** | `/[slug]/[number]` | Hotel guests (via room QR) | Mobile (dark, responsive) |
| **Kitchen POS** | `/pos` | Chefs / kitchen staff | Tablet (live order board) |
| **Manager dashboard** | `/dashboard` | The hotel's own manager | Desktop / mobile |
| **Admin panel** | `/admin` | Platform operator | Desktop |

Short, human-friendly URLs: a room is just `/<hotel-slug>/<room-number>` —
e.g. **`/safir/101`** for the room landing and **`/safir/101/menu`** for the
menu. The QR printed for each room encodes exactly that URL.

**The core flow:** a guest scans the QR in their room → lands on that room's
page → browses the (hotel-specific) menu, builds a cart, places an order, or
requests a service (taxi, wake-up alarm, transfer…) → the order is posted
**both** to the kitchen POS board and to the hotel's **Telegram group** (routed
to the right forum topic) → staff advance it `New → Preparing → Ready →
Delivered` → the guest watches the status update. Managers configure everything
for their own hotel from `/dashboard`; the platform admin manages hotels.

---

## Key features

- **Multi-tenant.** One deployment serves many hotels. Each hotel has its own
  menu, rooms, QR codes, staff logins, Telegram group, and settings — fully
  isolated. Creating a hotel auto-generates its rooms (floor-based:
  `101…1xx`, `201…2xx`, …) and a URL slug, and produces a printable **PDF of
  every room's QR code**. On creation the admin gets a ready-made onboarding
  guide (bot link + connect code + POS/manager passwords) to hand to the hotel.
- **Per-hotel menus.** Categories, products, prices and "recommendation of the
  day" are scoped to each hotel (not a shared global menu).
- **Manager dashboard (`/dashboard`).** Each hotel's manager signs in with their
  own credentials and manages **only their hotel**: menu & prices, recommended
  dishes, hotel services, rooms & QR codes, service fee, preorder, social links,
  Wi-Fi — plus an overview with live stats (active/total orders, rooms, items,
  services) and a setup checklist.
- **Telegram integration.** A manager adds the bot to their staff group (as
  admin) and sends the hotel's **connect code**; orders and service requests are
  then delivered to that group, **routed to forum topics** (menu orders / taxi /
  services …) when topics are enabled. See [TELEGRAM.md](../hotel-menu/TELEGRAM.md).
- **Guest services.** Beyond food: call a **taxi** or set a **wake-up alarm**
  with date/time (and destination) pickers, and browse hotel services
  (transfer, pool, conference hall…) — each service can carry an **image and a
  price**. Empty social links / services are hidden from guests.
- **Preorder.** When enabled by the manager, guests can schedule an order for a
  later time.
- **Tri-lingual (English / Русский / Oʻzbekcha).** Guests switch language
  instantly. Managers enter an item in **one** language and the other two are
  **auto-translated via the Claude API** on save (falls back to copying the
  source text when no API key is configured).
- **UZS currency with live USD estimate.** Prices are integer Uzbek soʻm; each
  shows an approximate USD value from a cached live exchange rate.
- **Recommendation of the day.** Managers feature products per weekday; the
  guest menu shows **today's** picks in an auto-rotating banner at the top.
- **Live updates** on staff screens via lightweight polling.
- **Multi-tenant password auth** gating `/admin`, `/pos`, and `/dashboard`; the
  guest menu is open (reached by QR).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS (light admin/manager, dark guest/POS), framer-motion |
| Database | **MongoDB** (Atlas) via Prisma (`provider = "mongodb"`); schema applied with `prisma db push` (no migrations) |
| Realtime | Polling (`useOrderStream` → `/api/orders`) — no SSE/WebSocket dependency |
| Client data | TanStack React Query 5 (admin + dashboard) |
| Auth | HMAC-signed cookie (Web Crypto); roles `admin` / `pos:<hotelId>` / `manager:<hotelId>` |
| Messaging | Telegram Bot API (webhook + forum topics) |
| Translation | `@anthropic-ai/sdk` (Claude API), default model `claude-opus-4-8` |
| QR / PDF | `qrcode.react` (on-screen), `qrcode` + `jspdf` (PDF export) |
| Validation | Zod |
| Tests | Vitest |

Runs on **port 3000**. Deployed on **Vercel** (`postinstall` runs
`prisma generate`); schema changes are pushed to Atlas with `prisma db push`.

---

## Architecture

```
Guest (mobile)        Kitchen (tablet)     Manager (desktop)     Admin
 /safir/101              /pos                 /dashboard          /admin
   │ POST /api/orders      ▲ poll               │ /api/dashboard/*   │ /api/hotels
   │ POST /api/service-…   │ /api/orders        │ (scoped to hotel)  │ /api/rooms
   ▼                       │                    ▼                    ▼
 ┌──────────────────  Next.js route handlers (/api/*)  ───────────────────┐
 │ auth · dashboard · hotels · rooms · orders · service-requests · fx     │
 │ telegram/webhook  ◄──────────────────────────────►  Telegram Bot API   │
 └──────────────────────────  src/lib/prisma.ts  ────────────────────────┘
                                     │
                                     ▼
                              MongoDB (Atlas)
```

Multi-tenant isolation is enforced in the route handlers: every
`/api/dashboard/*` endpoint derives the hotel from the **session** (never from a
client-supplied id) via `managerHotelId()` in `src/lib/session.ts`, so a manager
can only ever read or write their own hotel's data.

---

## Multi-tenant auth model

Sessions are an HMAC-signed cookie (`subject.expiresAt.nonce.sig`) decoded to:

```ts
type Session =
  | { role: "admin" }                       // platform operator
  | { role: "pos";     hotelId: string }    // a hotel's kitchen
  | { role: "manager"; hotelId: string };   // a hotel's manager
```

- **admin** — `/admin`, manages hotels (create generates rooms + QR PDF + an
  onboarding guide).
- **pos** — `/pos`, sees only its hotel's orders.
- **manager** — `/dashboard`, manages only its hotel (`managerHotelId()`).

`src/middleware.ts` gates `/admin`, `/pos`, and `/dashboard` (login pages are
public). Logins live at `/admin/login`, `/pos/login`, `/dashboard/login`.

---

## Data model (Prisma, MongoDB)

```
Hotel 1─* Room 1─* Order 1─* OrderItem *─1 Product *─1 Category
Hotel 1─* HotelService                              (all per-hotel)
Hotel 1─* Recommendation *─1 Product
Hotel 1─* ServiceRequest        (taxi / alarm / transfer …)
```

- **Hotel** — `name`, unique `slug`, `connectCode` (unique, links the Telegram
  group), `posPassword`, `managerPassword`, `telegramChatId`, `telegramTopics`
  (JSON topic→thread map), `serviceFeeType`/`serviceFeeValue`, `preorderEnabled`,
  `instagramUrl`/`telegramUrl`, `logoUrl`, `wifiName`/`wifiPassword`, room
  generation fields, `active`.
- **Room** — belongs to a Hotel; `number` unique **per hotel**
  (`@@unique([hotelId, number])`), plus `floor`, `active`.
- **Category** / **Product** — **per-hotel** (`hotelId`). Store `nameI18n`
  (Product also `descI18n`) as JSON `{ en, ru, uz }` plus `sourceLang`. Prices
  are integer **UZS**. Product also has `imageUrl`, `available`.
- **Recommendation** — featured product for a weekday (`dayOfWeek` 0–6),
  per-hotel; drives the guest "today's recommendation" banner.
- **HotelService** — a service tile (transfer/pool/…) with `nameI18n`/`descI18n`,
  optional `icon`, **`imageUrl`**, **`price`** (UZS, 0 = no price), `active`.
- **Order** — belongs to a Room; `status` is a validated string
  (`src/lib/orders.ts`), plus `serviceFee` and optional `scheduledFor`
  (preorder).
- **OrderItem** — snapshots the product's name and price at order time (in the
  source language, so kitchen tickets stay consistent).
- **ServiceRequest** — a guest request (taxi/alarm/…); `type`, optional
  `destination` and `scheduledFor`.

---

## Directory structure

```
hotel-menu/
├── prisma/
│   ├── schema.prisma          # 9 models (MongoDB / ObjectId)
│   └── seed.ts                # demo hotels w/ per-hotel menus, codes, passwords
├── src/
│   ├── app/
│   │   ├── page.tsx                        # landing (links to all surfaces)
│   │   ├── [slug]/[number]/                # guest room landing + /menu
│   │   ├── pos/                            # kitchen POS (+ /pos/login)
│   │   ├── dashboard/                      # manager: (panel)/{overview,menu,
│   │   │                                   #   recommendations,services,rooms,
│   │   │                                   #   settings} (+ /dashboard/login)
│   │   ├── admin/                          # platform: dashboard, orders, hotels
│   │   └── api/                            # route handlers (see API reference)
│   ├── components/
│   │   ├── client/      # MenuClient, CartSheet, RoomLanding, RecommendationBanner,
│   │   │                #   OrderTracker, useCart
│   │   ├── pos/ · admin/ · dashboard/      # per-surface shells
│   │   ├── QueryProvider.tsx               # shared TanStack Query provider
│   │   └── ui.tsx                          # shared primitives (see below)
│   ├── lib/
│   │   ├── api/dashboard.ts                # dashboard request functions
│   │   ├── prisma.ts  auth.ts  session.ts  http.ts  validation.ts
│   │   ├── i18n.ts  translate.ts  orders.ts  fees.ts  datetime.ts
│   │   ├── telegram.ts  onboarding.ts      # Telegram + manager onboarding guide
│   │   ├── room-loader.ts  serialize*.ts  utils.ts  slug.ts  qrpdf.ts  client-api.ts
│   ├── hooks/dashboard.ts                  # TanStack Query hooks for the dashboard
│   ├── components/useOrderStream.ts        # polling hook for staff screens
│   ├── types/index.ts
│   └── middleware.ts                       # gates /admin, /pos, /dashboard
├── .env.example
└── package.json
```

### Shared UI primitives (`src/components/ui.tsx`)

Theme-aware components reused across admin, manager, and client surfaces (light
by default, `dark:` variants for the guest/POS theme): `Button`, `Input`,
`Textarea`, `Select`, `Checkbox`, `Radio`, `Label`, `Dropdown`, `Modal`,
`Badge`, `Spinner`, `EmptyState`.

### Data-fetching architecture (admin & dashboard)

Client data goes through three layers instead of inline `fetch`:

1. **Request functions** — `src/lib/api/dashboard.ts` (`dashboardApi.getHotel`,
   `listServices`, `createService`, `listRooms`, …) built on the thin
   `client-api.ts` HTTP wrapper.
2. **Custom hooks** — `src/hooks/dashboard.ts` wrap those in `useQuery` /
   `useMutation` (`useDashboardHotel`, `useServices`, `useServiceMutations`, …)
   with stable `dashboardKeys`. Mutations **auto-invalidate** the right queries
   (e.g. deleting a category refreshes products; adding a room bumps the
   overview's room-count stat).
3. **Provider** — `QueryProvider` wraps both `/admin` and the `/dashboard`
   `(panel)` layout.

Components import the hooks only — they never call `fetch`/`api` directly.

---

## Configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URL` | MongoDB connection string (`mongodb+srv://…`, Atlas replica set) |
| `ADMIN_PASSWORD` | Login password for the platform `/admin` panel |
| `AUTH_SECRET` | Secret for signing/verifying the session cookie |
| `TELEGRAM_BOT_TOKEN` | Bot token (orders/requests are sent through this bot) |
| `TELEGRAM_WEBHOOK_SECRET` | Verifies inbound Telegram webhook calls |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username shown in onboarding guides |
| `NEXT_PUBLIC_BASE_URL` | Base URL baked into generated room QR codes |
| `ANTHROPIC_API_KEY` | Enables auto-translation; without it, items store source text in all languages |
| `FX_FALLBACK_UZS_PER_USD` | Offline fallback rate if the live FX lookup fails |

Per-hotel POS and manager passwords are stored on the **Hotel** record (set on
creation / via seed), not in env. Copy `.env.example` for new environments.
**Change `ADMIN_PASSWORD` and `AUTH_SECRET`, and regenerate the bot token,
before deploying.** Never commit `.env`.

---

## Getting started

```bash
cd hotel-menu
npm install
npm run setup     # prisma generate + db push + seed (demo hotels, per-hotel menus)
npm run dev       # http://localhost:3000
```

The seed creates demo hotels with connect codes and passwords (e.g. Safir —
connect code `100001`, POS `safir123`, manager `safir-mgr123`). For live
auto-translation of newly created items, set `ANTHROPIC_API_KEY` first.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run setup` | Generate client, push schema, seed |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run db:push` | Push schema to MongoDB |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Force-reset + reseed (⚠ wipes the database) |
| `npm run db:seed` | Reseed only |

---

## API reference

Next.js route handlers under `/api`. Staff/manager endpoints require the auth
cookie (and are scoped to the caller's hotel); guest endpoints are public.

| Endpoint | Methods | Access | Purpose |
| --- | --- | --- | --- |
| `/api/auth/login` `/logout` | POST | public | Set/clear the role cookie (admin / pos / manager) |
| `/api/auth/me` | GET | any signed-in | Current role + hotel (name, slug, effective logo) |
| `/api/hotels` | GET, POST | admin | List hotels; create (auto-generates rooms + onboarding) |
| `/api/hotels/[id]` | PATCH, DELETE | admin | Edit; delete (blocked if it has orders) |
| `/api/rooms?hotelId=` · `/api/rooms/[id]` | GET/POST · PATCH/DELETE | admin | Admin room management |
| `/api/dashboard/hotel` | GET, PATCH | manager | Own hotel + setup status + stats; update settings |
| `/api/dashboard/menu/categories` (+`/[id]`) | GET/POST · PATCH/DELETE | manager | Own categories (auto-translated) |
| `/api/dashboard/menu/products` (+`/[id]`) | GET/POST · PATCH/DELETE | manager | Own products |
| `/api/dashboard/menu/recommendations` (+`/[id]`) | GET/POST · DELETE | manager | Own weekday recommendations |
| `/api/dashboard/services` (+`/[id]`) | GET/POST · PATCH/DELETE | manager | Own hotel services (image + price) |
| `/api/dashboard/rooms` (+`/[id]`) | GET/POST · PATCH/DELETE | manager | Own rooms & QR (scoped) |
| `/api/orders` | GET, POST | staff GET / **public POST** | List (scoped/filterable); a guest places an order |
| `/api/orders/[id]` | GET, PATCH | public GET / staff PATCH | Track an order; advance status |
| `/api/service-requests` | POST | public | Guest taxi / alarm / service request → Telegram |
| `/api/telegram/webhook` | POST | Telegram (secret-verified) | `/start`, connect-code linking, topic binding |
| `/api/fx` | GET | public | Cached approximate UZS-per-USD exchange rate |

> The guest banner reads **today's** recommendations directly in the room page
> server component (server local time), not via a public endpoint.

---

## Notes & future work

- **Shared Atlas DB in dev.** Local dev and production can point at the same
  Atlas cluster, so reseeding locally affects prod data — reseed deliberately.
- **Image uploads.** Product and service images are referenced by URL; add file
  upload (e.g. S3) for hosted images.
- **Realtime scaling.** Staff screens poll; swap for SSE/WebSocket/Redis if you
  need lower latency at scale.
- **Auditing.** Per-hotel POS/manager use a single shared password each; add
  per-user staff accounts if you need an audit trail.
