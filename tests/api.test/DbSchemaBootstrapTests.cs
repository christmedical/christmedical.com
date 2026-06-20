using ChristMedical.WebAPI.Infrastructure;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class DbSchemaBootstrapTests
{
    [Fact]
    public void Schema_scripts_include_initial_patients_table_migration()
    {
        Assert.Contains("V1__Initial_Schema.sql", DbSchemaBootstrap.SchemaScriptNames);
    }
}
