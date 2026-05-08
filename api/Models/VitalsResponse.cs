namespace ChristMedical.WebAPI.Models;

public sealed class VitalsResponse
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
