# `hotel-menu/` — In-Room Dining Ordering Platform

A standalone **Next.js 14** full-stack application that lets hotel guests order
food from their room by scanning a QR code, sends those orders live to a kitchen
POS, and gives managers an admin panel to run it all. It is independent of the
Hotel TV platform (`android/`, `backend/`, `tizen/`) — its own app, its own
database, its own server.

---

## Overview

The system has **three surfaces**, each tuned for a different device and user:

| Surface | Route | Audience | Device |
| --- | --- | --- | --- |
| **Guest menu** | `/hotel/[slug]/room/[number]` | Hotel guests (via room QR) | Mobile (dark, responsive) |
| **Kitchen POS** | `/pos` | Chefs / kitchen staff | Tablet (live order board) |
| **Admin panel** | `/admin` | Hotel managers | Desktop |

**The core flow:** a guest scans the QR code in their room → lands on that
room's menu → browses, builds a cart, and places an order → the order appears
**instantly** on the kitchen POS via Server-Sent Events → chefs advance it
through `New → Preparing → Ready → Delivered` → the guest watches the status
update live. Admins manage hotels, the menu, and every order.

---

## Key features

- **Multi-hotel.** One deployment serves many hotels. Creating a hotel
  auto-generates its rooms (floor-based: `101…1xx`, `201…2xx`, …) and a URL
  slug, and produces a printable **PDF of every room's QR code**.
- **Tri-lingual menu (English / Русский / Oʻzbekcha).** Guests switch language
  instantly. Admins enter an item in **one** language and the other two are
  **auto-translated via the Claude API** on save (falls back to copying the
  source text when no API key is configured).
- **UZS currency with live USD estimate.** Prices are in Uzbek soʻm; each price
  shows an approximate USD value from a cached live exchange rate.
- **Uzbek-only POS** for kitchen staff; English admin panel.
- **Live updates** everywhere via Server-Sent Events (no polling on staff
  screens).
- **Password auth** gating `/admin` and `/pos`; the guest menu is open (QR).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14.2 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS 3.4 (dark guest/POS theme) |
| Database | SQLite via Prisma 5.16 (swap to Postgres by editing `schema.prisma`) |
| Realtime | Server-Sent Events (in-process pub/sub) |
| Admin data | TanStack React Query 5 |
| Auth | HMAC-signed cookie (Web Crypto), password per role |
| Translation | `@anthropic-ai/sdk` (Claude API), model `claude-opus-4-8` |
| QR / PDF | `qrcode.react` (on-screen), `qrcode` + `jspdf` (PDF export) |
| Validation | Zod |

Runs on **port 3001** (so it does not clash with the `admin/` app on 3000).

---

## Architecture

```
Guest (mobile)                 Kitchen (tablet)            Manager (desktop)
 /hotel/grand-plaza/room/101      /pos                        /admin
        |  POST /api/orders         ^  SSE: order.created        |  CRUD
        v   {hotelSlug, room}       |   (filtered by hotel)      v
   ┌──────────────────────────  Next.js route handlers  ──────────────────────┐
   │ /api/orders /api/products /api/categories /api/hotels /api/rooms          │
   │ /api/auth   /api/fx        publishOrderEvent ─► /api/orders/stream (SSE)   │
   └────────────────────────────────  Prisma  ────────────────────────────────┘
                                     │
                                  SQLite (dev.db)
```

The SSE event bus (`src/lib/events.ts`) is an in-process pub/sub — single
process only. For a horizontally-scaled deployment, back it with Redis pub/sub;
the publish/subscribe surface stays the same.

---

## Data model (Prisma)

```
Hotel 1───* Room 1───* Order 1───* OrderItem *───1 Product *───1 Category
```

- **Hotel** — `name`, unique `slug`, `floors`, `roomsPerFloor`, `active`.
- **Room** — belongs to a Hotel; `number` is unique **per hotel**
  (`@@unique([hotelId, number])`), plus `floor`, `active`.
- **Category** / **Product** — the **shared, global menu** (not per-hotel).
  Both store `nameI18n` (and Product also `descI18n`) as JSON `{ en, ru, uz }`
  plus a `sourceLang`. Prices are integer **UZS** (no minor units).
- **Order** — belongs to a Room; `status` is a plain string
  (`PENDING | PREPARING | READY | DELIVERED | CANCELLED`) validated in
  `src/lib/orders.ts` because the SQLite connector has no native enums.
- **OrderItem** — snapshots the product's name and price at order time (in the
  **source** language, so kitchen tickets stay in one consistent language).

---

## Directory structure

