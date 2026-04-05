using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading;
using Dotmim.Sync;
using Dotmim.Sync.Enumerations;
using Dotmim.Sync.PostgreSql;
using Dotmim.Sync.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;

namespace ChristMedical.Sync;

/// <summary>
/// Synchronizes a local SQLite replica with Railway PostgreSQL using Dotmim.Sync.
/// Row filters on <c>tenant_id</c> ensure the laptop only exchanges data for its mission.
/// When online, runs a full bidirectional sync (local changes upload, server changes download within the filter).
/// </summary>
public sealed class SyncService(
    IOptions<SyncServiceOptions> optionsAccessor,
    ILogger<SyncService> logger)
{
    private readonly SyncServiceOptions _options = optionsAccessor.Value;

    /// <summary>
    /// True if the OS reports network availability and the Postgres host accepts a TCP connection.
    /// </summary>
    public async Task<bool> IsInternetAvailableAsync(CancellationToken cancellationToken = default)
    {
        if (!NetworkInterface.GetIsNetworkAvailable())
        {
            logger.LogDebug("Sync skipped: no local network interface reported as up.");
            return false;
        }

        var host = _options.ReachabilityHost ?? TryGetHostFromConnectionString(_options.PostgreSqlConnectionString);
        if (string.IsNullOrWhiteSpace(host))
        {
            logger.LogWarning("Sync reachability: no host (set ReachabilityHost or a PostgreSqlConnectionString with Host=).");
            return false;
        }

        try
        {
            using var tcp = new TcpClient();
            using var connectCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            connectCts.CancelAfter(_options.ReachabilityTimeoutMs);
            await tcp.ConnectAsync(host, _options.ReachabilityPort, connectCts.Token).ConfigureAwait(false);
            logger.LogDebug("Reachability OK: {Host}:{Port}", host, _options.ReachabilityPort);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Reachability failed for {Host}:{Port}", host, _options.ReachabilityPort);
            return false;
        }
    }

    /// <summary>
    /// Performs a bidirectional sync (upload + download) only when <see cref="IsInternetAvailableAsync"/> is true.
    /// Returns null when offline.
    /// </summary>
    public async Task<SyncResult?> SynchronizeIfOnlineAsync(CancellationToken cancellationToken = default)
    {
        if (!await IsInternetAvailableAsync(cancellationToken).ConfigureAwait(false))
        {
            logger.LogInformation("PostgreSQL sync skipped: no connectivity to hub.");
            return null;
        }

        return await SynchronizeAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Subscribes to <see cref="NetworkChange.NetworkAvailabilityChanged"/> and runs
    /// <see cref="SynchronizeIfOnlineAsync"/> when the OS reports connectivity (with a simple overlap gate).
    /// Dispose the return value to unsubscribe.
    /// </summary>
    public IDisposable RegisterAutomaticSyncWhenNetworkRestored(CancellationToken cancellationToken = default)
    {
        var gate = 0;

        async void Handler(object? _, NetworkAvailabilityEventArgs e)
        {
            if (!e.IsAvailable || cancellationToken.IsCancellationRequested)
                return;

            if (Interlocked.CompareExchange(ref gate, 1, 0) != 0)
                return;

            try
            {
                await SynchronizeIfOnlineAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Automatic sync after network change failed.");
            }
            finally
            {
                Interlocked.Exchange(ref gate, 0);
            }
        }

        NetworkChange.NetworkAvailabilityChanged += Handler;
        return new NetworkHandlerSubscription(() => NetworkChange.NetworkAvailabilityChanged -= Handler);
    }

    /// <summary>Runs Dotmim.Sync regardless of reachability check (caller verifies network if needed).</summary>
    public async Task<SyncResult> SynchronizeAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.PostgreSqlConnectionString))
            throw new InvalidOperationException($"{nameof(SyncServiceOptions.PostgreSqlConnectionString)} is not configured.");

        var serverProvider = new NpgsqlSyncProvider(_options.PostgreSqlConnectionString);
        var clientProvider = new SqliteSyncProvider(_options.LocalSqliteConnectionString);

        var setup = CreateTenantFilteredSetup();
        var parameters = new SyncParameters { { "tenant_id", _options.TenantId } };

        var agent = new SyncAgent(clientProvider, serverProvider);
        logger.LogInformation("Starting Dotmim.Sync for tenant_id={TenantId} …", _options.TenantId);

        var result = await agent.SynchronizeAsync(
                SyncOptions.DefaultScopeName,
                setup,
                SyncType.Normal,
                parameters,
                progress: null,
                cancellationToken)
            .ConfigureAwait(false);

        logger.LogInformation(
            "Sync finished: uploaded={Uploaded} downloaded={Downloaded} appliedOnClient={Client} appliedOnServer={Server}",
            result.TotalChangesUploadedToServer,
            result.TotalChangesDownloadedFromServer,
            result.TotalChangesAppliedOnClient,
            result.TotalChangesAppliedOnServer);

        return result;
    }

    /// <summary>
    /// Builds setup for synced tables. All filtered tables share the <c>tenant_id</c> parameter so the laptop
    /// only sees its mission. <c>trips</c> is included with a join through <c>visits</c> because it has no <c>tenant_id</c>.
    /// </summary>
    private static SyncSetup CreateTenantFilteredSetup()
    {
        var setup = new SyncSetup(
            "trips",
            "patients",
            "visits",
            "vitals_core",
            "lab_results",
            "medications",
            "diagnoses",
            "eye_exams");

        // trips: restrict to trips referenced by visits for this tenant
        var tripsFilter = new SetupFilter("trips");
        tripsFilter.AddParameter("tenant_id", "visits");
        tripsFilter.AddJoin(Join.Inner, "visits").On("visits", "trip_id", "trips", "id");
        tripsFilter.AddWhere("tenant_id", "visits", "tenant_id");
        setup.Filters.Add(tripsFilter);

        setup.Filters.Add("patients", "tenant_id");
        setup.Filters.Add("visits", "tenant_id");
        setup.Filters.Add("vitals_core", "tenant_id");
        setup.Filters.Add("lab_results", "tenant_id");
        setup.Filters.Add("medications", "tenant_id");
        setup.Filters.Add("diagnoses", "tenant_id");
        setup.Filters.Add("eye_exams", "tenant_id");

        return setup;
    }

    private static string? TryGetHostFromConnectionString(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return null;
        try
        {
            var builder = new NpgsqlConnectionStringBuilder(connectionString);
            return builder.Host;
        }
        catch
        {
            return null;
        }
    }

    private sealed class NetworkHandlerSubscription(Action unsubscribe) : IDisposable
    {
        public void Dispose() => unsubscribe();
    }
}
