"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({
  redirectTo,
  className,
  label = "Sign out",
}: {
  redirectTo: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(redirectTo);
    router.refresh();
  };
  return (
    <button
      onClick={logout}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800",
        className
      )}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
