import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function PosLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="pos"
        title="Oshxona POS"
        subtitle="Buyurtmalarni ko‘rish uchun tizimga kiring."
        fallback="/pos"
        accent="bg-brand-600"
        passwordLabel="Parol"
        submitLabel="Kirish"
      />
    </Suspense>
  );
}
