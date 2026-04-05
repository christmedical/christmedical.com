namespace ChristMedical.WebAPI.Models;

public enum PatientNotesUpdateStatus
{
    Updated,
    NotFound,
    InvalidHeardGospelDate,
}

public sealed record PatientNotesUpdateOutcome(
    PatientNotesUpdateStatus Status,
    PatientResponse? Patient = null);
