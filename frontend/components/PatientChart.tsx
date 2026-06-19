"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  normalizeApiBaseUrl,
  patientVisitsCreateUrl,
  patientVisitsListUrl,
  patientsListUrl,
  patientsPatchUrl,
} from "@/lib/patientApi";
import type { PatientDto } from "@/lib/patientTypes";
import {
  loadPatientsOffline,
  savePatientsOffline,
} from "@/lib/offlinePatientsDb";
import { useOnlineStatus } from "@/lib/onlineStatus";
import { spiritualStatusBadgeClass } from "@/lib/spiritualBadge";
import { getTenantId } from "@/lib/tenantRuntime";
import type { VisitDto } from "@/lib/visitTypes";

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

function formatDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type EncounterFormState = {
  chiefComplaint: string;
  diagnosisText: string;
  referralNotes: string;
  weight: string;
  height: string;
  pulse: string;
  bp: string;
  resp: string;
  tempF: string;
  oxygenSat: string;
  glucose: string;
  hemoglobin: string;
  locationName: string;
  visitAtLocal: string;
};

function emptyEncounterForm(): EncounterFormState {
  return {
    chiefComplaint: "",
    diagnosisText: "",
    referralNotes: "",
    weight: "",
    height: "",
    pulse: "",
    bp: "",
    resp: "",
    tempF: "",
    oxygenSat: "",
    glucose: "",
    hemoglobin: "",
    locationName: "",
    visitAtLocal: formatDatetimeLocalValue(new Date()),
  };
}

function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalDecimal(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
}

const NEW_PATIENT: PatientDto = {
  id: "",
  legacyId: null,
  displayName: "New patient",
  dateOfBirth: null,
  calculatedAge: null,
  gender: null,
  hopeGospel: false,
  heardGospelDate: null,
  spiritualStatusLabel: "No spiritual record",
  spiritualStatusKind: "none",
  spiritualNotes: null,
  medicalHistory: null,
  surgicalHistory: null,
  familyHistory: null,
  drugAllergies: null,
};

