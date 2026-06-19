import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChefHat, QrCode, Settings, UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Show a couple of real hotels + room links so the demo is easy to explore.
  const hotels = await prisma.hotel
    .findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        rooms: {
          where: { active: true },
          orderBy: { number: "asc" },
          take: 4,
        },
      },
    })
    .catch(() => []);

  const cards = [
    {
      href: "/admin",
      title: "Admin Panel",
      description: "Manage products, categories, rooms & view all orders.",
      icon: <Settings className="h-7 w-7" />,
      tone: "bg-slate-900 text-white",
    },
    {
      href: "/pos",
      title: "Kitchen POS",
      description: "Live order display for chefs — built for tablets.",
      icon: <ChefHat className="h-7 w-7" />,
      tone: "bg-brand-600 text-white",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
     <div className="mx-auto max-w-3xl px-2.5 py-2.5 lg:px-5 lg:py-5">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-900/40">
          <UtensilsCrossed className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-zinc-50">
            Hotel Menu Platform
          </h1>
          <p className="text-sm text-zinc-400">
            In-room dining ordering system
          </p>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:gap-5">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group rounded-3xl p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-5 ${c.tone}`}
          >
            <div className="mb-4">{c.icon}</div>
            <h2 className="text-lg font-bold">{c.title}</h2>
            <p className="mt-1 text-sm opacity-80">{c.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-2.5 lg:p-5">
        <div className="mb-3 flex items-center gap-2 text-zinc-200">
          <QrCode className="h-5 w-5" />
          <h2 className="font-bold">Guest ordering (scan a room QR)</h2>
        </div>
        <p className="mb-4 text-sm text-zinc-400">
          Each room has a QR code linking to its menu. Try a room directly:
        </p>
        {hotels.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hotels yet — run{" "}
            <code className="rounded bg-zinc-800 px-1">npm run setup</code> to
            seed data, or add one in the admin panel.
          </p>
        ) : (
          <div className="space-y-2.5 lg:space-y-5">
            {hotels.map((h) => (
              <div key={h.id}>
                <p className="mb-2 text-sm font-semibold text-zinc-200">
                  {h.name}{" "}
                  <span className="font-normal text-zinc-500">
                    /hotel/{h.slug}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {h.rooms.map((r) => (
                    <Link
                      key={r.id}
                      href={`/hotel/${h.slug}/room/${r.number}`}
                      className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-brand-500 hover:bg-brand-950/40 hover:text-brand-300"
                    >
                      Room {r.number}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
     </div>
    </main>
  );
}
