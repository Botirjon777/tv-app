"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListOrdered, Wifi, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { CenteredSpinner, EmptyState } from "@/components/ui";
import { useOrderStream } from "@/components/useOrderStream";
import { api } from "@/lib/client-api";
import { formatPrice, formatTime, cn } from "@/lib/utils";
import type { HotelDTO } from "@/types";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  STATUS_STYLE,
  type OrderStatus,
} from "@/lib/orders";

type Filter = "ALL" | OrderStatus;

const FILTERS: Filter[] = ["ALL", ...ORDER_STATUSES];

export default function AdminOrdersPage() {
  const { orders, loading, connected, updateStatus } =
    useOrderStream("limit=200");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [hotelId, setHotelId] = useState<string>("ALL");

  const hotelsQ = useQuery({
    queryKey: ["hotels"],
    queryFn: () => api.get<HotelDTO[]>("/api/hotels"),
  });
  const hotels = hotelsQ.data ?? [];

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (filter === "ALL" || o.status === filter) &&
          (hotelId === "ALL" || o.hotelId === hotelId)
      ),
    [orders, filter, hotelId]
  );

  const counts = useMemo(() => {
    const scoped =
      hotelId === "ALL"
        ? orders
        : orders.filter((o) => o.hotelId === hotelId);
    const map: Record<string, number> = { ALL: scoped.length };
    for (const s of ORDER_STATUSES) map[s] = 0;
    for (const o of scoped) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders, hotelId]);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="All in-room dining orders, updating live."
        action={
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            {connected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" /> Live
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-rose-500" /> Offline
              </>
            )}
          </span>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              )}
            >
              {f === "ALL" ? "All" : STATUS_LABEL[f]}
              <span className="ml-1.5 opacity-60">{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        {hotels.length > 1 && (
          <select
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            className="ml-auto h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-brand-500"
          >
            <option value="ALL">All hotels</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <CenteredSpinner label="Loading orders…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="h-10 w-10" />}
          title="No orders"
          description="Orders placed by guests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-700">
                    {o.roomNumber}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Order #{o.id.slice(-6).toUpperCase()}
                      {o.hotelName && (
                        <span className="ml-2 text-xs font-medium text-slate-400">
                          {o.hotelName}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatTime(o.createdAt)} ·{" "}
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items ·{" "}
                      {formatPrice(o.total)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_STYLE[o.status]
                    )}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      updateStatus(o.id, e.target.value as OrderStatus)
                    }
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-brand-500"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-50 pt-3 text-sm text-slate-600">
                {o.items.map((it) => (
                  <span key={it.id}>
                    <span className="font-semibold text-brand-600">
                      {it.quantity}×
                    </span>{" "}
                    {it.name}
                  </span>
                ))}
              </div>
              {o.note && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                  📝 {o.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
