using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EtlTool.Models.Staging
{
    [Table("patients", Schema = "staging")]
    public class StagingPatient
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("last name")]
        public string? LastName { get; set; }

        [Column("first name")]
        public string? FirstName { get; set; }

        [Column("home phone")]
        public string? HomePhone { get; set; }

        [Column("mobile phone")]
        public string? MobilePhone { get; set; }

        [Column("personalnotes")]
        public string? PersonalNotes { get; set; }

        [Column("church")]
        public string? Church { get; set; }

        [Column("hope")]
        public bool? Hope { get; set; }

        [Column("dob")]
        public DateTime? Dob { get; set; }

        [Column("ssno")]
        public string? SsNo { get; set; }

        [Column("allergies")]
        public string? Allergies { get; set; }

        [Column("medhist")]
        public string? MedHist { get; set; }

        [Column("surgeries")]
        public string? Surgeries { get; set; }

        [Column("maritalstatus")]
        public string? MaritalStatus { get; set; }

        [Column("smoke")]
        public bool? Smoke { get; set; }

        [Column("alcohol")]
        public bool? Alcohol { get; set; }

        [Column("famhist")]
        public string? FamHist { get; set; }

        [Column("gender")]
        public string? Gender { get; set; }

        [Column("gyng")]
        public int? GynG { get; set; }

        [Column("gynp")]
        public int? GynP { get; set; }

        [Column("age")]
        public int? Age { get; set; }

        [Column("spanish only")]
        public bool? SpanishOnly { get; set; }

        [Column("ptupdatedon")]
        public DateTime? PtUpdatedOn { get; set; }

        [Column("ptimage")]
        public byte[]? PtImage { get; set; }

        [Column("ptimage2")]
        public string? PtImage2 { get; set; }

        [Column("wherelive")]
        public string? WhereLive { get; set; }

        [Column("infonotes")]
        public string? InfoNotes { get; set; }

        [Column("heardgospel")]
        public DateTime? HeardGospel { get; set; }

        [Column("suffix")]
        public string? Suffix { get; set; }

        [Column("lastreaders")]
        public string? LastReaders { get; set; }

        [Column("patienttype")]
        public string? PatientType { get; set; }

        [Column("pttype")]
        public string? PtType { get; set; }
    }
}