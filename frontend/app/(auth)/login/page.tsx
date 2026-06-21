import { Suspense } from "react";
import { LoginPageClient } from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-fc-paper" />}>
      <LoginPageClient />
    </Suspense>
  );
}
