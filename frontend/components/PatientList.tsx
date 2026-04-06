"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  normalizeApiBaseUrl,
  patientsListUrl,
  patientsPatchUrl,
} from "@/lib/patientApi";
import { reconcileSelectionAfterLoad } from "@/lib/patientSelection";
import type { PatientDto } from "@/lib/patientTypes";
import {
  loadPatientsOffline,
  savePatientsOffline,
} from "@/lib/offlinePatientsDb";
import { spiritualStatusBadgeClass } from "@/lib/spiritualBadge";
import { getTenantBranding } from "@/lib/tenantConfig";
import { getTenantId } from "@/lib/tenantRuntime";

export type { PatientDto } from "@/lib/patientTypes";

const OFFLINE_PATIENT_CAP = 2000;

type NotesDraft = {
  spiritualNotes: string;
  medicalHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  drugAllergies: string;
  hopeGospel: boolean;
  heardGospelDate: string;
};

function draftFromPatient(p: PatientDto): NotesDraft {
  return {
    spiritualNotes: p.spiritualNotes ?? "",
    medicalHistory: p.medicalHistory ?? "",
    surgicalHistory: p.surgicalHistory ?? "",
    familyHistory: p.familyHistory ?? "",
    drugAllergies: p.drugAllergies ?? "",
    hopeGospel: p.hopeGospel,
    heardGospelDate: p.heardGospelDate ?? "",
  };
}

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export function PatientList() {
  const searchParams = useSearchParams();
  const tenantId = getTenantId();
  const branding = getTenantBranding(tenantId);

  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [selected, setSelected] = useState<PatientDto | null>(null);
  const [draft, setDraft] = useState<NotesDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        patientsListUrl(base, {
          tenantId: tid,
          limit: OFFLINE_PATIENT_CAP,
        }),
        { cache: "no-store" },
      );
      if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as PatientDto[];
      setPatients(data);
      setSelected((prev) => reconcileSelectionAfterLoad(prev, data));
      void savePatientsOffline(tid, data).catch(() => {
        /* quota / private mode */
      });
    } catch (e) {
      const cached = await loadPatientsOffline(tid);
      if (cached?.length) {
        setPatients(cached);
        setSelected((prev) => reconcileSelectionAfterLoad(prev, cached));
        setError(
          "Offline or server unreachable — showing cached patients.",
        );
      } else {
        setError(e instanceof Error ? e.message : "Failed to load patients.");
        setPatients([]);
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const pid = searchParams.get("patientId");
    if (!pid || patients.length === 0) return;
    const match = patients.find((p) => p.id === pid);
    if (match) setSelected(match);
  }, [searchParams, patients]);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft(draftFromPatient(selected));
    setSaveError(null);
  }, [selected]);

  const saveDraft = useCallback(async () => {
    if (!selected || draft == null) return;
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const tid = getTenantId();
    if (!base) {
      setSaveError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(patientsPatchUrl(base, selected.id, tid), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spiritualNotes: emptyToNull(draft.spiritualNotes),
          medicalHistory: emptyToNull(draft.medicalHistory),
          surgicalHistory: emptyToNull(draft.surgicalHistory),
          familyHistory: emptyToNull(draft.familyHistory),
          drugAllergies: emptyToNull(draft.drugAllergies),
          hopeGospel: draft.hopeGospel,
          heardGospelDate: draft.heardGospelDate.trim()
            ? draft.heardGospelDate.trim()
            : null,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(
          detail
            ? `Save failed (${res.status}): ${detail}`
            : `Save failed: ${res.status} ${res.statusText}`,
        );
      }
      const updated = (await res.json()) as PatientDto;
      setPatients((prev) => {
        const next = prev.map((x) => (x.id === updated.id ? updated : x));
        void savePatientsOffline(tid, next).catch(() => {});
        return next;
      });
      setSelected(updated);
      setDraft(draftFromPatient(updated));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [draft, selected]);

  return (
    <div className="flex min-h-screen flex-col gap-0 md:flex-row">
      <section className="flex-1 overflow-auto p-6 md:border-r md:border-zinc-200 dark:md:border-zinc-800">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {branding.name} — patients
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Up to {OFFLINE_PATIENT_CAP.toLocaleString()} sanitized records
              (tenant {tenantId}). Cached locally for offline lookup. Names are
              masked.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
        </header>

        {loading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        )}
        {error && (
          <p
            className={
              error.includes("cached")
                ? "rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            }
          >
            {error}
          </p>
        )}

        {!loading && !error && patients.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No patients returned. Run the ETL against Postgres, then refresh.
          </p>
        )}

        {!loading && patients.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Name (masked)</th>
                  <th className="px-4 py-3">DOB</th>
                  <th className="px-4 py-3">Spiritual status</th>
                  <th className="px-4 py-3">Legacy ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {patients.map((p) => {
                  const isSel = selected?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/80 ${
                        isSel ? "bg-sky-50 dark:bg-sky-950/30" : ""
                      }`}
                      onClick={() => setSelected(p)}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {p.displayNameMasked}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 tabular-nums dark:text-zinc-300">
                        {p.dateOfBirth ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${spiritualStatusBadgeClass(p.spiritualStatusKind)}`}
                        >
                          {p.heardGospelDate
                            ? `Heard · ${p.heardGospelDate}`
                            : p.spiritualStatusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {p.legacyId ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="w-full shrink-0 border-t border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/50 md:w-96 md:border-t-0">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Details
        </h2>
        {!selected ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Select a patient to view clinical and spiritual notes.
          </p>
        ) : draft == null ? null : (
          <div className="mt-4 space-y-5 text-sm">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Edits save to the server immediately (last write wins if two people
              edit the same patient).
            </p>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Masked name
                </dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {selected.displayNameMasked}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Legacy ID
                </dt>
                <dd className="font-mono text-zinc-800 dark:text-zinc-200">
                  {selected.legacyId ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Spiritual status (after save)
                </dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${spiritualStatusBadgeClass(selected.spiritualStatusKind)}`}
                  >
                    {selected.spiritualStatusLabel}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={draft.hopeGospel}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, hopeGospel: e.target.checked } : d,
                    )
                  }
                  className="size-4 rounded border-zinc-400 text-teal-600 focus:ring-teal-500"
                />
                Hope / gospel interest
              </label>
              <div>
                <label
                  htmlFor="heard-date"
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                >
                  Heard gospel date
                </label>
                <input
                  id="heard-date"
                  type="date"
                  value={draft.heardGospelDate}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, heardGospelDate: e.target.value } : d,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="spiritual-notes"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                Spiritual check-up notes
              </label>
              <textarea
                id="spiritual-notes"
                value={draft.spiritualNotes}
                onChange={(e) =>
                  setDraft((d) =>
                    d ? { ...d, spiritualNotes: e.target.value } : d,
                  )
                }
                rows={4}
                className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 font-sans text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Clinical notes
              </h3>
              <ul className="mt-2 space-y-3">
                <NoteField
                  label="Medical history"
                  value={draft.medicalHistory}
                  onChange={(v) =>
                    setDraft((d) => (d ? { ...d, medicalHistory: v } : d))
                  }
                />
                <NoteField
                  label="Surgical history"
                  value={draft.surgicalHistory}
                  onChange={(v) =>
                    setDraft((d) => (d ? { ...d, surgicalHistory: v } : d))
                  }
                />
                <NoteField
                  label="Family history"
                  value={draft.familyHistory}
                  onChange={(v) =>
                    setDraft((d) => (d ? { ...d, familyHistory: v } : d))
                  }
                />
                <NoteField
                  label="Allergies"
                  value={draft.drugAllergies}
                  onChange={(v) =>
                    setDraft((d) => (d ? { ...d, drugAllergies: v } : d))
                  }
                />
              </ul>
            </div>

            {saveError && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {saveError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveDraft()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDraft(draftFromPatient(selected))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function NoteField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <li>
      <label htmlFor={id} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-white p-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      />
    </li>
  );
}
