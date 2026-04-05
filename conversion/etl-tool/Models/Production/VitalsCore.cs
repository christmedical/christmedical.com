namespace EtlTool.Models.Production;

/// <summary>
/// Maps to public.vitals_core.
/// systolic and diastolic are migration-time additions (ALTER TABLE IF NOT EXISTS).
/// </summary>
public class VitalsCore
{
    public Guid      Id              { get; set; }
    public short     TenantId        { get; set; }
    public Guid      VisitId         { get; set; }
    public decimal?  Weight          { get; set; }
    public decimal?  Height          { get; set; }
    public int?      Pulse           { get; set; }
    public string?   Bp              { get; set; }   // stored as raw "120/80"
    public int?      Systolic        { get; set; }   // split from Bp
    public int?      Diastolic       { get; set; }   // split from Bp
    public int?      Resp            { get; set; }
    public decimal?  TempF           { get; set; }
    public int?      OxygenSat       { get; set; }
    public decimal?  Glucose         { get; set; }
    public decimal?  Hemoglobin      { get; set; }
    public string    DeviceId        { get; set; } = "MIGRATION_ETL";
    public DateTime  ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool      IsDeleted       { get; set; }
}
