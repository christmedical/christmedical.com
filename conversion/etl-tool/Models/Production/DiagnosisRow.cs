namespace EtlTool.Models.Production;

public class DiagnosisRow
{
    public Guid Id { get; set; }
    public short TenantId { get; set; }
    public Guid VisitId { get; set; }
    public string? LegacyId { get; set; }
    public string? DxCode { get; set; }
    public string? AdditionalInfo { get; set; }
    public string DeviceId { get; set; } = "MIGRATION_ETL";
    public DateTime ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool IsDeleted { get; set; }
}
