using EtlTool.Mapping;
using EtlTool.Models.Staging;
using Xunit;

namespace ChristMedical.Etl.Test;

public sealed class PatientMapperTests
{
    private const short TenantId = 7;
    private const string MigrationDevice = "MIGRATION_ETL";

    [Fact]
    public void Map_HappyPath_MapsFieldsAndTenant()
    {
        var src = new StagingPatient
        {
            Id = "LEG-42",
            FirstName = "  Maria ",
            LastName = "Garcia",
            Dob = "1990-03-15",
            Age = " 34 ",
            Gender = "F",
            MaritalStatus = "Married",
            SsNo = " 123-45-6789 ",
            MedHist = "DM",
            Surgeries = "Appendix",
            FamHist = "HTN",
            Allergies = "Penicillin",
            Smoke = "-1",
            Alcohol = "0",
            Hope = "1",
            HeardGospel = "2024-01-10",
            HomePhone = "(501) 555-0100",
            MobilePhone = "501-555-0101",
        };

        var patient = PatientMapper.Map(src, TenantId);

        Assert.NotEqual(Guid.Empty, patient.Id);
        Assert.Equal(TenantId, patient.TenantId);
        Assert.Equal("LEG-42", patient.LegacyId);
        Assert.Equal("Maria", patient.FirstName);
        Assert.Equal("Garcia", patient.LastName);
        Assert.Equal(new DateTime(1990, 3, 15), patient.Dob);
        Assert.Equal(34, patient.CalculatedAge);
        Assert.Equal("F", patient.Gender);
        Assert.Equal("Married", patient.MaritalStatus);
        Assert.Equal("123-45-6789", patient.GovId);
        Assert.Null(patient.NextOfKinId);
        Assert.Equal("DM", patient.MedicalHistory);
        Assert.Equal("Appendix", patient.SurgicalHistory);
        Assert.Equal("HTN", patient.FamilyHistory);
        Assert.Equal("Penicillin", patient.DrugAllergies);
        Assert.True(patient.Smoke);
        Assert.False(patient.Alcohol);
        Assert.True(patient.HopeGospel);
        Assert.Equal(new DateTime(2024, 1, 10), patient.HeardGospelDate);
        Assert.Equal("(501)555-0100", patient.HomePhone);
        Assert.Equal("501-555-0101", patient.MobilePhone);
        Assert.Equal(MigrationDevice, patient.DeviceId);
        Assert.False(patient.IsDeleted);
        Assert.Null(patient.ServerRestoredAt);
        Assert.True(patient.ClientUpdatedAt <= DateTime.UtcNow);
        Assert.True(patient.ClientUpdatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("01/00/00 00:00:00")]
    [InlineData("not-a-date")]
    public void Map_Dob_NullOrUnparseable_BecomesNull(string? dob)
    {
        var src = MinimalPatient();
        src.Dob = dob;

        Assert.Null(PatientMapper.Map(src, TenantId).Dob);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("  ", null)]
    [InlineData("abc", null)]
    [InlineData("12", 12)]
    public void Map_Age_ParseOrNull(string? age, int? expected)
    {
        var src = MinimalPatient();
        src.Age = age;

        Assert.Equal(expected, PatientMapper.Map(src, TenantId).CalculatedAge);
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("-1", true)]
    [InlineData("1", true)]
    [InlineData("true", true)]
    [InlineData("0", false)]
    public void Map_BoolFields_FollowAccessStyle(string? raw, bool expected)
    {
        var src = MinimalPatient();
        src.Smoke = raw;
        src.Alcohol = raw;
        src.Hope = raw;

        var patient = PatientMapper.Map(src, TenantId);
        Assert.Equal(expected, patient.Smoke);
        Assert.Equal(expected, patient.Alcohol);
        Assert.Equal(expected, patient.HopeGospel);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData("hello", "hello")]
    public void Map_StringFields_TrimOrNull(string? raw, string? expected)
    {
        var src = MinimalPatient();
        src.FirstName = raw;

        Assert.Equal(expected, PatientMapper.Map(src, TenantId).FirstName);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("   ", null)]
    [InlineData("(501) 555!0100 ext", "(501)5550100")]
    public void Map_Phone_StripsDisallowedChars(string? raw, string? expected)
    {
        var src = MinimalPatient();
        src.HomePhone = raw;

        Assert.Equal(expected, PatientMapper.Map(src, TenantId).HomePhone);
    }

    [Fact]
    public void Map_SpiritualNotes_CombinesNonBlankParts()
    {
        var src = MinimalPatient();
        src.Church = "Belize City Baptist";
        src.Hope = "1";
        src.PersonalNotes = "Prayed with family";
        src.InfoNotes = "Returning next trip";

        var notes = PatientMapper.Map(src, TenantId).SpiritualNotes;

        Assert.Contains("Church: Belize City Baptist", notes);
        Assert.Contains("Hope field: 1", notes);
        Assert.Contains("Personal notes: Prayed with family", notes);
        Assert.Contains("Info notes: Returning next trip", notes);
    }

    [Fact]
    public void Map_SpiritualNotes_AllBlank_ReturnsNull()
    {
        var src = MinimalPatient();
        src.Church = "  ";
        src.Hope = null;
        src.PersonalNotes = "";
        src.InfoNotes = null;

        Assert.Null(PatientMapper.Map(src, TenantId).SpiritualNotes);
    }

    private static StagingPatient MinimalPatient() => new()
    {
        Id = "p-min",
        FirstName = "A",
        LastName = "B",
    };
}