export function PatientChart({
  patientId,
  isNew = false,
}: {
  patientId?: string;
  isNew?: boolean;
}) {
  const tenantId = getTenantId();
  const online = useOnlineStatus();

  const [selected, setSelected] = useState<PatientDto | null>(isNew ? NEW_PATIENT : null);
  const [draft, setDraft] = useState<NotesDraft | null>(isNew ? draftFromPatient(NEW_PATIENT) : null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isNew || !patientId) return;

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
      const match = data.find((p) => p.id === patientId) ?? null;
      setSelected(match);
      if (match) setDraft(draftFromPatient(match));
      void savePatientsOffline(tid, data).catch(() => {});
      if (!match) setError("Patient not found in roster.");
    } catch (e) {
      const cached = await loadPatientsOffline(tid);
      const match = cached?.find((p) => p.id === patientId) ?? null;
      if (match) {
        setSelected(match);
        setDraft(draftFromPatient(match));
        setError("Offline or server unreachable — showing cached chart.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load patient.");
        setSelected(null);
        setDraft(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isNew, patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveDraft = useCallback(async () => {
    if (!selected || draft == null || isNew) {
      if (isNew) {
        setSaveError("Registration save is not wired yet — capture demographics on paper until create API ships.");
      }
      return;
    }
    if (!online) {
      setSaveError(
        "Offline — saving is paused. Your edits are kept on this device until you reconnect.",
      );
      return;
    }
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
      setSelected(updated);
      setDraft(draftFromPatient(updated));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [draft, isNew, online, selected]);

  if (loading) {
    return <p className="text-sm text-fc-ink-muted">Loading chart…</p>;
  }

  if (error && !selected) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-fc-warn-border bg-fc-warn-bg p-3 text-sm text-fc-warn-ink">
          {error}
        </p>
        <Link href="/patients" className="text-sm font-medium text-fc-accent underline">
          Back to search
        </Link>
      </div>
    );
  }

  if (!selected || draft == null) {
    return (
      <p className="text-sm text-fc-ink-muted">
        Chart unavailable.{" "}
        <Link href="/patients" className="text-fc-accent underline">
          Search patients
        </Link>
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isNew ? (
        <p className="mb-4 rounded-lg border border-fc-border bg-fc-accent-tint px-4 py-3 text-sm text-fc-ink">
          New registration — complete the chart after search found no match. Saving to the server
          will be enabled when the create API is available.
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-fc-warn-border bg-fc-warn-bg p-3 text-sm text-fc-warn-ink">
          {error}
        </p>
      ) : null}
      <header className="border-b border-zinc-200 bg-zinc-50/80 px-4 py-4 lg:px-6 lg:py-5">
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                Edits save to the server (last write wins if two people edit the
                same patient). If you’re offline, saving is paused until you
                reconnect.
              </p>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <dl className="grid min-w-0 flex-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Name</dt>
                    <dd className="font-medium text-zinc-900">{selected.displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">DOB</dt>
                    <dd className="tabular-nums text-zinc-800 dark:text-zinc-200">
                      {selected.dateOfBirth ?? "—"}
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

                <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end lg:min-w-[16rem] lg:flex-col lg:items-stretch">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
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
                  <div className="min-w-0">
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
              </div>
            </header>

            <div className="space-y-6 px-4 py-5 lg:px-6 lg:py-6">
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
                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                </div>
              </div>

              <EncountersPanel
                patientId={selected.id}
                tenantId={tenantId}
                online={online}
                disabled={isNew}
              />

              {saveError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {saveError}
                </p>
              )}
              <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  disabled={saving}
                  aria-disabled={saving || !online}
                  onClick={() => void saveDraft()}
                  className={`rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-50 ${
                    saving || !online ? "cursor-not-allowed opacity-50" : ""
                  }`}
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
    </div>
  );
}

function EncountersPanel({
  patientId,
  tenantId,
  online,
  disabled = false,
}: {
  patientId: string;
  tenantId: number;
  online: boolean;
  disabled?: boolean;
}) {
  const [visits, setVisits] = useState<VisitDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<EncounterFormState>(emptyEncounterForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const loadVisits = useCallback(async () => {
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    if (!base) {
      setLoadError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        patientVisitsListUrl(base, patientId, tenantId),
        { cache: "no-store" },
      );
      if (!res.ok) {
        throw new Error(`Encounters ${res.status} ${res.statusText}`);
      }
      const raw: unknown = await res.json();
      const data = Array.isArray(raw) ? (raw as VisitDto[]) : [];
      setVisits(data);
    } catch (e) {
      setVisits([]);
      setLoadError(
        e instanceof Error ? e.message : "Failed to load encounters.",
      );
    } finally {
      setLoading(false);
    }
  }, [patientId, tenantId]);

  useEffect(() => {
    setForm(emptyEncounterForm());
    setSaveError(null);
    setFormOpen(false);
    void loadVisits();
  }, [loadVisits]);

  const submitEncounter = async () => {
    if (!online) {
      setSaveError(
        "Offline — add encounters when you are back online, or use your local paper workflow.",
      );
      return;
    }
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    if (!base) {
      setSaveError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }
    const weight = parseOptionalDecimal(form.weight);
    const height = parseOptionalDecimal(form.height);
    const pulse = parseOptionalInt(form.pulse);
    const resp = parseOptionalInt(form.resp);
    const tempF = parseOptionalDecimal(form.tempF);
    const oxygenSat = parseOptionalInt(form.oxygenSat);
    const glucose = parseOptionalDecimal(form.glucose);
    const hemoglobin = parseOptionalDecimal(form.hemoglobin);
    const bp = form.bp.trim() || undefined;

    const vitals =
      weight !== undefined ||
      height !== undefined ||
      pulse !== undefined ||
      bp !== undefined ||
      resp !== undefined ||
      tempF !== undefined ||
      oxygenSat !== undefined ||
      glucose !== undefined ||
      hemoglobin !== undefined
        ? {
            weight,
            height,
            pulse,
            bp,
            resp,
            tempF,
            oxygenSat,
            glucose,
            hemoglobin,
          }
        : undefined;

    const visitDate = form.visitAtLocal
      ? new Date(form.visitAtLocal).toISOString()
      : undefined;

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(patientVisitsCreateUrl(base, patientId, tenantId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate,
          locationName: emptyToNull(form.locationName),
          chiefComplaint: emptyToNull(form.chiefComplaint),
          diagnosisText: emptyToNull(form.diagnosisText),
          referralNotes: emptyToNull(form.referralNotes),
          vitals,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(
          detail
            ? `Save failed (${res.status}): ${detail}`
            : `Save failed: ${res.status}`,
        );
      }
      setForm(emptyEncounterForm());
      setFormOpen(false);
      await loadVisits();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save encounter.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  const closeForm = () => {
    setFormOpen(false);
    setSaveError(null);
    setForm(emptyEncounterForm());
  };

  return (
    <div className="space-y-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Encounters
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Flow is physician assessment first, then nursing vitals, then site and
            time — easy to reorder later without changing the chart.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={disabled}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-50"
        >
          Add encounter
        </button>
      </div>

      {loadError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {loadError}
        </p>
      )}
      {loading && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading encounters…</p>
      )}
      {!loading && visits.length === 0 && !loadError && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No encounters yet for this patient.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visits.map((v) => (
          <li
            key={v.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900/80"
          >
            <p className="font-medium text-zinc-800 dark:text-zinc-100">
              {new Date(v.visitDate).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {v.locationName ? ` · ${v.locationName}` : ""}
            </p>
            {v.chiefComplaint && (
              <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">CC: </span>
                {v.chiefComplaint}
              </p>
            )}
            {v.diagnosisText && (
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">Dx: </span>
                {v.diagnosisText}
              </p>
            )}
            {v.referralNotes && (
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">Plan: </span>
                {v.referralNotes}
              </p>
            )}
            {v.vitals && (
              <p className="mt-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {[
                  v.vitals.bp != null ? `BP ${v.vitals.bp}` : null,
                  v.vitals.pulse != null ? `P ${v.vitals.pulse}` : null,
                  v.vitals.resp != null ? `R ${v.vitals.resp}` : null,
                  v.vitals.tempF != null ? `${v.vitals.tempF}°F` : null,
                  v.vitals.oxygenSat != null ? `SpO₂ ${v.vitals.oxygenSat}%` : null,
                  v.vitals.weight != null ? `Wt ${v.vitals.weight}` : null,
                  v.vitals.height != null ? `Ht ${v.vitals.height}` : null,
                  v.vitals.glucose != null ? `Glu ${v.vitals.glucose}` : null,
                  v.vitals.hemoglobin != null ? `Hgb ${v.vitals.hemoglobin}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Vitals recorded"}
              </p>
            )}
          </li>
        ))}
      </ul>

      {formOpen ? (
        <>
          <button
            type="button"
            aria-label="Close add encounter panel"
            className="fixed inset-0 z-40 bg-zinc-900/20"
            onClick={closeForm}
          />
          <div
            role="dialog"
            aria-labelledby="add-encounter-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full min-w-[20rem] max-w-3xl flex-col border-l border-zinc-200 bg-white shadow-xl sm:min-w-[40rem]"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h4
                id="add-encounter-title"
                className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
              >
                Add encounter
              </h4>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="grid gap-6 lg:grid-cols-3">
                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                    1 · Physician
                  </p>
                  <div>
                    <label
                      htmlFor="enc-cc"
                      className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      Chief complaint
                    </label>
                    <textarea
                      id="enc-cc"
                      value={form.chiefComplaint}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, chiefComplaint: e.target.value }))
                      }
                      rows={3}
                      className={`${inputCls} resize-y font-sans text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="enc-dx"
                      className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      Assessment / diagnosis
                    </label>
                    <textarea
                      id="enc-dx"
                      value={form.diagnosisText}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, diagnosisText: e.target.value }))
                      }
                      rows={3}
                      className={`${inputCls} resize-y font-sans text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="enc-plan"
                      className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      Plan &amp; referral
                    </label>
                    <textarea
                      id="enc-plan"
                      value={form.referralNotes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, referralNotes: e.target.value }))
                      }
                      rows={3}
                      className={`${inputCls} resize-y font-sans text-sm`}
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                    2 · Nursing — vitals
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <label htmlFor="enc-bp" className="text-xs text-zinc-500 dark:text-zinc-400">
                        BP
                      </label>
                      <input
                        id="enc-bp"
                        value={form.bp}
                        onChange={(e) => setForm((f) => ({ ...f, bp: e.target.value }))}
                        placeholder="120/80"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-pulse" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Pulse
                      </label>
                      <input
                        id="enc-pulse"
                        inputMode="numeric"
                        value={form.pulse}
                        onChange={(e) => setForm((f) => ({ ...f, pulse: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-resp" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Resp
                      </label>
                      <input
                        id="enc-resp"
                        inputMode="numeric"
                        value={form.resp}
                        onChange={(e) => setForm((f) => ({ ...f, resp: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-temp" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Temp °F
                      </label>
                      <input
                        id="enc-temp"
                        inputMode="decimal"
                        value={form.tempF}
                        onChange={(e) => setForm((f) => ({ ...f, tempF: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-spo2" className="text-xs text-zinc-500 dark:text-zinc-400">
                        SpO₂ %
                      </label>
                      <input
                        id="enc-spo2"
                        inputMode="numeric"
                        value={form.oxygenSat}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, oxygenSat: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-wt" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Weight
                      </label>
                      <input
                        id="enc-wt"
                        inputMode="decimal"
                        value={form.weight}
                        onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-ht" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Height
                      </label>
                      <input
                        id="enc-ht"
                        inputMode="decimal"
                        value={form.height}
                        onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-glu" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Glucose
                      </label>
                      <input
                        id="enc-glu"
                        inputMode="decimal"
                        value={form.glucose}
                        onChange={(e) => setForm((f) => ({ ...f, glucose: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="enc-hgb" className="text-xs text-zinc-500 dark:text-zinc-400">
                        Hemoglobin
                      </label>
                      <input
                        id="enc-hgb"
                        inputMode="decimal"
                        value={form.hemoglobin}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, hemoglobin: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                    3 · Site &amp; time (staff)
                  </p>
                  <div>
                    <label htmlFor="enc-loc" className="text-xs text-zinc-500 dark:text-zinc-400">
                      Location / site
                    </label>
                    <input
                      id="enc-loc"
                      value={form.locationName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, locationName: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="enc-when" className="text-xs text-zinc-500 dark:text-zinc-400">
                      Encounter time
                    </label>
                    <input
                      id="enc-when"
                      type="datetime-local"
                      value={form.visitAtLocal}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, visitAtLocal: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </section>
              </div>

              {saveError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {saveError}
                </p>
              )}
            </div>

            <div className="border-t border-zinc-200 px-5 py-4">
              <button
                type="button"
                disabled={saving || !online}
                onClick={() => void submitEncounter()}
                className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Saving encounter…" : "Save encounter"}
              </button>
            </div>
          </div>
        </>
      ) : null}
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
    <div>
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
    </div>
  );
}

