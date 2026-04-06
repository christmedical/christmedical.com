using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
public sealed class DashboardController(IDashboardService dashboard) : ControllerBase
{
    /// <summary>High-level spiritual and medical impact metrics for a tenant.</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryResponse>> SummaryAsync(
        [FromQuery] short tenantId = 1,
        CancellationToken cancellationToken = default)
    {
        var data = await dashboard.GetSummaryAsync(tenantId, cancellationToken);
        return Ok(data);
    }
}
