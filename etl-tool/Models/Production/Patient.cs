namespace EtlTool.Models.Production;

/// <summary>
/// Represents a row in public.patients. Matches V1__Initial_Schema.sql exactly,
/// with two additions added by the migration service at run-time:
///   - legacy_id  : preserves the original staging.patients.id for audit
///   - home_phone / mobile_phone : carried forward from staging (not in V1 schema)
/// </summary>
public class Patient
{
    public Guid Id { get; set; }

    // Audit trail — maps from staging.patients.id
    public string? LegacyId { get; set; }

    // Identity
    public string? DisplayId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime? Dob { get; set; }
    public int? CalculatedAge { get; set; }
    public string? Gender { get; set; }
    public string? MaritalStatus { get; set; }
    public string? GovId { get; set; }

    // Next of kin is resolved in a later migration pass; left null on initial load
    public Guid? NextOfKinId { get; set; }

    // Clinical history
    public string? MedicalHistory { get; set; }
    public string? SurgicalHistory { get; set; }
    public string? FamilyHistory { get; set; }
    public string? DrugAllergies { get; set; }

    // Lifestyle booleans (Access -1/0 → bool)
    public bool Smoke { get; set; }
    public bool Alcohol { get; set; }
    public bool HopeGospel { get; set; }

    // Contact (columns added by migration setup step)
    public string? HomePhone { get; set; }
    public string? MobilePhone { get; set; }

    // Sync metadata
    public string DeviceId { get; set; } = "MIGRATION_ETL";
    public DateTime ClientUpdatedAt { get; set; }
    public DateTime? ServerRestoredAt { get; set; }
    public bool IsDeleted { get; set; }
}
