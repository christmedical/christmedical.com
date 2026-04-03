using System.Globalization;
using System.Text.RegularExpressions;
using EtlTool.Models.Production;
using EtlTool.Models.Staging;

namespace EtlTool.Mapping;

public static class PatientMapper
{
    // Retains only the characters explicitly allowed for phone numbers.
    private static readonly Regex PhoneAllowedChars =
        new(@"[^+0-9()\-]", RegexOptions.Compiled);

    // The sentinel value Access exports for a null/zero date.
    private const string AccessNullDate = "01/00/00 00:00:00";

    public static Patient Map(StagingPatient src)
    {
        return new Patient
        {
            Id               = Guid.NewGuid(),
            LegacyId         = src.Id,
            FirstName        = CleanString(src.FirstName),
            LastName         = CleanString(src.LastName),
            Dob              = ParseDate(src.Dob),
            CalculatedAge    = int.TryParse(src.Age?.Trim(), out int age) ? age : null,
            Gender           = CleanString(src.Gender),
            MaritalStatus    = CleanString(src.MaritalStatus),
            GovId            = CleanString(src.SsNo),
            NextOfKinId      = null,
            MedicalHistory   = CleanString(src.MedHist),
            SurgicalHistory  = CleanString(src.Surgeries),
            FamilyHistory    = CleanString(src.FamHist),
            DrugAllergies    = CleanString(src.Allergies),
            Smoke            = ParseBool(src.Smoke),
            Alcohol          = ParseBool(src.Alcohol),
            HopeGospel       = ParseBool(src.Hope),
            HomePhone        = CleanPhone(src.HomePhone),
            MobilePhone      = CleanPhone(src.MobilePhone),
            DeviceId         = "MIGRATION_ETL",
            ClientUpdatedAt  = DateTime.UtcNow,
            ServerRestoredAt = null,
            IsDeleted        = false,
        };
    }

    /// <summary>
    /// Returns null when the value is the Access null-date sentinel, empty, or unparseable.
    /// </summary>
    private static DateTime? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var trimmed = value.Trim();

        if (trimmed.StartsWith(AccessNullDate, StringComparison.OrdinalIgnoreCase))
            return null;

        return DateTime.TryParse(trimmed, CultureInfo.InvariantCulture,
            DateTimeStyles.AllowWhiteSpaces, out DateTime dt)
            ? dt
            : null;
    }

    /// <summary>
    /// Maps Access boolean export values to bool.
    /// Truthy  : "-1", "1", "true"
    /// Falsy   : "0", "false", "", or null
    /// </summary>
    private static bool ParseBool(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;

        return value.Trim().ToLowerInvariant() switch
        {
            "-1" or "1" or "true" => true,
            _                     => false,
        };
    }

    /// <summary>
    /// Trims the value and converts an empty result to null.
    /// </summary>
    private static string? CleanString(string? value)
    {
        if (value is null) return null;
        var trimmed = value.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }

    /// <summary>
    /// Strips every character not in the set +0-9()-  from the phone string.
    /// </summary>
    private static string? CleanPhone(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var cleaned = PhoneAllowedChars.Replace(value, string.Empty).Trim();
        return cleaned.Length == 0 ? null : cleaned;
    }
}
