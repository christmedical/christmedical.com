namespace ChristMedical.Sync;

public sealed class SyncServiceOptions
{
    /// <summary>SQLite on the mission laptop (e.g. <c>Data Source=%LOCALAPPDATA%\ChristMedical\mission.db</c>).</summary>
    public string LocalSqliteConnectionString { get; set; } = "Data Source=christmedical.sqlite";

    /// <summary>Railway (or any) PostgreSQL connection string for the hub database.</summary>
    public string PostgreSqlConnectionString { get; set; } = string.Empty;

    /// <summary>Mission / tenant id (PostgreSQL <c>SMALLINT</c>). Filters what is downloaded from the server.</summary>
    public short TenantId { get; set; } = 1;

    /// <summary>
    /// Optional TCP host:port used only for reachability (e.g. Railway Postgres hostname and 5432).
    /// If unset, reachability is inferred from the connection string Host.
    /// </summary>
    public string? ReachabilityHost { get; set; }

    public int ReachabilityPort { get; set; } = 5432;

    /// <summary>Timeout for TCP reachability probe.</summary>
    public int ReachabilityTimeoutMs { get; set; } = 3000;
}
