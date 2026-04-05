import type { PatientDto } from "@/lib/patientTypes";

/** Keeps selection when the same id is still in the refreshed list, else first row. */
export function reconcileSelectionAfterLoad(
  prev: PatientDto | null,
  data: PatientDto[],
): PatientDto | null {
  if (!prev) return data[0] ?? null;
  return data.find((p) => p.id === prev.id) ?? data[0] ?? null;
}
