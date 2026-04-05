namespace EtlTool.Models.Staging;

/// <summary>
/// Mirrors staging.visits_gen.
/// After a fresh extraction, the V2 schema scrubs ALL Access types to TEXT, so
/// every property here is string? — consistent with StagingPatient.
/// VisitMapper is responsible for parsing each field to its target type.
/// </summary>
public class StagingVisit
{
    // --- Identity ---
    public string? GenId { get; set; }
    public string? PatientId { get; set; }

    // --- Visit core ---
    public string? DateVisit { get; set; }

    // --- Vitals (all TEXT in staging) ---
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? Pulse { get; set; }
    public string? Bp { get; set; }   // e.g. "120/80"
    public string? Resp { get; set; }
    public string? Temp { get; set; }
    public string? GlucoseBlood { get; set; }
    public string? Hemoglobin { get; set; }
    public string? Oxygen { get; set; }

    // --- Clinical text ---
    public string? Diagnosis { get; set; }
    public string? Referral { get; set; }

    // --- Urinalysis / lab panels (varchar result codes in staging) ---
    public string? BloodH { get; set; }
    public string? BloodN { get; set; }
    public string? Urobilin { get; set; }
    public string? Bilirubin { get; set; }
    public string? Protein { get; set; }
    public string? Nitrite { get; set; }
    public string? Ketones { get; set; }
    public string? Ascorbic { get; set; }
    public string? GlucoseUrine { get; set; }
    public string? Ph { get; set; }
    public string? SpGrav { get; set; }
    public string? Leuk { get; set; }
    public string? PregTest { get; set; }

    // --- Specialist referral flags (Access -1/0 booleans, stored as TEXT) ---
    public string? Md { get; set; }
    public string? Eye { get; set; }
    public string? Gyn { get; set; }
    public string? Ch { get; set; }
    public string? Dnt { get; set; }

    // --- Audit ---
    public string? GenUpdatedOn { get; set; }
    public string? Location { get; set; }
}
