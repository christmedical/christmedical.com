using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class CorsOriginsTests
{
    [Fact]
    public void Parse_default_includes_production_domains()
    {
        var origins = CorsOrigins.Parse(null);

        Assert.Contains("https://www.christmedical.com", origins);
        Assert.Contains("https://christmedical.com", origins);
        Assert.Contains("http://localhost:3000", origins);
    }

    [Fact]
    public void Parse_custom_list_trims_entries()
    {
        var origins = CorsOrigins.Parse(" https://example.com , https://other.test ");

        Assert.Equal(["https://example.com", "https://other.test"], origins);
    }
}
