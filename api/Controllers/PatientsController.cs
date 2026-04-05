using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/patients")]
public class PatientsController(IPatientService patients) : ControllerBase
{
    /// <summary>
    /// Patient list for offline-capable PWA (default 50 rows, up to 2000 for IndexedDB sync).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PatientResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<PatientResponse>>> ListAsync(
        [FromQuery] short tenantId = 1,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        if (limit is < 1 or > 2000)
            return BadRequest("limit must be between 1 and 2000.");

        var patientsList = await patients.ListPatientsAsync(tenantId, limit, cancellationToken);
        return Ok(patientsList);
    }

    /// <summary>Replaces note / spiritual fields (last write wins — concurrent saves overwrite without merge).</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PatientResponse>> PatchNotesAsync(
        Guid id,
        [FromQuery] short tenantId,
        [FromBody] UpdatePatientNotesRequest body,
        CancellationToken cancellationToken = default)
    {
        var outcome = await patients.UpdatePatientNotesAsync(
            id,
            tenantId,
            body,
            cancellationToken);

        return outcome.Status switch
        {
            PatientNotesUpdateStatus.NotFound => NotFound(),
            PatientNotesUpdateStatus.InvalidHeardGospelDate => BadRequest(
                "heardGospelDate must be a valid ISO date (yyyy-MM-dd) or omitted/null."),
            PatientNotesUpdateStatus.Updated => Ok(outcome.Patient!),
            _ => throw new InvalidOperationException($"Unexpected status: {outcome.Status}"),
        };
    }
}
