using EtlTool.Mapping;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class ClinicalParseTests
{
    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData(" hi ", "hi")]
    public void CleanString_Normalizes(string? input, string? expected) =>
        Assert.Equal(expected, ClinicalParse.CleanString(input));

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("-1", true)]
    [InlineData("1", true)]
    [InlineData("true", true)]
    [InlineData("TRUE", true)]
    [InlineData("0", false)]
    [InlineData("2", false)]
    public void ParseBool_Parses_Access_Style(string? input, bool expected) =>
        Assert.Equal(expected, ClinicalParse.ParseBool(input));

    [Fact]
    public void ParseDateUtc_Returns_Null_For_Access_Sentinel()
    {
        Assert.Null(ClinicalParse.ParseDateUtc("01/00/00 00:00:00"));
        Assert.Null(ClinicalParse.ParseDateUtc("  01/00/00 00:00:00 extra "));
    }

    [Fact]
    public void ParseDateUtc_Parses_Invariant()
    {
        var dt = ClinicalParse.ParseDateUtc("2024-06-15");
        Assert.NotNull(dt);
        Assert.Equal(DateTimeKind.Utc, dt.Value.Kind);
    }
}
