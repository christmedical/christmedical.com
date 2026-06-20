using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class PostgresConnectionStringTests
{
    [Fact]
    public void Normalize_converts_postgresql_uri_to_npgsql_keywords()
    {
        const string uri =
            "postgresql://postgres:secret%40word@containers.railway.internal:5432/railway";

        var normalized = PostgresConnectionString.Normalize(uri);

        Assert.NotNull(normalized);
        Assert.Contains("Host=containers.railway.internal", normalized);
        Assert.Contains("Port=5432", normalized);
        Assert.Contains("Database=railway", normalized);
        Assert.Contains("Username=postgres", normalized);
        Assert.Contains("Password=secret@word", normalized);
        Assert.Contains("SSL Mode=Require", normalized);
    }

    [Fact]
    public void Normalize_leaves_keyword_connection_string_unchanged()
    {
        const string keyword =
            "Host=localhost;Port=5432;Database=christ_medical;Username=postgres;Password=password";

        Assert.Equal(keyword, PostgresConnectionString.Normalize(keyword));
    }
}
