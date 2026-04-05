namespace EtlTool.Models.Production;

/// <summary>
/// Maps to public.lab_results.
/// Each non-null urinalysis / panel field from staging.visits_gen becomes one row.
/// </summary>
public class LabResult
{
    public Guid Id { get; set; }
    public short TenantId { get; set; }
    public Guid VisitId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string? ResultValue { get; set; }
    public string DeviceId { get; set; } = "MIGRATION_ETL";
    public DateTime ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool IsDeleted { get; set; }
}
