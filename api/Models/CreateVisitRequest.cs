namespace ChristMedical.WebAPI.Models;

public sealed class CreateVisitRequest
{
    /// <summary>When the encounter occurred; defaults to server UTC now if omitted.</summary>
    public DateTimeOffset? VisitDate { get; init; }

    public string? LocationName { get; init; }
    public string? ChiefComplaint { get; init; }
    public string? DiagnosisText { get; init; }
    public string? ReferralNotes { get; init; }
    public Guid? TripId { get; init; }
    public CreateVitalsRequest? Vitals { get; init; }
}

public sealed class CreateVitalsRequest
{
    public decimal? Weight { get; init; }
    public decimal? Height { get; init; }
    public int? Pulse { get; init; }
    public string? Bp { get; init; }
    public int? Resp { get; init; }
    public decimal? TempF { get; init; }
    public int? OxygenSat { get; init; }
    public decimal? Glucose { get; init; }
    public decimal? Hemoglobin { get; init; }
}
