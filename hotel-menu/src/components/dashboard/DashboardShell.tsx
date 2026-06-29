"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  DoorOpen,
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
  { href: "/dashboard/rooms", label: "Rooms & QR", icon: DoorOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hotelName, setHotelName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hotel?.name) setHotelName(d.hotel.name);
        if (d?.hotel?.logoUrl) setLogoUrl(d.hotel.logoUrl);
      })
      .catch(() => {});
  }, []);

  // Hotel logo, shown only when the hotel actually has one.
  const HotelBadge = (
    <div className="flex items-center gap-2.5">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={hotelName}
          className="h-9 w-9 flex-shrink-0 rounded-lg object-contain"
        />
      )}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-400">Hotel</p>
        <p className="truncate font-bold text-slate-900">
          {hotelName || "Dashboard"}
        </p>
      </div>
    </div>
  );

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
        {/* Desktop sidebar — fixed so it stays put on long pages */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 sm:flex">
          <div className="mb-6 px-2">{HotelBadge}</div>
          <nav className="space-y-1">{NAV.map((n) => navLink(n))}</nav>
          <div className="mt-auto border-t border-slate-100 pt-4">
            <LogoutButton
              redirectTo="/dashboard/login"
              label="Sign out"
              className="text-sm text-slate-500 hover:text-slate-800"
            />
          </div>
        </aside>

        <main className="min-w-0 sm:pl-60">
          {/* Mobile header + nav */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
            {HotelBadge}
            <LogoutButton
              redirectTo="/dashboard/login"
              label="Sign out"
              className="text-sm text-slate-500"
            />
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 sm:hidden">
            {NAV.map((n) => navLink(n, true))}
          </nav>

          <div className="w-full p-4 lg:p-6">{children}</div>
        </main>
    </div>
  );
}
