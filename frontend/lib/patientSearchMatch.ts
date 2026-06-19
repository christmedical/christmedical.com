import { doubleMetaphonePrimary } from "@/lib/doubleMetaphone";
import type { SpiritualFilter } from "@/lib/patientFilter";
import type { PatientDto } from "@/lib/patientTypes";

export type PatientSearchRecord = PatientDto & {
  /** Server-provided phonetic codes; offline search degrades without them. */
  firstNamePhonetic?: string | null;
  lastNamePhonetic?: string | null;
  /** Patient ID format e.g. HC-AB-01-0001 when legacy id unset. */
  displayId?: string | null;
  /** Village / community when available. */
  community?: string | null;
};

function tokenize(q: string): string[] {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function substringHit(token: string, patient: PatientSearchRecord): boolean {
  const name = patient.displayName.toLowerCase();
  const legacy = (patient.legacyId ?? patient.displayId ?? "").toLowerCase();
  const dob = (patient.dateOfBirth ?? "").toLowerCase();
  return name.includes(token) || legacy.includes(token) || dob.includes(token);
}

function phoneticHit(token: string, patient: PatientSearchRecord): boolean {
  const code = doubleMetaphonePrimary(token);
  if (!code) return false;

  const first = patient.firstNamePhonetic ?? "";
  const last = patient.lastNamePhonetic ?? "";
  if (first === code || last === code) return true;

  // Degrade: compute from display name parts when API phonetics missing.
  const parts = patient.displayName.trim().split(/\s+/);
  if (parts.length >= 1 && doubleMetaphonePrimary(parts[0]!) === code) return true;
  if (parts.length >= 2 && doubleMetaphonePrimary(parts[parts.length - 1]!) === code) {
    return true;
  }
  return false;
}

function spiritualMatches(patient: PatientSearchRecord, filter: SpiritualFilter): boolean {
  if (filter === "all") return true;
  return patient.spiritualStatusKind === filter;
}

/**
 * Local patient search (offline / cache). Phonetic matching uses stored codes when
 * present; otherwise falls back to a JS Double Metaphone encode — weaker than Postgres
 * dmetaphone but keeps field tablets usable offline.
 */
export function filterPatientsLocalAdvanced(
  patients: PatientSearchRecord[],
  q: string,
  spiritual: SpiritualFilter,
  options?: { phonetic?: boolean },
): PatientSearchRecord[] {
  const phonetic = options?.phonetic ?? true;
  const list = patients.filter((p) => spiritualMatches(p, spiritual));
  const tokens = tokenize(q);
  if (tokens.length === 0) return list;

  return list.filter((p) =>
    tokens.every(
      (t) =>
        substringHit(t, p) || (phonetic && phoneticHit(t, p)),
    ),
  );
}

/** Exported for Vitest false-negative guards. */
export function patientMatchesQuery(
  patient: PatientSearchRecord,
  q: string,
  spiritual: SpiritualFilter = "all",
): boolean {
  return filterPatientsLocalAdvanced([patient], q, spiritual).length > 0;
}
