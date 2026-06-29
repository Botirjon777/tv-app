import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="manager"
        title="Hotel dashboard"
        subtitle="Sign in with your hotel code and manager password."
        fallback="/dashboard"
        accent="bg-brand-600"
        codeLabel="Hotel code"
        passwordLabel="Manager password"
        submitLabel="Sign in"
      />
    </Suspense>
  );
}
