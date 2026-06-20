import type { PatientDto } from "@/lib/patientTypes";

const KEY = "cm-recent-patients";
const MAX = 8;

export function loadRecentPatients(): PatientDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PatientDto[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberRecentPatient(patient: PatientDto): void {
  if (typeof window === "undefined") return;
  const prev = loadRecentPatients().filter((p) => p.id !== patient.id);
  const next = [patient, ...prev].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
