"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { PatientDto } from "@/lib/patientTypes";
import { normalizeApiBaseUrl, patientsSearchUrl } from "@/lib/patientApi";
import { spiritualStatusBadgeClass } from "@/lib/spiritualBadge";
import { getTenantBranding } from "@/lib/tenantConfig";
import { getTenantId } from "@/lib/tenantRuntime";

type SpiritualFilter = "all" | "heard" | "hope" | "none";

export function PatientSearch() {
  const tenantId = getTenantId();
  const branding = getTenantBranding(tenantId);
  const [q, setQ] = useState("");
  const [spiritual, setSpiritual] = useState<SpiritualFilter>("all");
  const [results, setResults] = useState<PatientDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const tid = getTenantId();
    if (!base) {
      setError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }
    const tokens = q.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0 && spiritual === "all") {
      setError("Enter a name or legacy id, or pick a spiritual filter below.");
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = patientsSearchUrl(base, {
        tenantId: tid,
        q: q.trim() || undefined,
        spiritual,
        limit: 100,
      });
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 400) {
        const text = await res.text();
        setError(text || "Invalid search.");
        setResults(null);
        return;
      }
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
      const data = (await res.json()) as PatientDto[];
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [q, spiritual]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Patient search — {branding.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Search by <strong>legacy id</strong>, part of <strong>first or last name</strong>, or two
          words for <strong>first and last</strong>. Matching uses spelling and{" "}
          <strong>phonetic (Double Metaphone)</strong> codes so similar-sounding names resolve even
          when chart spelling differs.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <label htmlFor="patient-search-q" className="text-xs font-semibold uppercase text-zinc-500">
            Search
          </label>
          <input
            id="patient-search-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            placeholder="e.g. legacy id, “Maria”, or “Jon Smith”"
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            autoComplete="off"
          />
        </div>

        <div>
          <span id="spiritual-filter-label" className="text-xs font-semibold uppercase text-zinc-500">
            Spiritual filter
          </span>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="group"
            aria-labelledby="spiritual-filter-label"
          >
            {(
              [
                ["all", "All"],
                ["heard", "Heard gospel"],
                ["hope", "Hope / interest"],
                ["none", "No record"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpiritual(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  spiritual === value
                    ? "bg-teal-600 text-white shadow"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            With a filter other than &quot;All&quot;, you can run search without text to list everyone
            in that category (up to the result limit).
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
      </div>

      {results != null && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Results ({results.length})
          </h2>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No matching patients.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Name (masked)</th>
                    <th className="px-4 py-3">DOB</th>
                    <th className="px-4 py-3">Spiritual</th>
                    <th className="px-4 py-3">Legacy ID</th>
                    <th className="px-4 py-3 w-36"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {results.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/80">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {p.displayNameMasked}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {p.dateOfBirth ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${spiritualStatusBadgeClass(p.spiritualStatusKind)}`}
                        >
                          {p.heardGospelDate
                            ? `Heard · ${p.heardGospelDate}`
                            : p.spiritualStatusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {p.legacyId ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/patients?patientId=${encodeURIComponent(p.id)}`}
                          className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
                        >
                          Open chart
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
