import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function PosLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="pos"
        title="Oshxona POS"
        subtitle="Mehmonxona kodi va parol bilan kiring."
        fallback="/pos"
        accent="bg-brand-600"
        codeLabel="Mehmonxona kodi"
        passwordLabel="Parol"
        submitLabel="Kirish"
      />
    </Suspense>
  );
}
