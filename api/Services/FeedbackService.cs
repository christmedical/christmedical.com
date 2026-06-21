using ChristMedical.WebAPI.Models;
using Dapper;
using Npgsql;

namespace ChristMedical.WebAPI.Services;

public interface IFeedbackService
{
    Task<FeedbackRecord?> CreateAsync(CreateFeedbackRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FeedbackRecord>> ListAsync(string? status, CancellationToken cancellationToken = default);
    Task<FeedbackRecord?> UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}

public sealed class FeedbackService(IConfiguration configuration) : IFeedbackService
{
    public async Task<FeedbackRecord?> CreateAsync(
        CreateFeedbackRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidPin(request.PinX) || !IsValidPin(request.PinY))
            return null;

        var note = request.Note.Trim();
        if (note.Length == 0)
            return null;

        var pagePath = request.PagePath.Trim();
        if (pagePath.Length == 0)
            return null;

        var label = request.ReviewerLabel.Trim();
        if (label.Length == 0)
            label = "Reviewer";

        const string sql = """
            INSERT INTO public.feedback (
                page_path, pin_x, pin_y, note, reviewer_label, user_agent, viewport_w, viewport_h
            )
            VALUES (
                @pagePath, @pinX, @pinY, @note, @reviewerLabel, @userAgent, @viewportW, @viewportH
            )
            RETURNING
                id AS Id,
                created_at AS CreatedAt,
                page_path AS PagePath,
                pin_x AS PinX,
                pin_y AS PinY,
                note AS Note,
                reviewer_label AS ReviewerLabel,
                status AS Status,
                user_agent AS UserAgent,
                viewport_w AS ViewportW,
                viewport_h AS ViewportH;
            """;

        await using var conn = await OpenAsync(cancellationToken);
        return await conn.QuerySingleOrDefaultAsync<FeedbackRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    pagePath,
                    pinX = request.PinX,
                    pinY = request.PinY,
                    note,
                    reviewerLabel = label,
                    userAgent = request.UserAgent,
                    viewportW = request.ViewportW,
                    viewportH = request.ViewportH,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<FeedbackRecord>> ListAsync(
        string? status,
        CancellationToken cancellationToken = default)
    {
        var normalized = NormalizeStatus(status);
        var sql = normalized is null
            ? """
              SELECT
                  id AS Id,
                  created_at AS CreatedAt,
                  page_path AS PagePath,
                  pin_x AS PinX,
                  pin_y AS PinY,
                  note AS Note,
                  reviewer_label AS ReviewerLabel,
                  status AS Status,
                  user_agent AS UserAgent,
                  viewport_w AS ViewportW,
                  viewport_h AS ViewportH
              FROM public.feedback
              ORDER BY created_at DESC;
              """
            : """
              SELECT
                  id AS Id,
                  created_at AS CreatedAt,
                  page_path AS PagePath,
                  pin_x AS PinX,
                  pin_y AS PinY,
                  note AS Note,
                  reviewer_label AS ReviewerLabel,
                  status AS Status,
                  user_agent AS UserAgent,
                  viewport_w AS ViewportW,
                  viewport_h AS ViewportH
              FROM public.feedback
              WHERE status = @status
              ORDER BY created_at DESC;
              """;

        await using var conn = await OpenAsync(cancellationToken);
        var rows = await conn.QueryAsync<FeedbackRecord>(
            new CommandDefinition(sql, new { status = normalized }, cancellationToken: cancellationToken));
        return rows.ToList();
    }

    public async Task<FeedbackRecord?> UpdateStatusAsync(
        Guid id,
        string status,
        CancellationToken cancellationToken = default)
    {
        var normalized = NormalizeStatus(status);
        if (normalized is null)
            return null;

        const string sql = """
            UPDATE public.feedback
            SET status = @status
            WHERE id = @id
            RETURNING
                id AS Id,
                created_at AS CreatedAt,
                page_path AS PagePath,
                pin_x AS PinX,
                pin_y AS PinY,
                note AS Note,
                reviewer_label AS ReviewerLabel,
                status AS Status,
                user_agent AS UserAgent,
                viewport_w AS ViewportW,
                viewport_h AS ViewportH;
            """;

        await using var conn = await OpenAsync(cancellationToken);
        return await conn.QuerySingleOrDefaultAsync<FeedbackRecord>(
            new CommandDefinition(sql, new { id, status = normalized }, cancellationToken: cancellationToken));
    }

    private async Task<NpgsqlConnection> OpenAsync(CancellationToken cancellationToken)
    {
        var cs = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(cs))
            throw new InvalidOperationException("Database is not configured.");

        var conn = new NpgsqlConnection(cs);
        await conn.OpenAsync(cancellationToken);
        return conn;
    }

    private static bool IsValidPin(float value) => value is >= 0f and <= 1f;

    private static string? NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return null;

        var s = status.Trim().ToLowerInvariant();
        return s is "open" or "done" ? s : null;
    }
}
