import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="admin"
        title="Admin Panel"
        subtitle="Sign in to manage the menu and orders."
        fallback="/admin"
        accent="bg-slate-900"
      />
    </Suspense>
  );
}
