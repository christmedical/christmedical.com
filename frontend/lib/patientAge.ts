/** Age display for search results and chart header. */
export function patientAgeYears(
  dateOfBirth: string | null,
  calculatedAge?: number | null,
): number | null {
  if (calculatedAge != null && calculatedAge >= 0) return calculatedAge;
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T12:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function formatDobWithAge(
  dateOfBirth: string | null,
  calculatedAge?: number | null,
): string {
  if (!dateOfBirth) return "—";
  const age = patientAgeYears(dateOfBirth, calculatedAge);
  return age != null ? `${dateOfBirth} · ${age} y/o` : dateOfBirth;
}
