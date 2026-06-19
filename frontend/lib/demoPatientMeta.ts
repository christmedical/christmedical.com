/** Demo-only village labels until community is on the patients table. */
export const DEMO_PATIENT_COMMUNITY: Record<string, string> = {
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1": "Belize City",
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2": "Dangriga",
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3": "San Pedro",
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4": "Silk Grass",
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5": "Maya Centre",
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6": "Hopkins",
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7": "Placencia",
};

export function patientCommunity(patientId: string): string | null {
  return DEMO_PATIENT_COMMUNITY[patientId] ?? null;
}
