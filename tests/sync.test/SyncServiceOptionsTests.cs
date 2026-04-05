using Xunit;

namespace ChristMedical.Sync.Test;

public sealed class SyncServiceOptionsTests
{
    [Fact]
    public void Defaults_Are_Sensible()
    {
        var o = new SyncServiceOptions();
        Assert.Equal(1, o.TenantId);
        Assert.Equal(5432, o.ReachabilityPort);
        Assert.Equal(3000, o.ReachabilityTimeoutMs);
        Assert.Contains("sqlite", o.LocalSqliteConnectionString, StringComparison.OrdinalIgnoreCase);
    }
}
