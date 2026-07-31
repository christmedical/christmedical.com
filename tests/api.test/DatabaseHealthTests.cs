using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class DatabaseHealthTests
{
    [Fact]
    public async Task CheckAsync_fails_when_connection_string_missing()
    {
        var (ok, error) = await DatabaseHealth.CheckAsync(null);

        Assert.False(ok);
        Assert.Contains("DefaultConnection", error);
    }

    [Fact]
    public async Task CheckAsync_fails_when_connection_string_blank()
    {
        var (ok, error) = await DatabaseHealth.CheckAsync("   ");

        Assert.False(ok);
        Assert.NotNull(error);
    }
}
