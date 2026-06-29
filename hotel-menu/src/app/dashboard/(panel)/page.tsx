"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  Check,
  ChefHat,
  ChevronRight,
  Circle,
  Hotel,
  Send,
  Share2,
} from "lucide-react";
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
  href?: string;
  icon: React.ReactNode;
};

export default function DashboardHome() {
  const [hotel, setHotel] = useState<DashboardHotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/hotel", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => active && setHotel(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <CenteredSpinner label="Loading…" />;
  if (!hotel)
    return <p className="text-slate-500">Could not load your dashboard.</p>;

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
          ? "Add a percentage or fixed fee per order — or leave it off."
          : hotel.serviceFeeType === "percent"
            ? `${hotel.serviceFeeValue}% added to each order.`
            : "Fixed fee added to each order.",
      done: hotel.serviceFeeType !== "none",
      href: "/dashboard/settings",
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
      href: "/dashboard/services",
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
      href: "/dashboard/settings",
      icon: <Share2 className="h-5 w-5" />,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
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
        {items.map((item) => {
          const Row = (
            <div
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition",
                item.href && "hover:border-brand-300",
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
                ) : item.href ? (
                  <>
                    Set up <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Circle className="h-3.5 w-3.5" /> To do
                  </>
                )}
              </span>
            </div>
          );
          return (
            <li key={item.key}>
              {item.href ? <Link href={item.href}>{Row}</Link> : Row}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
