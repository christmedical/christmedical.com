namespace EtlTool.Configuration;

/// <summary>
/// Mission / tenant controls loaded from <c>conversion-config.json</c>.
/// Boolean-like keys accept: yes/no, true/false, 1/0 (case-insensitive).
/// </summary>
public sealed class ConversionOptions
{
    /// <summary>Display name, e.g. "Belize Central".</summary>
    public string TenantName { get; set; } = "Default Mission";

    /// <summary>Primary key for multi-tenant rows (SMALLINT in PostgreSQL).</summary>
    public int TenantId { get; set; } = 1;

    /// <summary>When true, emit a portable archive under <see cref="ArchiveOutputPath"/>.</summary>
    public string? CreateArchive { get; set; }

    /// <summary>
    /// When false, after a successful conversion run all staging and production data
    /// from this pass are removed (schemas reset). Defaults to yes.
    /// </summary>
    public string? KeepData { get; set; }

    /// <summary>Ignored when <see cref="KeepData"/> resolves to false.</summary>
    public string? KeepStagingData { get; set; }

    /// <summary>Optional override for the Access file (container: <c>/app/input/*.accdb</c>).</summary>
    public string? AccessDatabasePath { get; set; }

    /// <summary>Where <c>CreateArchive</c> writes the tenant bundle (container: <c>/app/output</c>).</summary>
    public string? ArchiveOutputPath { get; set; }

    public bool ShouldCreateArchive() => JsonBool.Parse(CreateArchive, defaultValue: false);

    /// <summary>
    /// <c>false</c> means revert DB after success (drop staging + rebuild empty public).
    /// </summary>
    public bool ShouldKeepData() => JsonBool.Parse(KeepData, defaultValue: true);

    public bool ShouldKeepStagingData() =>
        ShouldKeepData() && JsonBool.Parse(KeepStagingData, defaultValue: true);
}
