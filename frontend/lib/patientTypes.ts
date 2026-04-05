export type PatientDto = {
  id: string;
  legacyId: string | null;
  displayNameMasked: string;
  dateOfBirth: string | null;
  hopeGospel: boolean;
  heardGospelDate: string | null;
  spiritualStatusLabel: string;
  spiritualStatusKind: "heard" | "hope" | "none";
  spiritualNotes: string | null;
  medicalHistory: string | null;
  surgicalHistory: string | null;
  familyHistory: string | null;
  drugAllergies: string | null;
};
