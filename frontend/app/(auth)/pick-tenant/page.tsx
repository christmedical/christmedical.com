import { Suspense } from "react";
import { PickTenantPageClient } from "./PickTenantPageClient";

export default function PickTenantPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-fc-paper" />}>
      <PickTenantPageClient />
    </Suspense>
  );
}
