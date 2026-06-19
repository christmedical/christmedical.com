import type { PatientDto } from "@/lib/patientTypes";
import { filterPatientsLocalAdvanced } from "@/lib/patientSearchMatch";

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

/** Offline fallback — phonetic when stored codes exist; see patientSearchMatch.ts. */
export function filterPatientsLocal(
  patients: PatientDto[],
  q: string,
  spiritual: SpiritualFilter,
): PatientDto[] {
  return filterPatientsLocalAdvanced(patients, q, spiritual);
}
