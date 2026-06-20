"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FC_CHIP,
  FC_CHIP_ACTIVE,
  FC_ERROR_BANNER,
  FC_INPUT,
  FC_MUTED_NOTE,
  FC_SURFACE,
  FC_WARN_BANNER,
} from "@/components/design/fieldClinical";
import { formatDobWithAge } from "@/lib/patientAge";
import {
  normalizeApiBaseUrl,
  patientsListUrl,
  patientsSearchUrl,
} from "@/lib/patientApi";
import {
  filterPatientsLocal,
  isSearchMode,
  SPIRITUAL_FILTERS,
  type SpiritualFilter,
} from "@/lib/patientFilter";
import type { PatientDto } from "@/lib/patientTypes";
import {
  loadPatientsOffline,
  savePatientsOffline,
} from "@/lib/offlinePatientsDb";
import { useOnlineStatus } from "@/lib/onlineStatus";
import { spiritualStatusBadgeClass } from "@/lib/spiritualBadge";
import { getTenantId } from "@/lib/tenantRuntime";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const OFFLINE_PATIENT_CAP = 2000;

export function PatientSearch() {
  const router = useRouter();
  const online = useOnlineStatus();

  const [allPatients, setAllPatients] = useState<PatientDto[]>([]);
  const [searchResults, setSearchResults] = useState<PatientDto[] | null>(null);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 250);
  const [spiritual, setSpiritual] = useState<SpiritualFilter>("all");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchActive = isSearchMode(debouncedQ, spiritual);

  const displayedPatients = useMemo(() => {
    if (!searchActive) return [];
    return searchResults ?? [];
  }, [searchActive, searchResults]);

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
      const res = await fetch(
        patientsListUrl(base, { tenantId: tid, limit: OFFLINE_PATIENT_CAP }),
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
      const data = (await res.json()) as PatientDto[];
      setAllPatients(data);
      void savePatientsOffline(tid, data).catch(() => {});
    } catch (e) {
      const cached = await loadPatientsOffline(tid);
      if (cached?.length) {
        setAllPatients(cached);
        setError("Offline or server unreachable — cached roster available for search.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load patients.");
        setAllPatients([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async () => {
    if (!searchActive) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    if (!online) {
      setSearchResults(filterPatientsLocal(allPatients, debouncedQ, spiritual));
      setSearchError(null);
      return;
    }

    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const tid = getTenantId();
    if (!base) {
      setSearchError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        patientsSearchUrl(base, {
          tenantId: tid,
          q: debouncedQ.trim() || undefined,
          spiritual,
          limit: 100,
        }),
        { cache: "no-store" },
      );
      if (res.status === 400) {
        const text = await res.text();
        setSearchError(text || "Invalid search.");
        setSearchResults([]);
        return;
      }
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
      setSearchResults((await res.json()) as PatientDto[]);
    } catch (e) {
      const cached = filterPatientsLocal(allPatients, debouncedQ, spiritual);
      if (cached.length > 0) {
        setSearchResults(cached);
        setSearchError("Server unreachable — showing cached matches.");
      } else {
        setSearchError(e instanceof Error ? e.message : "Search failed.");
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [allPatients, debouncedQ, online, searchActive, spiritual]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const listBusy = loading || (searchActive && searchLoading);
  const listMessage = searchError ?? error;
  const showFilterButton = spiritual !== "all" && q.trim() === "";
  const showNoMatch =
    searchActive && !listBusy && displayedPatients.length === 0 && !listMessage;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <label htmlFor="patient-search-q" className="font-display text-xs font-semibold uppercase tracking-widest text-fc-ink-subtle">
          Search patients
        </label>
        <input
          id="patient-search-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, legacy ID, or DOB"
          className={`${FC_INPUT} mt-2 text-base`}
          autoComplete="off"
        />
        <p className={`${FC_MUTED_NOTE} mt-2`}>
          Name matching is phonetic when you are online. Up to{" "}
          {OFFLINE_PATIENT_CAP.toLocaleString()} records cached for offline use.
        </p>
      </div>

      <div>
        <span id="spiritual-filter-label" className="font-display text-xs font-semibold uppercase tracking-widest text-fc-ink-subtle">
          Spiritual filter
        </span>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-labelledby="spiritual-filter-label"
        >
          {SPIRITUAL_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSpiritual(value)}
              className={spiritual === value ? FC_CHIP_ACTIVE : FC_CHIP}
            >
              {label}
            </button>
          ))}
        </div>
        {showFilterButton ? (
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searchLoading}
            className="mt-3 text-sm font-medium text-fc-accent hover:text-fc-accent-strong disabled:opacity-50"
          >
            {searchLoading ? "Loading…" : "List everyone in this category"}
          </button>
        ) : null}
      </div>

      {listBusy && (
        <p className="text-sm text-fc-ink-muted">{searchActive ? "Searching…" : "Loading…"}</p>
      )}
      {listMessage && (
        <p className={listMessage.includes("cached") || listMessage.includes("Offline") ? FC_WARN_BANNER : FC_ERROR_BANNER}>
          {listMessage}
        </p>
      )}

      {!searchActive && !listBusy && (
        <p className="rounded-xl border border-dashed border-fc-border-strong bg-fc-surface px-6 py-10 text-center text-sm text-fc-ink-muted">
          Enter a name, legacy ID, or DOB — or pick a spiritual filter — to find a patient chart.
        </p>
      )}

      {showNoMatch && (
        <div className={`${FC_SURFACE} space-y-4 p-6 text-center`}>
          <p className="font-display text-base font-medium text-fc-ink">No match found</p>
          <p className="text-sm text-fc-ink-muted">
            Search first before registering someone new — phonetic matching may find a record under a
            different spelling.
          </p>
          <Link href="/patients/new" className="inline-flex min-h-11 items-center rounded-lg bg-fc-accent px-5 py-2 text-sm font-medium text-fc-paper shadow hover:bg-fc-accent-strong">
            Register new patient
          </Link>
        </div>
      )}

      {displayedPatients.length > 0 && (
        <ul className="space-y-3">
          {displayedPatients.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => router.push(`/patients/${p.id}`)}
                className={`${FC_SURFACE} flex w-full min-h-11 flex-col gap-2 p-4 text-left transition-colors hover:bg-fc-accent-tint sm:flex-row sm:items-center sm:justify-between`}
              >
                <div className="min-w-0">
                  <div className="font-medium text-fc-ink">{p.displayName}</div>
                  <div className="mt-1 font-tabular text-sm text-fc-ink-muted">
                    {formatDobWithAge(p.dateOfBirth, p.calculatedAge)}
                    {p.gender ? ` · ${p.gender}` : ""}
                    {" · Village: —"}
                    {p.legacyId ? ` · ${p.legacyId}` : ""}
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${spiritualStatusBadgeClass(p.spiritualStatusKind)}`}
                >
                  {p.heardGospelDate
                    ? `Heard · ${p.heardGospelDate}`
                    : p.spiritualStatusLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-medium text-fc-ink-muted hover:text-fc-ink"
        >
          Refresh roster
        </button>
      </div>
    </div>
  );
}
