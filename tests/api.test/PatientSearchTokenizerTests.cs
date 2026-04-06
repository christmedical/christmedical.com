using ChristMedical.WebAPI.Utilities;
using Xunit;

namespace ChristMedical.Api.Test;

public sealed class PatientSearchTokenizerTests
{
    [Fact]
    public void Tokenize_Empty_Returns_Empty()
    {
        Assert.Empty(PatientSearchTokenizer.Tokenize(null));
        Assert.Empty(PatientSearchTokenizer.Tokenize(""));
        Assert.Empty(PatientSearchTokenizer.Tokenize("   "));
    }

    [Fact]
    public void Tokenize_Single_Word_Lowercases()
    {
        var t = PatientSearchTokenizer.Tokenize("  Jon  ");
        Assert.Single(t);
        Assert.Equal("jon", t[0]);
    }

    [Fact]
    public void Tokenize_Two_Words_Takes_First_Pair_Ignores_Rest()
    {
        var t = PatientSearchTokenizer.Tokenize("John Quincy Adams");
        Assert.Equal(2, t.Count);
        Assert.Equal("john", t[0]);
        Assert.Equal("quincy", t[1]);
    }
}
