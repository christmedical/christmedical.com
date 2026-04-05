namespace EtlTool.Models.Staging;

/// <summary>
/// Mirrors staging.patients exactly. Every column in the staging schema is TEXT,
/// so every property here is string? — Dapper maps by column alias from the SELECT query.
/// </summary>
public class StagingPatient
{
    public string? Id { get; set; }
    public string? LastName { get; set; }
    public string? FirstName { get; set; }
    public string? HomePhone { get; set; }
    public string? MobilePhone { get; set; }
    public string? PersonalNotes { get; set; }
    public string? Church { get; set; }
    public string? Hope { get; set; }
    public string? Dob { get; set; }
    public string? SsNo { get; set; }
    public string? Allergies { get; set; }
    public string? MedHist { get; set; }
    public string? Surgeries { get; set; }
    public string? MaritalStatus { get; set; }
    public string? Smoke { get; set; }
    public string? Alcohol { get; set; }
    public string? FamHist { get; set; }
    public string? Gender { get; set; }
    public string? GynG { get; set; }
    public string? GynP { get; set; }
    public string? Age { get; set; }
    public string? SpanishOnly { get; set; }
    public string? PtUpdatedOn { get; set; }
    public string? WhereLive { get; set; }
    public string? InfoNotes { get; set; }
    public string? HeardGospel { get; set; }
    public string? Suffix { get; set; }
    public string? LastReaders { get; set; }
    public string? PatientType { get; set; }
    public string? PtType { get; set; }
}
