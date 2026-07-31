using ChristMedical.WebAPI.Infrastructure;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class HubAdminSeederTests
{
    [Fact]
    public void TryReadOptions_returns_null_when_email_or_password_missing()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["HUB_ADMIN_EMAIL"] = "admin@clinic.local",
            })
            .Build();

        Assert.Null(HubAdminSeeder.TryReadOptions(config));
    }

    [Fact]
    public void TryReadOptions_reads_defaults_for_optional_fields()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["HUB_ADMIN_EMAIL"] = " admin@clinic.local ",
                ["HUB_ADMIN_PASSWORD"] = "ChangeMeNow!",
            })
            .Build();

        var options = HubAdminSeeder.TryReadOptions(config);

        Assert.NotNull(options);
        Assert.Equal("admin@clinic.local", options!.Email);
        Assert.Equal("ChangeMeNow!", options.Password);
        Assert.Equal("Admin", options.FirstName);
        Assert.Equal("User", options.LastName);
        Assert.Equal((short)1, options.TenantId);
        Assert.Equal("admin", options.Role);
    }

    [Fact]
    public void TryReadOptions_honors_explicit_tenant_and_names()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["HUB_ADMIN_EMAIL"] = "server@mission.org",
                ["HUB_ADMIN_PASSWORD"] = "secret",
                ["HUB_ADMIN_FIRST_NAME"] = "Server",
                ["HUB_ADMIN_LAST_NAME"] = "Person",
                ["HUB_TENANT_ID"] = "3",
                ["HUB_ADMIN_ROLE"] = "admin",
            })
            .Build();

        var options = HubAdminSeeder.TryReadOptions(config);

        Assert.NotNull(options);
        Assert.Equal("Server", options!.FirstName);
        Assert.Equal("Person", options.LastName);
        Assert.Equal((short)3, options.TenantId);
    }
}
