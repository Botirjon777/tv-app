"use client";

import { useEffect, useMemo, useState } from "react";
import { ChefHat, Wifi, WifiOff } from "lucide-react";
import { useOrderStream } from "@/components/useOrderStream";
import { LogoutButton } from "@/components/LogoutButton";
import { CenteredSpinner } from "@/components/ui";
import { OrderTicket } from "./OrderTicket";
import type { OrderStatus } from "@/lib/orders";
import type { HotelDTO, OrderDTO } from "@/types";

// POS is Uzbek-only (kitchen staff).
const COLUMNS: { status: OrderStatus; title: string; tone: string }[] = [
  { status: "PENDING", title: "Yangi", tone: "bg-amber-500" },
  { status: "PREPARING", title: "Tayyorlanmoqda", tone: "bg-blue-500" },
  { status: "READY", title: "Tayyor", tone: "bg-emerald-500" },
];

const HOTEL_KEY = "hotel-menu-pos-hotel";

export function PosBoard() {
  const { orders, loading, connected, updateStatus } =
    useOrderStream("active=1&limit=200");

  const [hotels, setHotels] = useState<HotelDTO[]>([]);
  const [hotelId, setHotelId] = useState<string>("");

  // Load hotels for the switcher and restore the last-selected one.
  useEffect(() => {
    let active = true;
    fetch("/api/hotels", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HotelDTO[]) => {
        if (!active) return;
        setHotels(data);
        const saved =
          typeof window !== "undefined"
            ? localStorage.getItem(HOTEL_KEY)
            : null;
        const initial =
          saved && data.some((h) => h.id === saved)
            ? saved
            : data[0]?.id ?? "";
        setHotelId(initial);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const selectHotel = (id: string) => {
    setHotelId(id);
    try {
      localStorage.setItem(HOTEL_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const byStatus = useMemo(() => {
    const map: Record<string, OrderDTO[]> = {
      PENDING: [],
      PREPARING: [],
      READY: [],
    };
    const scoped = orders
      .filter((o) => !hotelId || o.hotelId === hotelId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    for (const o of scoped) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [orders, hotelId]);

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold leading-tight">Oshxona ekrani</h1>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              {connected ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-400" /> Jonli
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-rose-400" /> Qayta ulanmoqda…
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hotels.length > 1 && (
            <select
              value={hotelId}
              onChange={(e) => selectHotel(e.target.value)}
              className="h-9 rounded-lg border border-white/20 bg-slate-800 px-3 text-sm font-medium text-white outline-none"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <LogoutButton
            redirectTo="/pos/login"
            label="Chiqish"
            className="text-slate-400 hover:text-white"
          />
        </div>
      </header>

      {loading ? (
        <CenteredSpinner label="Buyurtmalar yuklanmoqda…" />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden bg-white/10 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <section key={col.status} className="flex flex-col bg-slate-900">
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.tone}`} />
                  <h2 className="font-semibold">{col.title}</h2>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">
                  {byStatus[col.status].length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
                {byStatus[col.status].length === 0 ? (
                  <p className="px-2 py-8 text-center text-sm text-slate-600">
                    Buyurtmalar yo‘q
                  </p>
                ) : (
                  byStatus[col.status].map((order) => (
                    <OrderTicket
                      key={order.id}
                      order={order}
                      onUpdateStatus={updateStatus}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
