namespace EtlTool.Models.Production;

/// <summary>
/// Composite record produced by VisitMapper.Map().
/// Maps directly to public.visits.
/// The nested Vitals and LabResults are decomposed by VisitMigrationService
/// into public.vitals_core and public.lab_results respectively.
/// </summary>
public class ProductionVisit
{
    // --- public.visits ---
    public Guid Id { get; set; }
    public short TenantId { get; set; }
    public string? LegacyId { get; set; }   // staging.visits_gen.genid — audit trail
    public Guid? TripId { get; set; }   // null on initial migration; linked in a later pass
    public Guid PatientId { get; set; }   // resolved from legacy_id lookup
    public DateTime? VisitDate { get; set; }
    public string? LocationName { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? DiagnosisText { get; set; }
    public string? ReferralNotes { get; set; }
    public string DeviceId { get; set; } = "MIGRATION_ETL";
    public DateTime ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool IsDeleted { get; set; }

    // --- Written to public.vitals_core ---
    public VitalsCore? Vitals { get; set; }

    // --- Written to public.lab_results (one row per non-null test result) ---
    public List<LabResult> LabResults { get; set; } = [];
}
