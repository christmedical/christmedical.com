export type DashboardSummaryDto = {
  tenantId: number;
  spiritual: {
    totalPatients: number;
    heardGospel: number;
    hopeWithoutHeard: number;
    noSpiritualRecord: number;
  };
  medical: {
    patientsWithAllergiesDocumented: number;
    patientsWithMedicalHistory: number;
    patientsWithSurgicalHistory: number;
    totalVisits: number;
  };
};
