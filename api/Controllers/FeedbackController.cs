using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/feedback")]
public sealed class FeedbackController(IFeedbackService feedback, IConfiguration configuration) : ControllerBase
{
    /// <summary>Creates a reviewer feedback pin (feedback mode only).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(FeedbackRecord), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeedbackRecord>> CreateAsync(
        [FromBody] CreateFeedbackRequest body,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        var created = await feedback.CreateAsync(body, cancellationToken);
        if (created is null)
            return BadRequest(new { message = "Invalid feedback payload." });

        return CreatedAtAction(nameof(ListAsync), new { id = created.Id }, created);
    }

    /// <summary>Lists feedback notes newest first, optionally filtered by status.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<FeedbackRecord>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<FeedbackRecord>>> ListAsync(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        if (status is not null)
        {
            var s = status.Trim().ToLowerInvariant();
            if (s is not "open" and not "done")
                return BadRequest(new { message = "status must be open or done." });
        }

        var list = await feedback.ListAsync(status?.Trim().ToLowerInvariant(), cancellationToken);
        return Ok(list);
    }

    /// <summary>Updates feedback status (open ↔ done).</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(FeedbackRecord), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeedbackRecord>> PatchStatusAsync(
        Guid id,
        [FromBody] UpdateFeedbackStatusRequest body,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        var updated = await feedback.UpdateStatusAsync(id, body.Status, cancellationToken);
        if (updated is null)
            return BadRequest(new { message = "Invalid id or status." });

        return Ok(updated);
    }
}
