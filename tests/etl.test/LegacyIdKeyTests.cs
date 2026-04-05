using EtlTool;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class LegacyIdKeyTests
{
    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("   ", "")]
    [InlineData("  abc  ", "abc")]
    public void Normalize_Trims_And_Nulls_To_Empty(string? input, string expected) =>
        Assert.Equal(expected, LegacyIdKey.Normalize(input));
}
