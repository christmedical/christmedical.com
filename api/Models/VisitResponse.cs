namespace ChristMedical.WebAPI.Models;

public sealed class VisitResponse
{
    public required Guid Id { get; init; }
    public required Guid PatientId { get; init; }
    public required DateTimeOffset VisitDate { get; init; }
    public string? LocationName { get; init; }
    public string? ChiefComplaint { get; init; }
    public string? DiagnosisText { get; init; }
    public string? ReferralNotes { get; init; }
    public Guid? TripId { get; init; }
    public VitalsResponse? Vitals { get; init; }
}
