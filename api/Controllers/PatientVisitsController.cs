using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/patients/{patientId:guid}/visits")]
public sealed class PatientVisitsController(IVisitService visits) : ControllerBase
{
    /// <summary>Recent encounters for charting (newest first, capped at 100).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<VisitResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<VisitResponse>>> ListAsync(
        Guid patientId,
        [FromQuery] short tenantId = 1,
        CancellationToken cancellationToken = default)
    {
        var list = await visits.ListVisitsForPatientAsync(patientId, tenantId, cancellationToken);
        return Ok(list);
    }

    /// <summary>Creates a visit and optional linked vitals row in one transaction.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(VisitResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VisitResponse>> CreateAsync(
        Guid patientId,
        [FromQuery] short tenantId,
        [FromBody] CreateVisitRequest body,
        CancellationToken cancellationToken = default)
    {
        var created = await visits.CreateVisitAsync(patientId, tenantId, body, cancellationToken);
        if (created is null)
            return NotFound();

        return Ok(created);
    }
}
