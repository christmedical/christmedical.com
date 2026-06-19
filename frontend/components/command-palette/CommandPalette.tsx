"use client";

import { ArrowDown, ArrowUp, CornerDownLeft, Radio, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCommandPalette } from "@/components/command-palette/CommandPaletteContext";
import { FC_MUTED_NOTE } from "@/components/design/fieldClinical";
import type { SpiritualFilter } from "@/lib/patientFilter";
import type { PatientSearchRecord } from "@/lib/patientSearchMatch";
import {
  formatPaletteMetaLine,
  patientInitials,
} from "@/lib/patientPaletteFormat";
import { rememberRecentPatient } from "@/lib/recentPatients";
import { spiritualStatusBadgeClass } from "@/lib/spiritualBadge";
import { usePatientPaletteSearch } from "@/lib/usePatientPaletteSearch";

const PALETTE_SCOPES: ReadonlyArray<{
  value: SpiritualFilter;
  label: string;
  spiritualDot: boolean;
}> = [
  { value: "all", label: "All", spiritualDot: false },
  { value: "heard", label: "Heard gospel", spiritualDot: true },
  { value: "hope", label: "Hope / interest", spiritualDot: true },
  { value: "none", label: "No record", spiritualDot: false },
];

function SpiritualStatusBadge({ patient }: { patient: PatientSearchRecord }) {
  if (patient.spiritualStatusKind === "hope") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-fc-status-hope-ink">
        <span
          className="h-1.5 w-1.5 rounded-full bg-fc-accent"
          aria-hidden
        />
        {patient.spiritualStatusLabel}
      </span>
    );
  }

  if (patient.spiritualStatusKind === "heard") {
    return (
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${spiritualStatusBadgeClass("heard")}`}
      >
        Heard
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${spiritualStatusBadgeClass("none")}`}
    >
      {patient.spiritualStatusLabel}
    </span>
  );
}

function ScopeChip({
  label,
  active,
  spiritualDot,
  onClick,
}: {
  label: string;
  active: boolean;
  spiritualDot: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-fc-accent px-3.5 py-1.5 text-sm font-medium text-fc-paper shadow-sm"
          : "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-fc-border-strong bg-fc-surface px-3.5 py-1.5 text-sm font-medium text-fc-ink transition-colors hover:bg-fc-accent-tint"
      }
    >
      {spiritualDot && !active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-fc-accent" aria-hidden />
      ) : null}
      {spiritualDot && active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-fc-paper/90" aria-hidden />
      ) : null}
      {label}
    </button>
  );
}

