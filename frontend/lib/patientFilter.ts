import type { PatientDto } from "@/lib/patientTypes";

export type SpiritualFilter = "all" | "heard" | "hope" | "none";

export const SPIRITUAL_FILTERS: ReadonlyArray<{ value: SpiritualFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "heard", label: "Heard gospel" },
  { value: "hope", label: "Hope / interest" },
  { value: "none", label: "No record" },
];

export function isSearchMode(q: string, spiritual: SpiritualFilter): boolean {
  return q.trim() !== "" || spiritual !== "all";
}

/** Offline fallback — server search uses phonetic matching when online. */
export function filterPatientsLocal(
  patients: PatientDto[],
  q: string,
  spiritual: SpiritualFilter,
): PatientDto[] {
  let list = patients;
  if (spiritual !== "all") {
    list = list.filter((p) => p.spiritualStatusKind === spiritual);
  }
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return list;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return list.filter((p) => {
    const name = p.displayName.toLowerCase();
    const legacy = (p.legacyId ?? "").toLowerCase();
    return tokens.every((t) => name.includes(t) || legacy.includes(t));
  });
}
