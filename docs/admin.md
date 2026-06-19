# `admin/` — Hotel TV Admin Dashboard

A **Next.js 14** web dashboard for hotel staff to manage and monitor the
in-room **Hotel TV** system. It is the control panel for the TV clients
(`android/` Flutter app and the legacy `tizen/` app) and talks to the
`backend/` API. It is **not** related to the `hotel-menu/` ordering app.

---

## Overview

From a desktop browser, staff use this panel to:

- See TV device status and guest occupancy across every room
- Push announcements and promotional content to specific rooms
- Override a room's background image (and push it live to the TV)
- Manage hotel services (restaurant, concierge, …) with bilingual labels and
  deep links into the TV app
- Create and toggle content (announcements, backgrounds, promos)
- Refresh configuration or reboot a device remotely
- Reference the Exely PMS webhook URL used for automated check-in/check-out

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js **14.2.5** (App Router) + React 18 + TypeScript 5 |
| Server state | TanStack React Query **5.51.1** (30-second auto-refetch) |
| Styling | Tailwind CSS **3.4.1** (custom dark-navy sidebar theme) |
| Icons | lucide-react **0.408.0** |
| Charts | recharts **2.12.7** (available) |
| Class utils | clsx, tailwind-merge |
| Auth | JWT stored in `localStorage` (no session library) |

---

## Project structure

```
admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, Providers wrapper
│   │   ├── page.tsx                # redirects to /dashboard
│   │   ├── login/page.tsx          # email + password → JWT
│   │   └── dashboard/
│   │       ├── layout.tsx          # Sidebar + Header + auth guard
│   │       ├── page.tsx            # overview: stats cards, room grid by floor
│   │       ├── rooms/page.tsx      # rooms table (status, guest, device, last seen)
│   │       ├── rooms/[id]/page.tsx # room detail: guest info, bg override, announcements
│   │       ├── devices/page.tsx    # device list, refresh / reboot
│   │       ├── services/page.tsx   # hotel services CRUD (EN/RU labels, icons, deep links)
│   │       ├── content/page.tsx    # announcements / backgrounds / promos CRUD
│   │       └── settings/page.tsx   # API URL, Hotel ID, Exely webhook reference
│   ├── components/
│   │   ├── Providers.tsx           # QueryClientProvider
│   │   ├── Sidebar.tsx             # left nav (6 routes + logout)
│   │   └── Header.tsx              # top bar (title, notifications, avatar)
│   ├── lib/
│   │   ├── api.ts                  # fetch wrapper + typed endpoints
│   │   └── auth.ts                 # localStorage token management
│   └── types/index.ts              # Hotel, Room, RoomGuest, HotelService, HotelContent, Device
├── next.config.mjs                 # remote image patterns (any host)
├── tailwind.config.ts              # sidebar color theme
└── package.json
```

---

## Configuration

Copy `.env.local.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_HOTEL_ID` | Hotel UUID, sent as a query param to scope data |

---

## Getting started

```bash
cd admin
npm install
npm run dev      # Next dev server (needs the backend running at NEXT_PUBLIC_API_URL)
```

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

**Prerequisites:** the `backend/` server must be running and reachable at
`NEXT_PUBLIC_API_URL`, and you need valid admin credentials to obtain a JWT.

---

## How it works

- **Auth.** Login posts to the backend; the returned JWT is stored in
  `localStorage` and sent as `Authorization: Bearer <token>` on every request.
  A `401` clears the token and redirects to `/login`. Dashboard routes are
  guarded.
- **Live status.** React Query refetches rooms, devices, services, and content
  every ~30 seconds. An `isOnline()` helper treats a device as online if its
  `lastSeenAt` is within 5 minutes.
- **Device commands.** Push announcements (message + duration), override a
  room background, force a config refresh, or reboot — all via backend
  endpoints that relay to the TV over WebSocket.
- **Multilingual content.** Service/content labels are stored as
  `Record<string, string>` (e.g. EN/RU) so the TV can render the guest's
  language.
- **Media uploads.** The backend issues an S3-compatible presigned URL; the
  client uploads directly and stores the resulting public URL.

### Backend endpoints used (`/api/v1/admin/*`)

```
POST   /admin/login                     # email + password → JWT
GET    /admin/rooms                     # list rooms
GET    /admin/rooms/{id}                # room detail
PUT    /admin/rooms/{id}/background      # override background
POST   /admin/push/{roomId}             # push announcement / refresh
POST   /admin/push-reboot/{roomId}      # reboot device
GET    /admin/devices                   # device list
GET/POST/PUT/DELETE /admin/services      # hotel services CRUD
GET/POST/PUT        /admin/content       # content CRUD
POST   /admin/media/presign             # S3 presigned upload URL
```

---

## Relationship to the other projects

- **`backend/`** — the data and command source; this panel is a pure client of
  its `/api/v1/admin/*` REST API.
- **`android/` & `tizen/`** — the TV clients this panel monitors and controls
  (background overrides, announcements, reboots) via the backend.
- **Exely PMS** — the Settings page surfaces the webhook URL to configure in
  Exely; guest check-in/out events flow into the backend and show up here as
  occupancy.
- **`hotel-menu/`** — unrelated (a separate in-room food-ordering product).
