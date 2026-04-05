namespace ChristMedical.WebAPI.Models;

/// <summary>Replaces editable note / spiritual fields (last write wins, no versioning).</summary>
public sealed class UpdatePatientNotesRequest
{
    public string? SpiritualNotes { get; init; }
    public string? MedicalHistory { get; init; }
    public string? SurgicalHistory { get; init; }
    public string? FamilyHistory { get; init; }
    public string? DrugAllergies { get; init; }
    public bool HopeGospel { get; init; }
    /// <summary>ISO date yyyy-MM-dd, or null/empty to clear.</summary>
    public string? HeardGospelDate { get; init; }
}
