using ChristMedical.Sync;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace ChristMedical.Sync.Test;

public sealed class ServiceCollectionExtensionsTests
{
    [Fact]
    public void AddChristMedicalSync_Registers_SyncService_And_Options()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Sync:TenantId"] = "7",
            ["Sync:PostgreSqlConnectionString"] = "Host=db;Username=x;Password=y;Database=z",
            ["Sync:LocalSqliteConnectionString"] = "Data Source=:memory:",
        }).Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddChristMedicalSync(configuration);
        using var provider = services.BuildServiceProvider();

        var sync = provider.GetRequiredService<SyncService>();
        Assert.NotNull(sync);

        var opts = provider.GetRequiredService<IOptions<SyncServiceOptions>>().Value;
        Assert.Equal(7, opts.TenantId);
        Assert.Contains("Host=db", opts.PostgreSqlConnectionString, StringComparison.Ordinal);
    }
}
