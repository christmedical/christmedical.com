export type VitalsDto = {
  weight: number | null;
  height: number | null;
  pulse: number | null;
  bp: string | null;
  resp: number | null;
  tempF: number | null;
  oxygenSat: number | null;
  glucose: number | null;
  hemoglobin: number | null;
};

export type VisitDto = {
  id: string;
  patientId: string;
  visitDate: string;
  locationName: string | null;
  chiefComplaint: string | null;
  diagnosisText: string | null;
  referralNotes: string | null;
  tripId: string | null;
  vitals: VitalsDto | null;
};
