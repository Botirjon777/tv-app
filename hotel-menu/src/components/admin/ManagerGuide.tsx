"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { buildManagerGuide } from "@/lib/onboarding";

// A ready-to-send setup message (bot username + this hotel's connect code) the
// admin copies and forwards to the hotel manager.
export function ManagerGuide({
  hotelName,
  connectCode,
  posPassword,
}: {
  hotelName: string;
  connectCode: string;
  posPassword: string;
}) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL ?? "";

  const text = buildManagerGuide({ hotelName, connectCode, posPassword, baseUrl });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <Send className="h-4 w-4 text-brand-600" /> Setup guide for the manager
        </h3>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-3 py-3 font-sans text-sm leading-relaxed text-slate-700">
        {text}
      </pre>
    </div>
  );
}
