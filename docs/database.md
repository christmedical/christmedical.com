---
title: Christ Medical Legacy (Staging Schema)
---

erDiagram
%% Legend for clarity on data type icons used below
LEGEND {
PK Primary_Key
SK Surrogate_Key
FK Foreign_Key_Unenforced
idx Indexed_Column
}

    "categories-meds" {
        integer categoryid PK "idx"
        varchar category
        varchar type
    }

    "diagnosis" {
        integer dxid PK
        varchar dx_code "idx, FK_uneforced"
        varchar category
        varchar diagnosis
    }

    "dosestrength" {
        varchar dosestrength PK
    }

    "locations" {
        varchar location
        varchar locdesc
    }

    "medications" {
        integer medlistid PK "idx"
        varchar medcode "idx"
        varchar medname
        varchar category
        varchar mednamealt
        varchar strength
        boolean discontinued
    }

    "patients" {
        integer id PK "idx_unique"
        varchar last_name
        varchar first_name
        varchar home_phone
        varchar mobile_phone
        text personalnotes
        varchar church
        boolean hope
        date dob
        varchar ssno "comment"
        text allergies "comment"
        text medhist "comment"
        text surgeries "comment"
        varchar maritalstatus "comment"
        boolean smoke "comment"
        boolean alcohol "comment"
        text famhist "comment"
        varchar gender "comment"
        integer gyng "comment"
        integer gynp "comment"
        integer age
        boolean spanish_only
        timestamp ptupdatedon
        bytea ptimage
        unknown ptimage2 "idx_unique"
        varchar wherelive
        varchar infonotes
        date heardgospel
        varchar suffix
        varchar lastreaders
        unknown patienttype "idx_unique, FK_uneforced"
        varchar pttype
    }

    "patienttypes" {
        integer id PK
        varchar patienttype
    }

    "visits_chiro" {
        integer chiroid PK
        integer visitid "idx, FK_uneforced"
        integer patientid "idx, FK_uneforced"
        boolean head
        boolean cervical
        boolean thoracic
        boolean lumbar
        boolean hand
        boolean elbow
        boolean shoulder
        boolean leg
        boolean knee
        boolean foot
        boolean painhead
        boolean painneck
        boolean painupback
        boolean painlwrback
        boolean painhand
        boolean painelbow
        boolean painshoulder
        boolean painleg
        boolean painknee
        boolean painfoot
        boolean osteoarthritis
        boolean musclespasm
        boolean jointdysfunction
        boolean sprainstrain
        boolean adjustment
        boolean massage
        boolean topicalanalgesic
        boolean therapyrehab
        boolean support
        text chironote
        boolean subluxation
        timestamp chiroupdatedon
    }

    "visits_dx" {
        integer visitdxid PK "idx"
        integer visitid "idx, FK_uneforced"
        varchar dxcode "idx, FK_uneforced"
        varchar addlinfo
        timestamp dxupdatedon
    }

    "visits_eye" {
        integer eyeid PK
        boolean field1
        integer patientid "idx, FK_uneforced"
        integer visitid "idx, FK_uneforced"
        varchar va_l
        varchar va_r
        varchar tonr
        varchar tonl
        varchar impression
        varchar plan
        varchar readnear
        varchar readdist
        varchar eom
        varchar pupils
        varchar ar_r
        varchar ar_l
        varchar va
        varchar l
        timestamp eyeupdatedon
        boolean cataracts
        boolean dryeyes
        boolean glaucoma
        boolean ptergium
        varchar other
        timestamp readersgivendate
        varchar readersgivenstrength
    }

    "visits_gen" {
        integer genid PK
        integer patientid "idx, FK_uneforced"
        date datevisit
        double_precision height
        double_precision weight
        double_precision pulse
        varchar bp
        double_precision resp
        varchar temp
        double_precision glucoseblood
        double_precision hemoglobin
        text diagnosis
        text referral
        varchar bloodh
        varchar bloodn
        varchar urobilin
        varchar bilirubin
        varchar protein
        varchar nitrite
        varchar ketones
        varchar ascorbic
        varchar glucoseurine
        varchar ph
        varchar spgrav
        varchar leuk
        varchar pregtest
        boolean md
        boolean eye
        boolean gyn
        boolean ch
        boolean dnt
        timestamp genupdatedon
        varchar location "FK_uneforced"
        varchar oxygen
    }

    "visits_gyn" {
        integer gynid PK
        integer visitid "idx, FK_uneforced"
        integer patientid "idx, FK_uneforced"
        varchar mam
        varchar pap
        varchar lmp
        text gynnotes
        timestamp gynupdatedon
    }

    "visits_rx" {
        integer rxid PK
        integer visitid "idx, FK_uneforced"
        integer medid "idx, FK_uneforced"
        varchar directions
        varchar dose
        boolean dnd "comment"
        timestamp rxupdatedon
    }

    %% Relationships (Implied, unenforced in staging)
    "patients" ||--o{ "visits_gen" : "Implied Patient->Visit"
    "patients" |o--o| "patienttypes" : "Implied PT_Type"
    "medications" ||--o{ "visits_rx" : "Implied Med_Lookup"
    "diagnosis" ||--o{ "visits_dx" : "Implied Dx_Lookup"
    "visits_gen" |o--o| "visits_chiro" : "Implied Chiro_Visit"
    "visits_gen" |o--o| "visits_eye" : "Implied Eye_Visit"
    "visits_gen" |o--o| "visits_gyn" : "Implied Gyn_Visit"
    "visits_gen" |o--o| "visits_dx" : "Implied Dx_Entry"
    "visits_gen" |o--o| "visits_rx" : "Implied Rx_Entry"
