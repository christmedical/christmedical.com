"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DEMO_PATIENT } from "@/lib/emrDemoPatient";

export function StatGrid({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="text-2xl font-semibold text-teal-800 dark:text-teal-300">
            {item.value}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
    >
      <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-800 dark:border-zinc-800 dark:text-zinc-100">
        {icon ? <span className="mr-1.5">{icon}</span> : null}
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PatientBanner({
  showNewEncounter,
}: {
  showNewEncounter?: boolean;
}) {
  const p = DEMO_PATIENT;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-900 dark:bg-teal-950 dark:text-teal-100">
        {p.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</div>
        <div className="text-xs text-zinc-500">
          {p.ageGender} · DOB {p.dob} · {p.community}
        </div>
      </div>
      {showNewEncounter ? (
        <Link
          href="/encounter"
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
        >
          New encounter
        </Link>
      ) : (
        <Link
          href="/history"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
    <div className="space-y-4">
      <StatGrid
        items={[
          { value: "14", label: "Waiting" },
          { value: "2", label: "Urgent" },
          { value: "31", label: "Seen today" },
          { value: "5", label: "Providers on" },
        ]}
      />
      <Card title="Active queue — tap to open chart" icon="📋">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {queue.map((row) => (
            <li key={row.initials} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold dark:bg-zinc-800">
                {row.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{row.name}</div>
                <div className="text-xs text-zinc-500">{row.sub}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.statusClass}`}>
                {row.status}
              </span>
              <Link
                href="/encounter"
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
              >
                Open →
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Link
        href="/check-in"
        className="block w-full rounded-xl border border-dashed border-teal-300 py-3 text-center text-sm font-medium text-teal-800 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-200 dark:hover:bg-teal-950/30"
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
        <Card title="Find existing patient" icon="🔍">
          <Link
            href="/search"
            className="block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 hover:border-teal-400 dark:border-zinc-700 dark:bg-zinc-800"
          >
            Search by name, DOB, or patient ID…
          </Link>
          <p className="mt-3 text-center text-xs text-zinc-400">— or register new patient below —</p>
        </Card>
        <Card title="New patient registration" icon="➕">
          <div className="grid gap-2 sm:grid-cols-2">
            {["First name", "Last name", "Date of birth", "Sex at birth"].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {label}
              </div>
            ))}
          </div>
          {["Village / community", "Primary language", "Interpreter needed?", "Emergency contact"].map(
            (label) => (
              <div
                key={label}
                className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {label}
              </div>
            ),
          )}
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Triage & vitals" icon="🩺">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["98.6°F", "Temperature"],
              ["120/80", "Blood pressure"],
              ["72 bpm", "Heart rate"],
              ["98%", "O2 saturation"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-800">
                <div className="text-sm font-semibold">{v}</div>
                <div className="text-[10px] text-zinc-500">{l}</div>
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
          <div className="mt-3 text-xs font-medium text-zinc-600">Chief complaint</div>
          <div className="mt-1 min-h-[4rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
            Describe reason for visit…
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button type="button" className="rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-800">
              Urgent
            </button>
            <button type="button" className="rounded-lg bg-teal-600 py-2 text-xs font-medium text-white">
              Routine
            </button>
            <button type="button" className="rounded-lg border border-amber-200 bg-amber-50 py-2 text-xs font-medium text-amber-900">
              Monitor
            </button>
          </div>
        </Card>
        <Link
          href="/queue"
          className="block w-full rounded-xl bg-teal-600 py-3 text-center text-sm font-medium text-white hover:bg-teal-700"
        >
          Add to queue →
        </Link>
      </div>
    </div>
  );
}

export function EncounterScreen() {
  return (
    <div className="space-y-4">
      <PatientBanner />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="SOAP note" icon="📝">
          {[
            { key: "S", label: "Subjective", className: "border-l-4 border-sky-400 bg-sky-50/50 dark:bg-sky-950/20" },
            { key: "O", label: "Objective", className: "border-l-4 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20", text: "BP 120/80 · HR 72 · Temp 98.6°F · O2 98% · Wt 145 lbs" },
            { key: "A", label: "Assessment / Diagnosis", className: "border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20" },
            { key: "P", label: "Plan", className: "border-l-4 border-violet-400 bg-violet-50/50 dark:bg-violet-950/20" },
            { key: "✝", label: "Prayer note (optional)", className: "border-l-4 border-rose-400 bg-rose-50/50 dark:bg-rose-950/20" },
          ].map((section) => (
            <div key={section.key} className={`mb-3 rounded-lg p-3 ${section.className}`}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                {section.key} — {section.label}
              </div>
              {section.text ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-300">{section.text}</p>
              ) : section.key === "A" ? (
                <>
                  <div className="mb-2 rounded border border-amber-200 bg-white/60 px-2 py-1.5 text-xs text-amber-800">
                    Search ICD-10 code or description…
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">
                    E11.9 — Type 2 diabetes mellitus without complications
                  </div>
                </>
              ) : (
                <div className="h-8 rounded bg-white/50 dark:bg-zinc-900/30" />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-lg border border-zinc-300 py-2 text-xs font-medium">
              Save draft
            </button>
            <Link
              href="/discharge"
              className="flex-1 rounded-lg bg-teal-600 py-2 text-center text-xs font-medium text-white hover:bg-teal-700"
            >
              Sign & close →
            </Link>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Vitals" icon="📈">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["120/80", "Blood pressure"],
                ["98.6°F", "Temperature"],
                ["72 bpm", "Heart rate"],
                ["145 lbs", "Weight"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-800">
                  <div className="text-sm font-semibold">{v}</div>
                  <div className="text-[10px] text-zinc-500">{l}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Allergies on file" icon="⚠️">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              Penicillin — hives (severe)
            </p>
          </Card>
          <Card title="Quick actions" icon="⚡">
            <div className="space-y-2">
              <Link href="/medications" className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Prescribe medication →
              </Link>
              <Link href="/labs" className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Order labs →
              </Link>
              <Link href="/spiritual" className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Log spiritual care →
              </Link>
            </div>
          </Card>
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
        <Card title="Visit history" icon="🕐">
          {[
            ["May 8, 2026", "Type 2 diabetes — follow-up", "HbA1c elevated · Metformin adjusted · Prayer offered", true],
            ["Jan 14, 2026", "Hypertension — routine check", "BP well controlled · Lisinopril continued", false],
            ["Sep 3, 2025", "URI — acute", "Amoxicillin 500mg × 7 days · resolved", false],
          ].map(([date, dx, note, prayer]) => (
            <div key={String(date)} className="mb-3 flex gap-3 border-b border-zinc-100 pb-3 last:mb-0 last:border-0 dark:border-zinc-800">
              <div className="w-20 shrink-0 text-xs font-medium text-zinc-500">{date}</div>
              <div>
                <div className="text-sm font-medium">{dx}</div>
                <div className="text-xs text-zinc-500">{note}</div>
                {prayer ? (
                  <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[10px] text-teal-900">
                    Prayer logged
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
        <div className="space-y-4">
          <Card title="Chronic conditions" icon="🧬">
            <div className="flex flex-wrap gap-2">
              {["E11.9 Type 2 diabetes", "I10 Hypertension", "E78.5 Hyperlipidemia"].map((c) => (
                <span key={c} className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                  {c}
                </span>
              ))}
            </div>
          </Card>
          <Card title="Current medications" icon="💊">
            {["Metformin 500mg — 2× daily", "Lisinopril 10mg — 1× daily", "Atorvastatin 20mg — evening"].map(
              (m) => (
                <div key={m} className="border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800">
                  {m}
                </div>
              ),
            )}
          </Card>
          <Card title="Cumulative spiritual record" icon="🤍">
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
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MedicationsScreen() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Card title={`Active medications — ${DEMO_PATIENT.name}`} icon="💊">
          {["Metformin 500mg", "Lisinopril 10mg", "Atorvastatin 20mg"].map((med) => (
            <div key={med} className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800">
              <div>
                <div className="text-sm font-medium">{med}</div>
                <div className="text-xs text-zinc-500">ongoing</div>
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
        </Card>
        <Card title="Allergies on file" icon="⚠️">
          <p className="text-sm text-red-800">Penicillin — hives (severe)</p>
        </Card>
      </div>
      <Card title="Prescribe new" icon="📄">
        {["Search formulary…", "Dose & unit", "Frequency", "Duration", "Quantity"].map((f) => (
          <div
            key={f}
            className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {f}
          </div>
        ))}
        <div className="mb-3 min-h-[4rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
          Provider notes / patient instructions…
        </div>
        <button type="button" className="w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-white">
          Save prescription →
        </button>
      </Card>
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
      <Card title={`Order tests — ${DEMO_PATIENT.name}`} icon="📋">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Common panels
        </p>
        {panels.map((p, i) => (
          <label key={p} className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked={i < 3} readOnly className="rounded" />
            {p}
          </label>
        ))}
        <button type="button" className="mt-3 w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-white">
          Submit orders →
        </button>
      </Card>
      <div className="space-y-4">
        <Card title="Previous results" icon="📊">
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
        </Card>
        <Card title="Procedures performed today" icon="🔧">
          <div className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700">
            Procedure name or CPT code…
          </div>
        </Card>
      </div>
    </div>
  );
}

export function SpiritualScreen() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm italic text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100">
        &ldquo;Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I
        praise.&rdquo; — Jeremiah 17:14
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Spiritual care — ${DEMO_PATIENT.name}`} icon="🤍">
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
        </Card>
        <div className="space-y-4">
          <Card title="Prayer request & notes" icon="✏️">
            <div className="min-h-[5rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
              Record the patient&apos;s prayer request…
            </div>
          </Card>
          <Link
            href="/encounter"
            className="block w-full rounded-xl bg-teal-600 py-3 text-center text-sm font-medium text-white hover:bg-teal-700"
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
        <Card title={`Encounter summary — ${DEMO_PATIENT.name}`} icon="✅">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Primary diagnosis</dt>
              <dd>E11.9 — Type 2 diabetes mellitus without complications</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Prescribed today</dt>
              <dd>Metformin 500mg · 2× daily · adjusted dose</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Labs ordered</dt>
              <dd>HbA1c · Fasting glucose · CBC</dd>
            </div>
          </dl>
        </Card>
        <Card title="Follow-up plan" icon="📅">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked readOnly className="rounded" />
            Schedule return visit
          </label>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Patient instructions" icon="📄">
          <div className="min-h-[4rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
            Write plain-language instructions for the patient…
          </div>
        </Card>
        <Card title="Spiritual care at discharge" icon="🤍">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked readOnly className="rounded" />
            Closing prayer offered
          </label>
        </Card>
        <div className="flex gap-2">
          <button type="button" className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium">
            Print summary
          </button>
          <Link
            href="/queue"
            className="flex-1 rounded-lg bg-teal-600 py-2 text-center text-sm font-medium text-white hover:bg-teal-700"
          >
            Discharge patient ✓
          </Link>
        </div>
      </div>
    </div>
  );
}
