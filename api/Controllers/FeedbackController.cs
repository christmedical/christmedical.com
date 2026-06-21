using ChristMedical.WebAPI.Infrastructure;
using ChristMedical.WebAPI.Models;
using ChristMedical.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChristMedical.WebAPI.Controllers;

[ApiController]
[Route("api/v1/feedback")]
public sealed class FeedbackController(IFeedbackService feedback, IConfiguration configuration) : ControllerBase
{
    /// <summary>Creates a reviewer feedback pin (reviewer must be allowlisted).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(FeedbackRecord), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<FeedbackRecord>> CreateAsync(
        [FromBody] CreateFeedbackRequest body,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        var created = await feedback.CreateAsync(body, cancellationToken);
        if (created is null)
        {
            var email = body.ReviewerEmail.Trim();
            if (email.Length > 0 && !await feedback.IsReviewerEnabledAsync(email, cancellationToken))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Feedback is not enabled for this reviewer." });

            return BadRequest(new { message = "Invalid feedback payload." });
        }

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

    /// <summary>Returns whether feedback widget access is enabled for an email.</summary>
    [HttpGet("reviewers/pref")]
    [ProducesResponseType(typeof(FeedbackReviewerPref), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FeedbackReviewerPref>> GetReviewerPrefAsync(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        var pref = await feedback.GetReviewerPrefAsync(email, cancellationToken);
        if (pref is null)
            return Ok(new FeedbackReviewerPref { Email = email.Trim().ToLowerInvariant(), FeedbackEnabled = false });

        return Ok(pref);
    }

    /// <summary>Lists reviewer allowlist entries for the owner review page.</summary>
    [HttpGet("reviewers")]
    [ProducesResponseType(typeof(IReadOnlyList<FeedbackReviewerPref>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<FeedbackReviewerPref>>> ListReviewersAsync(
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        return Ok(await feedback.ListReviewerPrefsAsync(cancellationToken));
    }

    /// <summary>Adds or updates a reviewer allowlist entry.</summary>
    [HttpPut("reviewers")]
    [ProducesResponseType(typeof(FeedbackReviewerPref), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeedbackReviewerPref>> UpsertReviewerAsync(
        [FromBody] UpsertFeedbackReviewerRequest body,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        var saved = await feedback.UpsertReviewerPrefAsync(body, cancellationToken);
        if (saved is null)
            return BadRequest(new { message = "Invalid reviewer email." });

        return Ok(saved);
    }

    /// <summary>Toggles feedback widget access for a reviewer.</summary>
    [HttpPatch("reviewers/{email}")]
    [ProducesResponseType(typeof(FeedbackReviewerPref), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeedbackReviewerPref>> PatchReviewerAsync(
        string email,
        [FromBody] PatchFeedbackReviewerRequest body,
        CancellationToken cancellationToken)
    {
        if (!FeedbackMode.IsEnabled(configuration))
            return NotFound();

        var updated = await feedback.SetReviewerEnabledAsync(email, body.FeedbackEnabled, cancellationToken);
        if (updated is null)
            return BadRequest(new { message = "Reviewer not found." });

        return Ok(updated);
    }
}
