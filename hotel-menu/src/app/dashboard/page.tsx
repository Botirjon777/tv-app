"use client";

import { useEffect, useState } from "react";
import {
  BadgePercent,
  Check,
  ChefHat,
  Circle,
  Hotel,
  Send,
  Share2,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { CenteredSpinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { botUsername } from "@/lib/onboarding";

type DashboardHotel = {
  name: string;
  connectCode: string;
  serviceFeeType: string;
  serviceFeeValue: number;
  telegramLinked: boolean;
  instagramUrl: string;
  telegramUrl: string;
  serviceCount: number;
  productCount: number;
};

type ChecklistItem = {
  key: string;
  title: string;
  description: string;
  done: boolean;
  important?: boolean;
  icon: React.ReactNode;
};

export default function DashboardHome() {
  const [hotel, setHotel] = useState<DashboardHotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/hotel", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setHotel(data);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <CenteredSpinner label="Loading your dashboard…" />;
  if (!hotel)
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-500">
        Could not load your dashboard.
      </main>
    );

  const items: ChecklistItem[] = [
    {
      key: "telegram",
      title: "Connect Telegram order alerts",
      description: hotel.telegramLinked
        ? "Linked — new orders are posted to your group."
        : `Add @${botUsername()} to your staff group (as admin) and send the code ${hotel.connectCode}.`,
      done: hotel.telegramLinked,
      important: true,
      icon: <Send className="h-5 w-5" />,
    },
    {
      key: "menu",
      title: "Add your menu, products & prices",
      description:
        hotel.productCount > 0
          ? `${hotel.productCount} items available.`
          : "Create categories and dishes guests can order.",
      done: hotel.productCount > 0,
      important: true,
      icon: <ChefHat className="h-5 w-5" />,
    },
    {
      key: "serviceFee",
      title: "Set your service fee",
      description:
        hotel.serviceFeeType === "none"
          ? "Add a service fee (a percentage or a fixed amount), or leave it off."
          : hotel.serviceFeeType === "percent"
            ? `${hotel.serviceFeeValue}% added to each order.`
            : `Fixed fee per order.`,
      done: hotel.serviceFeeType !== "none",
      icon: <BadgePercent className="h-5 w-5" />,
    },
    {
      key: "services",
      title: "Add hotel services",
      description:
        hotel.serviceCount > 0
          ? `${hotel.serviceCount} services configured.`
          : "Airport transfer, pool, conference hall, and more.",
      done: hotel.serviceCount > 0,
      icon: <Hotel className="h-5 w-5" />,
    },
    {
      key: "social",
      title: "Add your social links",
      description:
        hotel.instagramUrl || hotel.telegramUrl
          ? "Shown to guests on the in-room page."
          : "Instagram / Telegram — hidden from guests until you add them.",
      done: Boolean(hotel.instagramUrl || hotel.telegramUrl),
      icon: <Share2 className="h-5 w-5" />,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 lg:px-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{hotel.name}</h1>
            <p className="text-xs text-slate-400">Manager dashboard</p>
          </div>
          <LogoutButton
            redirectTo="/dashboard/login"
            label="Sign out"
            className="text-sm text-slate-500 hover:text-slate-800"
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Set up your hotel</h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete these steps to finish your guests&apos; in-room experience.
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
            {doneCount}/{items.length}
          </span>
        </div>

        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.key}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm",
                item.done
                  ? "border-slate-100"
                  : item.important
                    ? "border-brand-200 ring-1 ring-brand-100"
                    : "border-slate-200"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                  item.done
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-brand-50 text-brand-600"
                )}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  {item.important && !item.done && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                      Important
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
              </div>
              <span
                className={cn(
                  "flex flex-shrink-0 items-center gap-1 text-xs font-semibold",
                  item.done ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {item.done ? (
                  <>
                    <Check className="h-4 w-4" /> Done
                  </>
                ) : (
                  <>
                    <Circle className="h-3.5 w-3.5" /> To do
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
