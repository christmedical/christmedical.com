"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FC_BTN_PRIMARY,
  FC_ERROR_BANNER,
  FC_PAGE_STACK,
  FC_SURFACE,
  FC_SURFACE_BODY,
} from "@/components/design/fieldClinical";
import { getTenantBranding } from "@/lib/tenantConfig";

const PICK_TENANT_MEMBERSHIPS_KEY = "cm-pick-tenant-memberships";

type Membership = {
  tenantId: number;
  slug: string;
  name: string;
  shortName: string;
  themeColorHex: string;
  role: string;
};

export function PickTenantPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const preAuth = params.get("preAuth") ?? "";
  const returnTo = params.get("returnTo") ?? "/queue";

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!preAuth) {
      router.replace("/login");
      return;
    }

    try {
      const raw = sessionStorage.getItem(PICK_TENANT_MEMBERSHIPS_KEY);
      if (raw) setMemberships(JSON.parse(raw) as Membership[]);
      else setError("Session expired — sign in again.");
    } catch {
      setError("Session expired — sign in again.");
    }
  }, [preAuth, router]);

  async function choose(tenantId: number) {
    setLoadingId(tenantId);
    setError(null);
    try {
      const res = await fetch("/api/auth/select-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preAuthToken: preAuth, tenantId }),
      });
      const data = (await res.json()) as { ok?: boolean; redirectUrl?: string; message?: string };
      if (!res.ok || !data.ok || !data.redirectUrl) {
        setError(data.message ?? "Could not open that clinic.");
        return;
      }
      const url = new URL(data.redirectUrl);
      url.pathname = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
      window.location.href = url.toString();
    } catch {
      setError("Unable to reach the login service.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-fc-paper px-4 py-12">
      <div className={`w-full max-w-lg ${FC_SURFACE} ${FC_PAGE_STACK}`}>
        <div className={`${FC_SURFACE_BODY} space-y-6`}>
          <header className="space-y-1">
            <h1 className="font-display text-2xl font-semibold text-fc-ink">Choose a clinic</h1>
            <p className="text-sm text-fc-ink-muted">
              Your account has access to multiple mission clinics.
            </p>
          </header>

          {error ? <div className={FC_ERROR_BANNER}>{error}</div> : null}

          <ul className="space-y-3">
            {memberships.map((m) => {
              const branding = getTenantBranding(m.tenantId);
              return (
                <li key={m.tenantId}>
                  <button
                    type="button"
                    className={`${FC_BTN_PRIMARY} w-full justify-between`}
                    style={{ backgroundColor: branding.themeColor }}
                    disabled={loadingId === m.tenantId}
                    onClick={() => void choose(m.tenantId)}
                  >
                    <span>{m.name}</span>
                    <span className="text-xs opacity-80">{m.role}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
