"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AlarmClock,
  BellRing,
  Car,
  Check,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGS, LANG_SHORT, resolveText, t, type Lang } from "@/lib/i18n";
import { Modal, Button, Textarea } from "@/components/ui";

type RequestType = "ALARM" | "RECEPTION" | "TAXI";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80";

export function RoomLanding({
  hotel,
  room,
  lang,
  onChangeLang,
  onOpenMenu,
}: {
  hotel: { slug: string; name: string; imageUrl?: string };
  room: { number: string };
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  onOpenMenu: () => void;
}) {
  const [active, setActive] = useState<RequestType | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const services: {
    type: RequestType;
    title: () => string;
    sub: () => string;
    icon: typeof AlarmClock;
    accent: string;
  }[] = [
    {
      type: "RECEPTION",
      title: () => t(lang, "svcReception"),
      sub: () => t(lang, "svcReceptionSub"),
      icon: BellRing,
      accent: "from-amber-500 to-orange-600",
    },
    {
      type: "TAXI",
      title: () => t(lang, "svcTaxi"),
      sub: () => t(lang, "svcTaxiSub"),
      icon: Car,
      accent: "from-yellow-500 to-amber-600",
    },
    {
      type: "ALARM",
      title: () => t(lang, "svcAlarm"),
      sub: () => t(lang, "svcAlarmSub"),
      icon: AlarmClock,
      accent: "from-orange-500 to-rose-600",
    },
  ];

  const openRequest = (type: RequestType) => {
    setActive(type);
    setNote("");
    setSent(false);
    setError(null);
  };

  const closeModal = () => {
    if (sending) return;
    setActive(null);
  };

  const submit = async () => {
    if (!active) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelSlug: hotel.slug,
          roomNumber: room.number,
          type: active,
          note,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t(lang, "requestFailed"));
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t(lang, "requestFailed"));
    } finally {
      setSending(false);
    }
  };

  const activeSvc = services.find((s) => s.type === active);
  const heroSrc = hotel.imageUrl || FALLBACK_HERO;

  return (
    <main className="min-h-screen bg-zinc-950 pb-12 text-zinc-100">
      {/* Hero */}
      <section className="relative h-64 w-full overflow-hidden sm:h-80">
        <Image
          src={heroSrc}
          alt={hotel.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/10" />

        {/* Language switcher */}
        <div className="absolute right-2.5 top-2.5 flex items-center rounded-full border border-white/20 bg-black/40 p-0.5 backdrop-blur-md lg:right-5 lg:top-5">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => onChangeLang(l)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold transition",
                lang === l
                  ? "bg-brand-600 text-white"
                  : "text-zinc-200 hover:text-white"
              )}
            >
              {LANG_SHORT[l]}
            </button>
          ))}
        </div>

        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-2.5 pb-5 lg:px-5">
          <p className="text-sm font-medium text-brand-300">
            {t(lang, "welcome")} · {t(lang, "room")} {room.number}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-white drop-shadow-lg">
            {hotel.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-300">{t(lang, "howCanWeHelp")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-2.5 lg:px-5">
        {/* Menu banner */}
        <button
          onClick={onOpenMenu}
          className="group relative mt-5 flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-brand-700 p-5 text-left text-white shadow-xl shadow-brand-900/40 transition active:scale-[0.99]"
        >
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight">
              {t(lang, "openMenu")}
            </p>
            <p className="truncate text-sm text-white/80">
              {t(lang, "menuSubtitle")}
            </p>
          </div>
          <ChevronRight className="h-6 w-6 flex-shrink-0 transition group-hover:translate-x-1" />
        </button>

        {/* Services */}
        <h2 className="mb-3 mt-7 font-serif text-lg font-bold tracking-tight text-zinc-100">
          {t(lang, "services")}
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <button
                key={svc.type}
                onClick={() => openRequest(svc.type)}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left shadow-lg shadow-black/20 transition hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98] sm:flex-col sm:items-start sm:gap-2.5"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    svc.accent
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight text-zinc-50">
                    {svc.title()}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">{svc.sub()}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Request confirmation modal */}
      <Modal
        open={active !== null}
        onClose={closeModal}
        dark
        title={activeSvc ? activeSvc.title() : ""}
        footer={
          sent ? (
            <Button className="w-full" onClick={closeModal}>
              {t(lang, "close")}
            </Button>
          ) : (
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
                onClick={closeModal}
                disabled={sending}
              >
                {t(lang, "cancel")}
              </Button>
              <Button className="flex-1" onClick={submit} loading={sending}>
                {t(lang, "send")}
              </Button>
            </div>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-400">
              <Check className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-zinc-50">
              {t(lang, "requestSent")}
            </p>
            <p className="max-w-xs text-sm text-zinc-400">
              {t(lang, "requestSentSub")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              {activeSvc?.sub()} · {t(lang, "room")} {room.number}
            </p>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, "requestNotePlaceholder")}
              className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-brand-500 focus:ring-brand-900"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        )}
      </Modal>
    </main>
  );
}
