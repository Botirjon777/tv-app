import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatPrice, formatTime } from "@/lib/utils";
import { ACTIVE_STATUSES, STATUS_LABEL, STATUS_STYLE } from "@/lib/orders";
import type { OrderStatus } from "@/lib/orders";
import {
  Banknote,
  Building2,
  ReceiptText,
  Timer,
  UtensilsCrossed,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    activeCount,
    productCount,
    hotelCount,
    recent,
    revenueAgg,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.product.count(),
    prisma.hotel.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        room: { select: { number: true, hotel: { select: { name: true } } } },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfToday },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  const stats = [
    {
      label: "Orders today",
      value: todayOrders,
      icon: ReceiptText,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active now",
      value: activeCount,
      icon: Timer,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Revenue today",
      value: formatPrice(revenueAgg._sum.total ?? 0),
      icon: Banknote,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Menu items",
      value: productCount,
      icon: UtensilsCrossed,
      tone: "bg-brand-50 text-brand-600",
    },
    {
      label: "Hotels",
      value: hotelCount,
      icon: Building2,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of today's in-room dining activity."
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm lg:p-5"
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2.5 lg:px-5 lg:py-5">
          <h2 className="font-bold">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No orders yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {recent.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between px-2.5 py-2.5 lg:px-5 lg:py-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                    {o.room.number}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Order #{o.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {o.room.hotel?.name ? `${o.room.hotel.name} · ` : ""}
                      Room {o.room.number} · {formatTime(o.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_STYLE[o.status as OrderStatus]
                    }`}
                  >
                    {STATUS_LABEL[o.status as OrderStatus]}
                  </span>
                  <span className="w-16 text-right text-sm font-bold text-slate-900">
                    {formatPrice(o.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
