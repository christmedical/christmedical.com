namespace EtlTool.Models.Production;

/// <summary>Row in <c>public.medications</c> (visit-level Rx from staging.visits_rx).</summary>
public class MedicationRow
{
    public Guid Id { get; set; }
    public short TenantId { get; set; }
    public Guid VisitId { get; set; }
    public string? LegacyId { get; set; }
    public string? CatalogMedlistId { get; set; }
    public string? MedicationCode { get; set; }
    public string? MedicationName { get; set; }
    public string? Strength { get; set; }
    public string? Dose { get; set; }
    public string? Directions { get; set; }
    public bool DidNotDispense { get; set; }
    public string DeviceId { get; set; } = "MIGRATION_ETL";
    public DateTime ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool IsDeleted { get; set; }
}
