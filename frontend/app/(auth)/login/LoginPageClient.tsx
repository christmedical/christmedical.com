"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  FC_BTN_PRIMARY,
  FC_ERROR_BANNER,
  FC_FIELD_LABEL,
  FC_INPUT,
  FC_PAGE_STACK,
  FC_SURFACE,
  FC_SURFACE_BODY,
} from "@/components/design/fieldClinical";

const PICK_TENANT_MEMBERSHIPS_KEY = "cm-pick-tenant-memberships";

type LoginResult =
  | { ok: true; redirectUrl: string }
  | { ok: true; pickTenant: true; preAuthToken: string; memberships: Membership[] }
  | { ok: false; message: string };

type Membership = {
  tenantId: number;
  slug: string;
  name: string;
  shortName: string;
  themeColorHex: string;
  role: string;
};

export function LoginPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/queue";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as LoginResult & {
        tenantSlug?: string;
        preAuthToken?: string;
        message?: string;
      };

      if (!res.ok || !("ok" in data) || !data.ok) {
        setError(data.message ?? "Sign in failed.");
        return;
      }

      if ("pickTenant" in data && data.pickTenant && data.preAuthToken) {
        try {
          sessionStorage.setItem(
            PICK_TENANT_MEMBERSHIPS_KEY,
            JSON.stringify(data.memberships ?? []),
          );
        } catch {
          /* private mode */
        }
        const qs = new URLSearchParams({
          preAuth: data.preAuthToken,
          returnTo,
        });
        router.push(`/pick-tenant?${qs.toString()}`);
        return;
      }

      if ("redirectUrl" in data && data.redirectUrl) {
        const url = new URL(data.redirectUrl);
        url.pathname = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
        window.location.href = url.toString();
        return;
      }

      setError("Unexpected login response.");
    } catch {
      setError("Unable to reach the login service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-fc-paper px-4 py-12">
      <div className={`w-full max-w-md ${FC_SURFACE} ${FC_PAGE_STACK}`}>
        <div className={`${FC_SURFACE_BODY} space-y-6`}>
          <header className="space-y-1">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-fc-accent">
              Christ Medical
            </p>
            <h1 className="font-display text-2xl font-semibold text-fc-ink">Clinician sign in</h1>
            <p className="text-sm text-fc-ink-muted">
              One login for all mission clinics. You&apos;ll land on your clinic subdomain after
              authentication.
            </p>
          </header>

          {error ? <div className={FC_ERROR_BANNER}>{error}</div> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className={FC_FIELD_LABEL}>Email</span>
              <input
                className={FC_INPUT}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className={FC_FIELD_LABEL}>Password</span>
              <input
                className={FC_INPUT}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
            </label>
            <button type="submit" className={`${FC_BTN_PRIMARY} w-full`} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-fc-ink-subtle">
            Demo: belize@christmedical.com or multi@christmedical.com — password{" "}
            <span className="font-mono">ChristMedical1!</span>
          </p>
        </div>
      </div>
    </main>
  );
}
