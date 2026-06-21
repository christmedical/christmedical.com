namespace ChristMedical.WebAPI.Models;

public sealed class FeedbackRecord
{
    public Guid Id { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public string PagePath { get; init; } = "";
    public float PinX { get; init; }
    public float PinY { get; init; }
    public string Note { get; init; } = "";
    public string ReviewerLabel { get; init; } = "";
    public string Status { get; init; } = "open";
    public string? UserAgent { get; init; }
    public int ViewportW { get; init; }
    public int ViewportH { get; init; }
}

public sealed class CreateFeedbackRequest
{
    public string PagePath { get; init; } = "";
    public float PinX { get; init; }
    public float PinY { get; init; }
    public string Note { get; init; } = "";
    public string ReviewerEmail { get; init; } = "";
    public string ReviewerLabel { get; init; } = "";
    public string? UserAgent { get; init; }
    public int ViewportW { get; init; }
    public int ViewportH { get; init; }
}

public sealed class FeedbackReviewerPref
{
    public string Email { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public bool FeedbackEnabled { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}

public sealed class UpsertFeedbackReviewerRequest
{
    public string Email { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public bool FeedbackEnabled { get; init; }
}

public sealed class PatchFeedbackReviewerRequest
{
    public bool FeedbackEnabled { get; init; }
}

public sealed class UpdateFeedbackStatusRequest
{
    public string Status { get; init; } = "";
}
