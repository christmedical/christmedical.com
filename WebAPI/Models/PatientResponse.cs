namespace ChristMedical.WebAPI.Models;

public sealed class PatientResponse
{
    public Guid Id { get; init; }
    public string? LegacyId { get; init; }
    public required string DisplayNameMasked { get; init; }
    public string? DateOfBirth { get; init; }
    public bool HopeGospel { get; init; }
    public string? HeardGospelDate { get; init; }
    public required string SpiritualStatusLabel { get; init; }
    /// <summary>UI hint: <c>heard</c>, <c>hope</c>, or <c>none</c>.</summary>
    public required string SpiritualStatusKind { get; init; }
    public string? SpiritualNotes { get; init; }
    public string? MedicalHistory { get; init; }
    public string? SurgicalHistory { get; init; }
    public string? FamilyHistory { get; init; }
    public string? DrugAllergies { get; init; }
}
