"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DashboardSummaryDto } from "@/lib/dashboardTypes";
import { dashboardSummaryUrl, normalizeApiBaseUrl } from "@/lib/patientApi";
import { getTenantBranding } from "@/lib/tenantConfig";
import { getTenantId } from "@/lib/tenantRuntime";

function pct(part: number, total: number): string {
  if (total <= 0) return "0";
  return Math.round((part / total) * 1000) / 10 + "";
}

export function DashboardHome() {
  const tenantId = getTenantId();
  const branding = getTenantBranding(tenantId);
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const tid = getTenantId();
    if (!base) {
      setError("NEXT_PUBLIC_API_URL is not set.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(dashboardSummaryUrl(base, tid), { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setData((await res.json()) as DashboardSummaryDto);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sp = data?.spiritual;
  const md = data?.medical;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mission dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {branding.name} (tenant {tenantId}) — high-level spiritual and clinical footprint. Use
            this to see gospel engagement and documentation depth before drilling into{" "}
            <Link href="/search" className="font-medium text-teal-700 underline dark:text-teal-400">
              patient search
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/search"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700"
          >
            Patient search
          </Link>
          <Link
            href="/patients"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Full list
          </Link>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading metrics…</p>
      )}
      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {error} Charts need the API and database. For local dev, run Docker Postgres and the API
          (see README).
        </p>
      )}

      {data && sp && md && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Spiritual impact
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Counts are mission patients (not deleted). “Heard” uses a recorded heard-gospel date.
            </p>
            <dl className="mt-6 space-y-4">
              <div className="flex justify-between gap-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">Total patients</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {sp.totalPatients.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">Heard gospel</dt>
                <dd className="text-right">
                  <span className="text-lg font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                    {sp.heardGospel.toLocaleString()}
                  </span>
                  <span className="ml-2 text-xs text-zinc-500">
                    ({pct(sp.heardGospel, sp.totalPatients)}%)
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">Hope / interest (not yet heard)</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {sp.hopeWithoutHeard.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">No spiritual record</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {sp.noSpiritualRecord.toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Medical documentation
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Non-empty allergy / history fields and visit rows loaded into Postgres.
            </p>
            <dl className="mt-6 space-y-4">
              <div className="flex justify-between gap-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">Patients with allergies documented</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {md.patientsWithAllergiesDocumented.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">With medical history</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {md.patientsWithMedicalHistory.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">With surgical history</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {md.patientsWithSurgicalHistory.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">Total visits (rows)</dt>
                <dd className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {md.totalVisits.toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
