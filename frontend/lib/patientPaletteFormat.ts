import { patientAgeYears } from "@/lib/patientAge";
import type { PatientDto } from "@/lib/patientTypes";

/** Initials avatar for palette rows (up to two words). */
export function patientInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatPaletteDob(dateOfBirth: string): string {
  const d = new Date(`${dateOfBirth}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateOfBirth;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Meta line: `14 Mar 1991 · 35y · HC-AB-01-0001 · Silk Grass` */
export function formatPaletteMetaLine(
  patient: PatientDto,
  community: string | null,
): string {
  const segments: string[] = [];
  if (patient.dateOfBirth) {
    const age = patientAgeYears(patient.dateOfBirth, patient.calculatedAge);
    const dob = formatPaletteDob(patient.dateOfBirth);
    segments.push(age != null ? `${dob} · ${age}y` : dob);
  }
  const id = patient.legacyId ?? patient.displayId;
  if (id) segments.push(id);
  if (community) segments.push(community);
  return segments.length > 0 ? segments.join(" · ") : "—";
}
