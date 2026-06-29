"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  ListOrdered,
  UtensilsCrossed,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

// Menus are now managed per-hotel in the manager dashboard, so the admin keeps
// only the cross-hotel views.
const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/hotels", label: "Hotels & QR", icon: Building2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login page renders without the dashboard chrome.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 px-5 py-5 text-zinc-300 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif font-bold leading-tight text-zinc-50">
              Hotel Menu
            </p>
            <p className="text-xs text-zinc-500">Admin panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/30"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 pt-4">
          <LogoutButton
            redirectTo="/admin/login"
            className="text-zinc-400 hover:text-white"
          />
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-2.5 py-2.5 lg:hidden">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                active ? "bg-brand-600 text-white" : "text-zinc-400"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 px-2.5 pb-2.5 pt-16 lg:ml-64 lg:px-5 lg:pb-5 lg:pt-5">
        {children}
      </main>
    </div>
  );
}
