"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import type { Role } from "@/lib/auth";

export function LoginForm({
  role,
  title,
  subtitle,
  fallback,
  accent,
  passwordLabel = "Password",
  submitLabel = "Sign in",
}: {
  role: Role;
  title: string;
  subtitle: string;
  fallback: string; // where to go after login if no ?from
  accent: string; // tailwind bg class for the icon
  passwordLabel?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      const from = params.get("from");
      router.replace(from && from.startsWith("/") ? from : fallback);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-2.5 lg:px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white p-2.5 shadow-xl lg:p-5"
      >
        <div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${accent}`}
        >
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

        <div className="mt-6">
          <Label>{passwordLabel}</Label>
          <Input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full"
          loading={loading}
        >
          {submitLabel}
        </Button>
      </form>
    </main>
  );
}
