using EtlTool.Configuration;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class JsonBoolTests
{
    [Theory]
    [InlineData(null, false, false)]
    [InlineData("", true, true)]
    [InlineData("  ", false, false)]
    [InlineData("yes", false, true)]
    [InlineData("YES", true, true)]
    [InlineData("true", false, true)]
    [InlineData("1", false, true)]
    [InlineData("y", false, true)]
    [InlineData("no", true, false)]
    [InlineData("false", true, false)]
    [InlineData("0", true, false)]
    [InlineData("garbage", true, true)]
    [InlineData("garbage", false, false)]
    public void Parse_Respects_Default_And_Keywords(string? raw, bool defaultValue, bool expected) =>
        Assert.Equal(expected, JsonBool.Parse(raw, defaultValue));
}
