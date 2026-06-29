"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { Button, CenteredSpinner, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

type FeeType = "none" | "percent" | "fixed";

type HotelSettings = {
  serviceFeeType: FeeType;
  serviceFeeValue: number;
  preorderEnabled: boolean;
  instagramUrl: string;
  telegramUrl: string;
  wifiName: string;
  wifiPassword: string;
};

const FEE_PRESETS = [0, 10, 12, 15];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feeType, setFeeType] = useState<FeeType>("none");
  const [feeValue, setFeeValue] = useState("0");
  const [preorder, setPreorder] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  useEffect(() => {
    api
      .get<HotelSettings>("/api/dashboard/hotel")
      .then((h) => {
        setFeeType(h.serviceFeeType);
        setFeeValue(String(h.serviceFeeValue));
        setPreorder(h.preorderEnabled);
        setInstagram(h.instagramUrl ?? "");
        setTelegram(h.telegramUrl ?? "");
        setWifiName(h.wifiName ?? "");
        setWifiPassword(h.wifiPassword ?? "");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.patch("/api/dashboard/hotel", {
        serviceFeeType: feeType,
        serviceFeeValue: feeType === "none" ? 0 : parseInt(feeValue) || 0,
        preorderEnabled: preorder,
        instagramUrl: instagram.trim(),
        telegramUrl: telegram.trim(),
        wifiName: wifiName.trim(),
        wifiPassword: wifiPassword.trim(),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CenteredSpinner label="Loading settings…" />;

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-slate-900">Settings</h2>
      <p className="mt-1 text-sm text-slate-500">
        Service fee, preorder, social links and Wi-Fi for your hotel.
      </p>

      {/* Service fee */}
      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
        <h3 className="font-bold text-slate-900">Service fee</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Added to each order total.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["none", "percent", "fixed"] as FeeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFeeType(t)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition",
                feeType === t
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {t === "none" ? "No fee" : t === "percent" ? "Percentage" : "Fixed"}
            </button>
          ))}
        </div>

        {feeType === "percent" && (
          <div className="mt-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {FEE_PRESETS.filter((p) => p > 0).map((p) => (
                <button
                  key={p}
                  onClick={() => setFeeValue(String(p))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                    feeValue === String(p)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
            <Label>Custom percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
        )}

        {feeType === "fixed" && (
          <div className="mt-3">
            <Label>Fixed amount (UZS)</Label>
            <Input
              type="number"
              min={0}
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              className="w-40"
            />
          </div>
        )}
      </section>

      {/* Preorder */}
      <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="block font-bold text-slate-900">Preorder</span>
            <span className="text-sm text-slate-500">
              Let guests schedule an order for a later time.
            </span>
          </span>
          <input
            type="checkbox"
            checked={preorder}
            onChange={(e) => setPreorder(e.target.checked)}
            className="h-5 w-5 accent-brand-600"
          />
        </label>
      </section>

      {/* Social */}
      <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
        <h3 className="font-bold text-slate-900">Social links</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Hidden from guests when left empty.
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <Label>Instagram URL</Label>
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/your-hotel"
            />
          </div>
          <div>
            <Label>Telegram URL</Label>
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="https://t.me/your-hotel"
            />
          </div>
        </div>
      </section>

      {/* Wi-Fi */}
      <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
        <h3 className="font-bold text-slate-900">Guest Wi-Fi</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Network name</Label>
            <Input
              value={wifiName}
              onChange={(e) => setWifiName(e.target.value)}
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} loading={saving}>
          Save settings
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}
