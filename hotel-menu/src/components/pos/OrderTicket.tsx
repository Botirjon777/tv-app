"use client";

import { Check, Clock, MapPin } from "lucide-react";
import { formatPrice, formatTime, minutesAgo, cn } from "@/lib/utils";
import { NEXT_STATUS, type OrderStatus } from "@/lib/orders";
import type { OrderDTO } from "@/types";

// POS is Uzbek-only — the "advance" button label per status.
const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Tayyorlashni boshlash",
  PREPARING: "Tayyor deb belgilash",
  READY: "Yetkazildi deb belgilash",
};

export function OrderTicket({
  order,
  onUpdateStatus,
}: {
  order: OrderDTO;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  const waited = minutesAgo(order.createdAt);
  const next = NEXT_STATUS[order.status];
  // Highlight tickets that have been waiting too long.
  const urgent = order.status !== "READY" && waited >= 15;

  return (
    <div
      className={cn(
        "rounded-xl bg-white p-3 text-slate-900 shadow-sm",
        urgent && "ring-2 ring-rose-400"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-brand-600" />
          <span className="text-lg font-extrabold leading-none">
            {order.roomNumber}
          </span>
          <span className="ml-1 text-xs text-slate-400">
            #{order.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            urgent ? "text-rose-600" : "text-slate-400"
          )}
        >
          <Clock className="h-3 w-3" />
          {waited} daq
        </span>
      </div>

      <ul className="mt-2.5 space-y-1">
        {order.items.map((it) => (
          <li key={it.id} className="flex gap-2 text-sm">
            <span className="font-bold text-brand-600">{it.quantity}×</span>
            <span className="flex-1 text-slate-700">{it.name}</span>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
          📝 {order.note}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div className="text-xs text-slate-400">
          {formatTime(order.createdAt)} · {formatPrice(order.total)}
        </div>
        <div className="flex gap-2">
          {order.status === "PENDING" && (
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Bekor qilish
            </button>
          )}
          {next && (
            <button
              onClick={() => onUpdateStatus(order.id, next)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Check className="h-3.5 w-3.5" />
              {ADVANCE_LABEL[order.status] ?? "Keyingi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
