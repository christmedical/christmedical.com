"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,
  Heart,
  History,
  ListOrdered,
  Pill,
  Search,
  UserPlus,
  Wrench,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmrCard, EMR_PAGE_STACK, EMR_SURFACE } from "@/components/emr/EmrCard";
import { DEMO_PATIENT } from "@/lib/emrDemoPatient";

const DEMO_ENCOUNTER_KEY = "cm-demo-encounter-draft";

export function StatGrid({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`${EMR_SURFACE} p-4`}>
          <div className="text-2xl font-semibold text-fc-accent">{item.value}</div>
          <div className="mt-1 text-xs text-fc-ink-subtle">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use EmrCard */
export const Card = EmrCard;

export function PatientBanner({
  showNewEncounter,
}: {
  showNewEncounter?: boolean;
}) {
  const p = DEMO_PATIENT;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fc-accent-tint text-sm font-semibold text-fc-ink text-fc-ink text-fc-ink">
        {p.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-fc-ink text-fc-ink">{p.name}</div>
        <div className="text-xs text-fc-ink-subtle">
          {p.ageGender} · DOB {p.dob} · {p.community}
        </div>
      </div>
      {showNewEncounter ? (
        <Link
          href="/encounter"
          className="rounded-lg bg-fc-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-fc-accent-strong"
        >
          New encounter
        </Link>
      ) : (
        <Link
          href="/history"
          className="rounded-lg border border-fc-border-strong px-3 py-1.5 text-xs font-medium text-fc-ink-muted hover:bg-zinc-50 border-fc-border text-fc-ink hover:bg-fc-accent-tint"
        >
          View full history
        </Link>
      )}
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
        In encounter
      </span>
    </div>
  );
}

export function QueueScreen() {
  const queue = useMemo(
    () => [
      { initials: "JC", name: "Jose Cortez, 58M", sub: "Chest pain · 6 min ago", status: "Urgent", statusClass: "bg-red-100 text-red-800" },
      { initials: "MR", name: "Maria Ramirez, 42F", sub: "Headache · 14 min ago", status: "Waiting", statusClass: "bg-amber-100 text-amber-900" },
      { initials: "AL", name: "Ana Lopez, 29F", sub: "Follow-up · 22 min ago", status: "In room", statusClass: "bg-emerald-100 text-emerald-900" },
      { initials: "PT", name: "Pedro Torres, 34M", sub: "Wound care · 38 min ago", status: "Waiting", statusClass: "bg-amber-100 text-amber-900" },
    ],
    [],
  );

  return (
    <div className={EMR_PAGE_STACK}>
      <StatGrid
        items={[
          { value: "14", label: "Waiting" },
          { value: "2", label: "Urgent" },
          { value: "31", label: "Seen today" },
          { value: "5", label: "Providers on" },
        ]}
      />
      <EmrCard title="Active queue — tap to open chart" icon={ListOrdered}>
        <ul className="divide-y divide-fc-border ">
          {queue.map((row) => (
            <li key={row.initials} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fc-status-none-bg text-xs font-semibold ">
                {row.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{row.name}</div>
                <div className="text-xs text-fc-ink-subtle">{row.sub}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.statusClass}`}>
                {row.status}
              </span>
              <Link
                href="/patients"
                className="rounded-lg bg-fc-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-fc-accent-strong"
              >
                Open →
              </Link>
            </li>
          ))}
        </ul>
      </EmrCard>
      <Link
        href="/check-in"
        className="block w-full rounded-xl border border-dashed border-fc-border-strong py-3 text-center text-sm font-medium text-fc-accent hover:hover:bg-fc-accent-tint dark:border-fc-border-strong dark:text-fc-accent-glow dark:hover:bg-fc-accent-tint"
      >
        + Check in new patient
      </Link>
      <p className="rounded-lg bg-ancient-vellum/80 px-3 py-2 text-xs text-bronze-deep dark:bg-bronze-deep/20 dark:text-ancient-vellum">
        <strong>UX note:</strong> Queue auto-refreshes every 30s. Urgent patients float to top. Open
        links to encounter; use{" "}
        <Link href="/patients" className="underline">
          patient list
        </Link>{" "}
        for full roster.
      </p>
    </div>
  );
}

export function CheckInScreen() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <EmrCard title="Find existing patient" icon={Search}>
          <Link
            href="/patients"
            className="block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-fc-ink-subtle hover:border-teal-400"
          >
            Search by name, DOB, or patient ID…
          </Link>
          <p className="mt-3 text-center text-xs text-zinc-400">— or register new patient below —</p>
        </EmrCard>
        <EmrCard title="New patient registration" icon={UserPlus}>
          <div className="grid gap-2 sm:grid-cols-2">
            {["First name", "Last name", "Date of birth", "Sex at birth"].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 "
              >
                {label}
              </div>
            ))}
          </div>
          {["Village / community", "Primary language", "Interpreter needed?", "Emergency contact"].map(
            (label) => (
              <div
                key={label}
                className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 "
              >
                {label}
              </div>
            ),
          )}
        </EmrCard>
      </div>
      <div className="space-y-4">
        <EmrCard title="Triage & vitals" icon={Activity}>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["98.6°F", "Temperature"],
              ["120/80", "Blood pressure"],
              ["72 bpm", "Heart rate"],
              ["98%", "O2 saturation"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-zinc-50 p-2 text-center ">
                <div className="text-sm font-semibold">{v}</div>
                <div className="text-[10px] text-fc-ink-subtle">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700">
              Weight (lbs)
            </div>
            <div className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700">
              Height
            </div>
          </div>
          <div className="mt-3 text-xs font-medium text-fc-ink-muted">Chief complaint</div>
          <div className="mt-1 min-h-[4rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 ">
            Describe reason for visit…
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button type="button" className="rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-800">
              Urgent
            </button>
            <button type="button" className="rounded-lg bg-fc-accent py-2 text-xs font-medium text-white">
              Routine
            </button>
            <button type="button" className="rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-medium text-amber-900">
              Monitor
            </button>
          </div>
        </EmrCard>
        <Link
          href="/queue"
          className="block w-full rounded-xl bg-fc-accent py-3 text-center text-sm font-medium text-white hover:bg-fc-accent-strong"
        >
          Add to queue →
        </Link>
      </div>
    </div>
  );
}

export function EncounterScreen() {
  const [subjective, setSubjective] = useState("");
  const [plan, setPlan] = useState("");
  const [prayerNote, setPrayerNote] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEMO_ENCOUNTER_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        subjective?: string;
        plan?: string;
        prayerNote?: string;
      };
      setSubjective(data.subjective ?? "");
      setPlan(data.plan ?? "");
      setPrayerNote(data.prayerNote ?? "");
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  const saveDraft = useCallback(() => {
    const payload = { subjective, plan, prayerNote };
    localStorage.setItem(DEMO_ENCOUNTER_KEY, JSON.stringify(payload));
    setSavedAt(new Date().toLocaleTimeString());
  }, [plan, prayerNote, subjective]);

  const soapField =
    "mt-1 w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-fc-ink";

  return (
    <div className={EMR_PAGE_STACK}>
      <PatientBanner />
      <p className="text-sm text-fc-ink-muted">
        Demo workflow screen. To save encounters to Postgres, open the patient in{" "}
        <Link href="/patients" className="font-medium text-fc-accent underline">
          Patients
        </Link>{" "}
        and use <strong>Save encounter</strong> on the chart.
      </p>
      <div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
        <EmrCard title="SOAP note" icon={ClipboardList}>
          <div className="mb-3 rounded-lg border-l-4 border-sky-400 bg-sky-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-fc-ink-muted">S — Subjective</div>
            <textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              rows={3}
              className={soapField}
              placeholder="Patient reports…"
            />
          </div>
          <div className="mb-3 rounded-lg border-l-4 border-emerald-400 bg-emerald-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-fc-ink-muted">O — Objective</div>
            <p className="text-sm text-fc-ink-muted">
              BP 120/80 · HR 72 · Temp 98.6°F · O2 98% · Wt 145 lbs
            </p>
          </div>
          <div className="mb-3 rounded-lg border-l-4 border-amber-400 bg-amber-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-fc-ink-muted">
              A — Assessment / Diagnosis
            </div>
            <div className="mb-2 rounded border border-amber-200 bg-white/60 px-2 py-1.5 text-xs text-amber-800">
              Search ICD-10 code or description…
            </div>
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">
              E11.9 — Type 2 diabetes mellitus without complications
            </span>
          </div>
          <div className="mb-3 rounded-lg border-l-4 border-violet-400 bg-violet-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-fc-ink-muted">P — Plan</div>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={3}
              className={soapField}
              placeholder="Treatment plan…"
            />
          </div>
          <div className="mb-3 rounded-lg border-l-4 border-rose-400 bg-rose-50/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-fc-ink-muted">
              Prayer note (optional)
            </div>
            <textarea
              value={prayerNote}
              onChange={(e) => setPrayerNote(e.target.value)}
              rows={2}
              className={soapField}
              placeholder="Spiritual care notes…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="flex-1 rounded-lg border border-fc-border-strong py-2 text-xs font-medium hover:bg-zinc-50"
            >
              Save draft
            </button>
            <Link
              href="/discharge"
              className="flex-1 rounded-lg bg-fc-accent py-2 text-center text-xs font-medium text-white hover:bg-fc-accent-strong"
            >
              Sign & close →
            </Link>
          </div>
          {savedAt ? (
            <p className="mt-2 text-xs text-fc-accent">Draft saved locally at {savedAt}.</p>
          ) : null}
        </EmrCard>
        <div className="space-y-4">
          <EmrCard title="Vitals" icon={Activity}>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["120/80", "Blood pressure"],
                ["98.6°F", "Temperature"],
                ["72 bpm", "Heart rate"],
                ["145 lbs", "Weight"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-lg bg-zinc-50 p-2 text-center ">
                  <div className="text-sm font-semibold">{v}</div>
                  <div className="text-[10px] text-fc-ink-subtle">{l}</div>
                </div>
              ))}
            </div>
          </EmrCard>
          <EmrCard title="Allergies on file" icon={AlertTriangle}>
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              Penicillin — hives (severe)
            </p>
          </EmrCard>
          <EmrCard title="Quick actions" icon={Zap}>
            <div className="space-y-2">
              <Link href="/medications" className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 hover:bg-fc-accent-tint">
                Prescribe medication →
              </Link>
              <Link href="/labs" className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 hover:bg-fc-accent-tint">
                Order labs →
              </Link>
              <Link href="/spiritual" className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 hover:bg-fc-accent-tint">
                Log spiritual care →
              </Link>
            </div>
          </EmrCard>
        </div>
      </div>
    </div>
  );
}

export function HistoryScreen() {
  return (
    <div className="space-y-4">
      <PatientBanner showNewEncounter />
      <div className="grid gap-4 lg:grid-cols-2">
        <EmrCard title="Visit history" icon={History}>
          {[
            ["May 8, 2026", "Type 2 diabetes — follow-up", "HbA1c elevated · Metformin adjusted · Prayer offered", true],
            ["Jan 14, 2026", "Hypertension — routine check", "BP well controlled · Lisinopril continued", false],
            ["Sep 3, 2025", "URI — acute", "Amoxicillin 500mg × 7 days · resolved", false],
          ].map(([date, dx, note, prayer]) => (
            <div key={String(date)} className="mb-3 flex gap-3 border-b border-zinc-100 pb-3 last:mb-0 last:border-0 dark:border-zinc-800">
              <div className="w-20 shrink-0 text-xs font-medium text-fc-ink-subtle">{date}</div>
              <div>
                <div className="text-sm font-medium">{dx}</div>
                <div className="text-xs text-fc-ink-subtle">{note}</div>
                {prayer ? (
                  <span className="mt-1 inline-block rounded-full bg-fc-accent-tint px-2 py-0.5 text-[10px] text-fc-ink">
                    Prayer logged
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </EmrCard>
        <div className="space-y-4">
          <EmrCard title="Chronic conditions" icon={FileText}>
            <div className="flex flex-wrap gap-2">
              {["E11.9 Type 2 diabetes", "I10 Hypertension", "E78.5 Hyperlipidemia"].map((c) => (
                <span key={c} className="rounded-full bg-fc-status-none-bg px-2 py-1 text-xs ">
                  {c}
                </span>
              ))}
            </div>
          </EmrCard>
          <EmrCard title="Current medications" icon={Pill}>
            {["Metformin 500mg — 2× daily", "Lisinopril 10mg — 1× daily", "Atorvastatin 20mg — evening"].map(
              (m) => (
                <div key={m} className="border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800">
                  {m}
                </div>
              ),
            )}
          </EmrCard>
          <EmrCard title="Cumulative spiritual record" icon={Heart}>
            {[
              [true, "Has received prayer — 3 visits"],
              [true, "Gospel shared — Jan 2026"],
              [false, "Referred to local pastor"],
            ].map(([on, label]) => (
              <label key={String(label)} className="mb-2 flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={Boolean(on)} readOnly className="rounded" />
                {label}
              </label>
            ))}
          </EmrCard>
        </div>
      </div>
    </div>
  );
}

export function MedicationsScreen() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <EmrCard title={`Active medications — ${DEMO_PATIENT.name}`} icon={Pill}>
          {["Metformin 500mg", "Lisinopril 10mg", "Atorvastatin 20mg"].map((med) => (
            <div key={med} className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800">
              <div>
                <div className="text-sm font-medium">{med}</div>
                <div className="text-xs text-fc-ink-subtle">ongoing</div>
              </div>
              <div className="flex gap-1">
                <button type="button" className="rounded border px-2 py-1 text-xs">
                  Edit
                </button>
                <button type="button" className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">
                  D/C
                </button>
              </div>
            </div>
          ))}
        </EmrCard>
        <EmrCard title="Allergies on file" icon={AlertTriangle}>
          <p className="text-sm text-red-800">Penicillin — hives (severe)</p>
        </EmrCard>
      </div>
      <EmrCard title="Prescribe new" icon={FileText}>
        {["Search formulary…", "Dose & unit", "Frequency", "Duration", "Quantity"].map((f) => (
          <div
            key={f}
            className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 "
          >
            {f}
          </div>
        ))}
        <div className="mb-3 min-h-[4rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 ">
          Provider notes / patient instructions…
        </div>
        <button type="button" className="w-full rounded-lg bg-fc-accent py-2 text-sm font-medium text-white">
          Save prescription →
        </button>
      </EmrCard>
    </div>
  );
}

export function LabsScreen() {
  const panels = [
    "Blood glucose (fasting)",
    "HbA1c",
    "CBC with differential",
    "Comprehensive metabolic panel",
    "Urinalysis",
    "Malaria RDT",
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <EmrCard title={`Order tests — ${DEMO_PATIENT.name}`} icon={FlaskConical}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Common panels
        </p>
        {panels.map((p, i) => (
          <label key={p} className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked={i < 3} readOnly className="rounded" />
            {p}
          </label>
        ))}
        <button type="button" className="mt-3 w-full rounded-lg bg-fc-accent py-2 text-sm font-medium text-white">
          Submit orders →
        </button>
      </EmrCard>
      <div className="space-y-4">
        <EmrCard title="Previous results" icon={BarChart3}>
          {[
            ["HbA1c", "7.9%", "high"],
            ["Fasting glucose", "142 mg/dL", "mid"],
            ["Hemoglobin", "13.8 g/dL", "ok"],
          ].map(([name, val, kind]) => (
            <div key={String(name)} className="flex justify-between border-b border-zinc-100 py-2 text-sm dark:border-zinc-800">
              <span>{name}</span>
              <span
                className={
                  kind === "high"
                    ? "font-semibold text-red-600"
                    : kind === "mid"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }
              >
                {val}
              </span>
            </div>
          ))}
        </EmrCard>
        <EmrCard title="Procedures performed today" icon={Wrench}>
          <div className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700">
            Procedure name or CPT code…
          </div>
        </EmrCard>
      </div>
    </div>
  );
}

export function SpiritualScreen() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-200 hover:bg-fc-accent-tint/80 px-4 py-3 text-sm italic text-fc-ink dark:border-teal-800 text-fc-ink/40 text-fc-ink">
        &ldquo;Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I
        praise.&rdquo; — Jeremiah 17:14
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <EmrCard title={`Spiritual care — ${DEMO_PATIENT.name}`} icon={Heart}>
          {[
            "Patient requested prayer",
            "Prayer offered by provider",
            "Gospel shared / spiritual conversation",
            "Referred to local church or pastor",
          ].map((item, i) => (
            <label key={item} className="mb-2 flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={i < 2} readOnly className="rounded" />
              {item}
            </label>
          ))}
        </EmrCard>
        <div className="space-y-4">
          <EmrCard title="Prayer request & notes" icon={FileText}>
            <div className="min-h-[5rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 ">
              Record the patient&apos;s prayer request…
            </div>
          </EmrCard>
          <Link
            href="/encounter"
            className="block w-full rounded-xl bg-fc-accent py-3 text-center text-sm font-medium text-white hover:bg-fc-accent-strong"
          >
            Save & return to chart →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DischargeScreen() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <EmrCard title={`Encounter summary — ${DEMO_PATIENT.name}`} icon={CheckCircle2}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-fc-ink-subtle">Primary diagnosis</dt>
              <dd>E11.9 — Type 2 diabetes mellitus without complications</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-fc-ink-subtle">Prescribed today</dt>
              <dd>Metformin 500mg · 2× daily · adjusted dose</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-fc-ink-subtle">Labs ordered</dt>
              <dd>HbA1c · Fasting glucose · CBC</dd>
            </div>
          </dl>
        </EmrCard>
        <EmrCard title="Follow-up plan" icon={Calendar}>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked readOnly className="rounded" />
            Schedule return visit
          </label>
        </EmrCard>
      </div>
      <div className="space-y-4">
        <EmrCard title="Patient instructions" icon={FileText}>
          <div className="min-h-[4rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 ">
            Write plain-language instructions for the patient…
          </div>
        </EmrCard>
        <EmrCard title="Spiritual care at discharge" icon={Heart}>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked readOnly className="rounded" />
            Closing prayer offered
          </label>
        </EmrCard>
        <div className="flex gap-2">
          <button type="button" className="flex-1 rounded-lg border border-fc-border-strong py-2 text-sm font-medium">
            Print summary
          </button>
          <Link
            href="/queue"
            className="flex-1 rounded-lg bg-fc-accent py-2 text-center text-sm font-medium text-white hover:bg-fc-accent-strong"
          >
            Discharge patient ✓
          </Link>
        </div>
      </div>
    </div>
  );
}
