"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeApiBaseUrl, patientsListUrl } from "@/lib/patientApi";
import { reconcileSelectionAfterLoad } from "@/lib/patientSelection";
import type { PatientDto } from "@/lib/patientTypes";
import { spiritualStatusBadgeClass } from "@/lib/spiritualBadge";

export type { PatientDto } from "@/lib/patientTypes";

export function PatientList() {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [selected, setSelected] = useState<PatientDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    if (!base) {
      setError("NEXT_PUBLIC_API_URL is not set.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(patientsListUrl(base), { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as PatientDto[];
      setPatients(data);
      setSelected((prev) => reconcileSelectionAfterLoad(prev, data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patients.");
      setPatients([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-screen flex-col gap-0 md:flex-row">
      <section className="flex-1 overflow-auto p-6 md:border-r md:border-zinc-200 dark:md:border-zinc-800">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Belize mission patients
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              First 50 sanitized records (tenant 1). Names are masked.
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
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
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
        ) : (
          <div className="mt-4 space-y-5 text-sm">
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
                  Spiritual status
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

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Spiritual check-up notes
              </h3>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-3 font-sans text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {selected.spiritualNotes?.trim() || "—"}
              </pre>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Clinical notes
              </h3>
              <ul className="mt-2 space-y-3">
                <NoteBlock label="Medical history" value={selected.medicalHistory} />
                <NoteBlock label="Surgical history" value={selected.surgicalHistory} />
                <NoteBlock label="Family history" value={selected.familyHistory} />
                <NoteBlock label="Allergies" value={selected.drugAllergies} />
              </ul>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <li>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {value?.trim() || "—"}
      </p>
    </li>
  );
}
