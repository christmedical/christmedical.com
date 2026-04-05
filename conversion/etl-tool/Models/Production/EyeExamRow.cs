namespace EtlTool.Models.Production;

public class EyeExamRow
{
    public Guid Id { get; set; }
    public short TenantId { get; set; }
    public Guid VisitId { get; set; }
    public string? LegacyId { get; set; }
    public string? LegacyPatientId { get; set; }
    public bool ScreeningFlag { get; set; }
    public string? VaLeft { get; set; }
    public string? VaRight { get; set; }
    public string? TonometryR { get; set; }
    public string? TonometryL { get; set; }
    public string? Impression { get; set; }
    public string? Plan { get; set; }
    public string? ReadNear { get; set; }
    public string? ReadDist { get; set; }
    public string? Eom { get; set; }
    public string? Pupils { get; set; }
    public string? ArR { get; set; }
    public string? ArL { get; set; }
    public string? VaCombined { get; set; }
    public string? LField { get; set; }
    public bool Cataracts { get; set; }
    public bool DryEyes { get; set; }
    public bool Glaucoma { get; set; }
    public bool Pterygium { get; set; }
    public string? OtherNote { get; set; }
    public DateTime? ReadersGivenAt { get; set; }
    public string? ReadersGivenStrength { get; set; }
    public string DeviceId { get; set; } = "MIGRATION_ETL";
    public DateTime ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool IsDeleted { get; set; }
}
