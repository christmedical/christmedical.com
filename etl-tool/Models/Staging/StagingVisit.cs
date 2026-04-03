namespace EtlTool.Models.Staging;

/// <summary>
/// Mirrors staging.visits_gen using the actual column types present in the database.
/// NOTE: The V2 SQL file claims all columns are TEXT, but the loader preserved native
/// types for numeric and boolean columns. Types here are sourced from \d staging.visits_gen.
/// </summary>
public class StagingVisit
{
    // --- Identity ---
    public string?   GenId      { get; set; }   // text
    public string?   PatientId  { get; set; }   // text  — maps to public.patients.legacy_id

    // --- Visit core ---
    public string?   DateVisit  { get; set; }   // text  — parsed by VisitMapper

    // --- Vitals (mixed types as loaded) ---
    public string?   Height     { get; set; }   // text
    public string?   Weight     { get; set; }   // text
    public double?   Pulse      { get; set; }   // double precision
    public string?   Bp         { get; set; }   // varchar(255) e.g. "120/80"
    public double?   Resp       { get; set; }   // double precision
    public string?   Temp       { get; set; }   // text
    public double?   GlucoseBlood  { get; set; }  // double precision
    public double?   Hemoglobin    { get; set; }  // double precision
    public string?   Oxygen        { get; set; }  // varchar(255)

    // --- Clinical text ---
    public string?   Diagnosis  { get; set; }   // text
    public string?   Referral   { get; set; }   // text

    // --- Urinalysis / Lab panels (varchar(5) result codes) ---
    public string?   BloodH      { get; set; }
    public string?   BloodN      { get; set; }
    public string?   Urobilin    { get; set; }
    public string?   Bilirubin   { get; set; }
    public string?   Protein     { get; set; }
    public string?   Nitrite     { get; set; }
    public string?   Ketones     { get; set; }
    public string?   Ascorbic    { get; set; }
    public string?   GlucoseUrine { get; set; }
    public string?   Ph          { get; set; }
    public string?   SpGrav      { get; set; }
    public string?   Leuk        { get; set; }
    public string?   PregTest    { get; set; }  // text

    // --- Specialist referral flags (boolean as loaded) ---
    public bool?     Md  { get; set; }
    public bool?     Eye { get; set; }
    public bool?     Gyn { get; set; }
    public bool?     Ch  { get; set; }
    public bool?     Dnt { get; set; }

    // --- Audit ---
    public DateTime? GenUpdatedOn { get; set; }  // timestamp without time zone
    public string?   Location     { get; set; }  // text
}
