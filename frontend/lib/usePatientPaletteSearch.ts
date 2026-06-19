"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { patientCommunity } from "@/lib/demoPatientMeta";
import {
  normalizeApiBaseUrl,
  patientsListUrl,
  patientsSearchUrl,
} from "@/lib/patientApi";
import { isSearchMode, type SpiritualFilter } from "@/lib/patientFilter";
import type { PatientSearchRecord } from "@/lib/patientSearchMatch";
import { filterPatientsLocalAdvanced } from "@/lib/patientSearchMatch";
import type { PatientDto } from "@/lib/patientTypes";
import {
  loadPatientsOffline,
  savePatientsOffline,
} from "@/lib/offlinePatientsDb";
import { useOnlineStatus } from "@/lib/onlineStatus";
import { loadRecentPatients } from "@/lib/recentPatients";
import { getTenantId } from "@/lib/tenantRuntime";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

const OFFLINE_PATIENT_CAP = 2000;

function toSearchRecord(patient: PatientDto): PatientSearchRecord {
  return {
    ...patient,
    community: patientCommunity(patient.id),
  };
}

export function usePatientPaletteSearch(enabled: boolean) {
  const online = useOnlineStatus();
  const [roster, setRoster] = useState<PatientDto[]>([]);
  const [searchResults, setSearchResults] = useState<PatientSearchRecord[] | null>(
    null,
  );
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 200);
  const [spiritual, setSpiritual] = useState<SpiritualFilter>("all");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchActive = isSearchMode(debouncedQ, spiritual);

  const loadRoster = useCallback(async () => {
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const tid = getTenantId();
    if (!base) {
      setError("NEXT_PUBLIC_API_URL is not set.");
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
      setRoster(data);
      void savePatientsOffline(tid, data).catch(() => {});
    } catch {
      const cached = await loadPatientsOffline(tid);
      if (cached?.length) {
        setRoster(cached);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async () => {
    if (!searchActive) {
      setSearchResults(null);
      return;
    }

    const enrichedRoster = roster.map(toSearchRecord);

    if (!online) {
      setSearchResults(
        filterPatientsLocalAdvanced(enrichedRoster, debouncedQ, spiritual),
      );
      return;
    }

    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const tid = getTenantId();
    if (!base) return;

    setSearchLoading(true);
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
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as PatientDto[];
      setSearchResults(data.map(toSearchRecord));
    } catch {
      setSearchResults(
        filterPatientsLocalAdvanced(enrichedRoster, debouncedQ, spiritual),
      );
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedQ, online, roster, searchActive, spiritual]);

  useEffect(() => {
    if (!enabled) return;
    void loadRoster();
  }, [enabled, loadRoster]);

  useEffect(() => {
    if (!enabled) return;
    void runSearch();
  }, [enabled, runSearch]);

  const recentRows = useMemo(() => {
    if (searchActive) return [];
    return loadRecentPatients().map(toSearchRecord);
  }, [searchActive]);

  const rows = searchActive ? (searchResults ?? []) : recentRows;
  const busy = loading || (searchActive && searchLoading);
  const showNoMatch =
    searchActive && !busy && rows.length === 0 && debouncedQ.trim() !== "";

  const reset = useCallback(() => {
    setQ("");
    setSpiritual("all");
    setSearchResults(null);
  }, []);

  return {
    q,
    setQ,
    spiritual,
    setSpiritual,
    rows,
    busy,
    searchActive,
    showNoMatch,
    online,
    error,
    reset,
  };
}