function ResultRow({
  patient,
  active,
  onHover,
  onOpen,
}: {
  patient: PatientSearchRecord;
  active: boolean;
  onHover: () => void;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onMouseEnter={onHover}
        onClick={onOpen}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
          active
            ? "border-l-2 border-l-fc-accent bg-fc-accent-tint pl-[calc(0.75rem-2px)]"
            : "border-l-2 border-l-transparent bg-fc-surface hover:bg-fc-accent-tint/50"
        }`}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fc-paper font-display text-sm font-semibold text-fc-ink-muted"
          aria-hidden
        >
          {patientInitials(patient.displayName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-semibold text-fc-ink">
            {patient.displayName}
          </span>
          <span className="mt-0.5 block truncate font-mono text-xs text-fc-ink-muted">
            {formatPaletteMetaLine(patient, patient.community ?? null)}
          </span>
        </span>
        <SpiritualStatusBadge patient={patient} />
      </button>
    </li>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, closePalette } = useCommandPalette();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const {
    q,
    setQ,
    spiritual,
    setSpiritual,
    rows,
    busy,
    searchActive,
    showNoMatch,
    online,
    reset,
  } = usePatientPaletteSearch(isOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen, reset]);

  useEffect(() => {
    setActiveIndex(0);
  }, [q, spiritual, rows.length]);

  const openPatient = useCallback(
    (patient: PatientSearchRecord) => {
      rememberRecentPatient(patient);
      closePalette();
      router.push(`/patients/${patient.id}`);
    },
    [closePalette, router],
  );

  const selectableCount = showNoMatch ? 0 : rows.length;

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
        return;
      }
      if (selectableCount === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % selectableCount);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + selectableCount) % selectableCount);
      }
      if (e.key === "Enter" && rows[activeIndex]) {
        e.preventDefault();
        openPatient(rows[activeIndex]!);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, closePalette, isOpen, openPatient, rows, selectableCount]);

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close search"
        className="fixed inset-0 z-[60] bg-fc-ink/35 backdrop-blur-[2px]"
        onClick={closePalette}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search patients"
        className="pointer-events-none fixed inset-0 z-[61] flex items-start justify-center px-4 pt-[10vh] sm:pt-[12vh]"
      >
        <div className="animate-fc-palette-in pointer-events-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-fc-accent/25 bg-fc-surface/90 shadow-[0_24px_80px_-12px_rgba(74,55,40,0.35)] backdrop-blur-md">
          <div className="border-b border-fc-border/80 p-4">
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-fc-ink-subtle"
                aria-hidden
              />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, legacy ID, or DOB"
                className="w-full rounded-xl border border-fc-border bg-fc-surface py-3 pl-10 pr-16 font-sans text-base text-fc-ink placeholder:text-fc-ink-subtle focus:border-fc-accent focus:outline-none focus:ring-2 focus:ring-fc-accent/20"
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="command-palette-results"
              />
              <kbd className="pointer-events-none absolute right-3 rounded-md border border-fc-border bg-fc-paper px-1.5 py-0.5 font-mono text-[10px] text-fc-ink-subtle">
                Esc
              </kbd>
            </div>

            <div
              className="mt-3 flex flex-wrap gap-2"
              role="group"
              aria-label="Spiritual scope"
            >
              {PALETTE_SCOPES.map(({ value, label, spiritualDot }) => (
                <ScopeChip
                  key={value}
                  label={label}
                  spiritualDot={spiritualDot}
                  active={spiritual === value}
                  onClick={() => setSpiritual(value)}
                />
              ))}
            </div>
          </div>

          <div className="max-h-[min(52vh,28rem)] overflow-y-auto bg-fc-paper/60 p-2">
            {!searchActive && rows.length > 0 ? (
              <p className="px-3 pb-1 pt-1 font-display text-[10px] font-semibold uppercase tracking-widest text-fc-ink-subtle">
                Recent
              </p>
            ) : null}

            {busy ? (
              <p className="px-3 py-6 text-sm text-fc-ink-muted">Searching…</p>
            ) : null}

            {!busy && rows.length > 0 ? (
              <ul
                id="command-palette-results"
                ref={listRef}
                role="listbox"
                className="space-y-0.5"
              >
                {rows.map((patient, index) => (
                  <ResultRow
                    key={patient.id}
                    patient={patient}
                    active={index === activeIndex}
                    onHover={() => setActiveIndex(index)}
                    onOpen={() => openPatient(patient)}
                  />
                ))}
              </ul>
            ) : null}

            {showNoMatch ? (
              <div className="space-y-4 px-4 py-8 text-center">
                <p className="font-display text-base font-medium text-fc-ink">
                  No match found
                </p>
                <p className="text-sm text-fc-ink-muted">
                  Search first before registering someone new — phonetic matching may
                  find a record under a different spelling.
                </p>
                <Link
                  href="/patients/new"
                  onClick={closePalette}
                  className="inline-flex min-h-11 items-center rounded-lg bg-fc-accent px-5 py-2 text-sm font-medium text-fc-paper shadow hover:bg-fc-accent-strong"
                >
                  Register new patient
                </Link>
              </div>
            ) : null}

            {!busy && !searchActive && rows.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-fc-ink-muted">
                No recent patients yet — search by name, legacy ID, or DOB.
              </p>
            ) : null}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-fc-border/80 px-4 py-2.5">
            <div className={`flex flex-wrap items-center gap-3 ${FC_MUTED_NOTE}`}>
              <span className="inline-flex items-center gap-1">
                <ArrowUp className="h-3 w-3" aria-hidden />
                <ArrowDown className="h-3 w-3" aria-hidden />
                <span>to navigate</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" aria-hidden />
                <span>open chart</span>
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                online ? "text-fc-status-heard-ink" : "text-fc-ink-subtle"
              }`}
            >
              <Radio className="h-3 w-3" aria-hidden />
              {online ? "Phonetic match on" : "Phonetic match limited offline"}
            </span>
          </footer>
        </div>
      </div>
    </>,
    document.body,
  );
}
