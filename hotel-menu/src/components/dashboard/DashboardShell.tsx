"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Hotel,
  LayoutDashboard,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/dashboard/recommendations", label: "Recommended", icon: CalendarDays },
  { href: "/dashboard/services", label: "Services", icon: Hotel },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hotelName, setHotelName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.hotel?.name && setHotelName(d.hotel.name))
      .catch(() => {});
  }, []);

  const navLink = (n: (typeof NAV)[number], compact = false) => {
    const active = pathname === n.href;
    const Icon = n.icon;
    return (
      <Link
        key={n.href}
        href={n.href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
          compact && "whitespace-nowrap",
          active
            ? "bg-brand-50 text-brand-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        {!compact && <Icon className="h-4 w-4" />}
        {n.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white p-4 sm:flex">
          <div className="mb-6 px-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Hotel</p>
            <p className="truncate font-bold text-slate-900">
              {hotelName || "Dashboard"}
            </p>
          </div>
          <nav className="space-y-1">{NAV.map((n) => navLink(n))}</nav>
          <div className="mt-auto border-t border-slate-100 pt-4">
            <LogoutButton
              redirectTo="/dashboard/login"
              label="Sign out"
              className="text-sm text-slate-500 hover:text-slate-800"
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {/* Mobile header + nav */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
            <p className="truncate font-bold text-slate-900">
              {hotelName || "Dashboard"}
            </p>
            <LogoutButton
              redirectTo="/dashboard/login"
              label="Sign out"
              className="text-sm text-slate-500"
            />
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 sm:hidden">
            {NAV.map((n) => navLink(n, true))}
          </nav>

          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