```
hotel-menu/
├── prisma/
│   ├── schema.prisma          # Hotel, Room, Category, Product, Order, OrderItem
│   ├── seed.ts                # 2 demo hotels, shared menu (en/ru/uz), UZS prices
│   └── tsconfig.seed.json     # commonjs tsconfig so ts-node can run the seed
├── src/
│   ├── app/
│   │   ├── page.tsx                       # landing (links to all surfaces)
│   │   ├── hotel/[slug]/room/[number]/    # guest menu (server → MenuClient)
│   │   ├── pos/                           # kitchen POS (+ /pos/login)
│   │   ├── admin/                         # dashboard, orders, hotels, products, categories
│   │   └── api/                           # route handlers (see API reference)
│   ├── components/
│   │   ├── client/    # MenuClient, CartSheet, OrderTracker, PriceTag, useCart
│   │   ├── pos/       # PosBoard, OrderTicket (Uzbek)
│   │   ├── admin/     # AdminShell, Providers, PageHeader
│   │   └── ui.tsx     # shared primitives (Button, Modal, Input, …)
│   ├── lib/
│   │   ├── prisma.ts      events.ts      auth.ts/session.ts
│   │   ├── i18n.ts        translate.ts   orders.ts
│   │   ├── utils.ts (UZS formatting)     slug.ts (room generation)
│   │   ├── serialize*.ts  validation.ts  http.ts  qrpdf.ts  client-api.ts
│   ├── types/index.ts
│   └── middleware.ts      # gates /admin (admin role) and /pos (pos|admin)
├── .env / .env.example
└── package.json
```

---

## Configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file, e.g. `file:./dev.db` |
| `ADMIN_PASSWORD` / `POS_PASSWORD` | Login passwords for `/admin` and `/pos` |
| `AUTH_SECRET` | Secret for signing the session cookie |
| `NEXT_PUBLIC_BASE_URL` | Base URL baked into generated room QR codes |
| `ANTHROPIC_API_KEY` | Enables auto-translation; without it, items store source text in all languages |
| `TRANSLATION_MODEL` | Optional model override (default `claude-opus-4-8`) |
| `FX_FALLBACK_UZS_PER_USD` | Offline fallback rate if the live FX lookup fails |

Defaults for local dev live in `.env`; copy `.env.example` for new environments.
**Change the passwords and `AUTH_SECRET` before deploying.**

---

## Getting started

```bash
cd hotel-menu
npm install
npm run setup     # prisma generate + db push + seed (2 hotels, shared menu en/ru/uz)
npm run dev       # http://localhost:3001
```

Default logins (from `.env`): admin `admin123`, POS `kitchen123`.

For live auto-translation of newly created items, set `ANTHROPIC_API_KEY` in
`.env` first.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server on port 3001 |
| `npm run setup` | Generate client, push schema, seed |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Wipe + reseed the database |
| `npm run db:seed` | Reseed only |

---

## API reference

All endpoints are Next.js route handlers under `/api`. Staff endpoints require
the auth cookie; the guest endpoints are public.

| Endpoint | Methods | Access | Purpose |
| --- | --- | --- | --- |
| `/api/auth/login` `/logout` | POST | public | Set/clear the role cookie |
| `/api/hotels` | GET, POST | staff / admin | List hotels; create (auto-generates rooms) |
| `/api/hotels/[id]` | PATCH, DELETE | admin | Rename/toggle/slug; delete (blocked if it has orders) |
| `/api/rooms?hotelId=` | GET, POST | admin | List a hotel's rooms; add a single room |
| `/api/rooms/[id]` | PATCH, DELETE | admin | Edit / delete a room |
| `/api/categories` | GET, POST | public / admin | Menu categories (auto-translated on create) |
| `/api/products` | GET, POST | public / admin | Menu products (auto-translated on create) |
| `/api/products/[id]` `/api/categories/[id]` | PATCH, DELETE | admin | Edit / delete (re-translates on text change) |
| `/api/orders` | GET, POST | staff / **public POST** | List (filterable by hotel/status); a guest places an order |
| `/api/orders/[id]` | GET, PATCH | public GET / staff PATCH | Track an order; advance status |
| `/api/orders/stream` | GET (SSE) | staff | Live `order.created` / `order.updated` events |
| `/api/fx` | GET | public | Cached approximate UZS-per-USD exchange rate |

---

## Relationship to the other projects

`hotel-menu/` is **self-contained** and does **not** depend on `backend/`,
`android/`, `tizen/`, or `admin/`. It was added as a separate product for
in-room food ordering; the Hotel TV platform projects handle the in-room TV
experience instead. The only overlap is the shared repository and a similar
tech taste (Next.js + Prisma) with the `admin/` panel.

---

## Notes & future work

- **Per-hotel menus.** The menu is currently global/shared. Scoping
  products/prices per hotel is a future change.
- **Image uploads.** Product images are referenced by URL (paste a link in the
  admin form); add S3/file upload for hosted images.
- **Realtime scaling.** Swap the in-process SSE bus for Redis pub/sub to run
  multiple instances.
- **Auth.** A single shared password per role; add per-user staff accounts if
  you need auditing.
