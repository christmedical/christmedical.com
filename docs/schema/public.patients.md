# public.patients

## Description

Mission patient chart (tenant-scoped).

## Labels

`clinical`

## Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
| ---- | ---- | ------- | -------- | -------- | ------- | ------- |
| alcohol | boolean | false | true |  |  |  |
| calculated_age | integer |  | true |  |  |  |
| client_updated_at | timestamp with time zone | CURRENT_TIMESTAMP | true |  |  |  |
| device_id | varchar(50) |  | true |  |  |  |
| display_id | varchar(50) |  | true |  |  |  |
| dob | date |  | true |  |  |  |
| drug_allergies | text |  | true |  |  |  |
| family_history | text |  | true |  |  |  |
| first_name | varchar(100) |  | true |  |  |  |
| first_name_phonetic | varchar(32) |  | true |  |  |  |
| gender | varchar(10) |  | true |  |  |  |
| gov_id | varchar(50) |  | true |  |  |  |
| heard_gospel_date | date |  | true |  |  | Date the patient heard the gospel (from legacy heardgospel). |
| home_phone | varchar(30) |  | true |  |  |  |
| hope_gospel | boolean | false | true |  |  |  |
| id | uuid | gen_random_uuid() | false | [public.patients](public.patients.md) [public.visits](public.visits.md) |  |  |
| is_deleted | boolean | false | true |  |  |  |
| last_name | varchar(100) |  | true |  |  |  |
| last_name_phonetic | varchar(32) |  | true |  |  |  |
| legacy_id | varchar(50) |  | true |  |  |  |
| marital_status | varchar(50) |  | true |  |  |  |
| medical_history | text |  | true |  |  |  |
| mobile_phone | varchar(30) |  | true |  |  |  |
| next_of_kin_id | uuid |  | true |  | [public.patients](public.patients.md) |  |
| server_restored_at | timestamp with time zone |  | true |  |  |  |
| smoke | boolean | false | true |  |  |  |
| spiritual_notes | text |  | true |  |  | Free-text spiritual check-up notes (church, personal notes, hope, etc.). |
| surgical_history | text |  | true |  |  |  |
| tenant_id | smallint | 1 | false |  |  |  |

## Constraints

| Name | Type | Definition |
| ---- | ---- | ---------- |
| patients_display_id_key | UNIQUE | UNIQUE (display_id) |
| patients_next_of_kin_id_fkey | FOREIGN KEY | FOREIGN KEY (next_of_kin_id) REFERENCES patients(id) |
| patients_pkey | PRIMARY KEY | PRIMARY KEY (id) |

## Indexes

| Name | Definition |
| ---- | ---------- |
| patients_display_id_key | CREATE UNIQUE INDEX patients_display_id_key ON public.patients USING btree (display_id) |
| patients_pkey | CREATE UNIQUE INDEX patients_pkey ON public.patients USING btree (id) |

## Relations

```mermaid
erDiagram

"public.patients" }o--o| "public.patients" : "FOREIGN KEY (next_of_kin_id) REFERENCES patients(id)"
"public.visits" }o--o| "public.patients" : "FOREIGN KEY (patient_id) REFERENCES patients(id)"
"public.lab_results" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.treatments" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.vitals_core" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.visits" }o--o| "public.trips" : "FOREIGN KEY (trip_id) REFERENCES trips(id)"

"public.patients" {
  boolean alcohol ""
  integer calculated_age ""
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  varchar_50_ display_id ""
  date dob ""
  text drug_allergies ""
  text family_history ""
  varchar_100_ first_name ""
  varchar_32_ first_name_phonetic ""
  varchar_10_ gender ""
  varchar_50_ gov_id ""
  date heard_gospel_date "Date the patient heard the gospel (from legacy heardgospel)."
  varchar_30_ home_phone ""
  boolean hope_gospel ""
  uuid id ""
  boolean is_deleted ""
  varchar_100_ last_name ""
  varchar_32_ last_name_phonetic ""
  varchar_50_ legacy_id ""
  varchar_50_ marital_status ""
  text medical_history ""
  varchar_30_ mobile_phone ""
  uuid next_of_kin_id FK ""
  timestamp_with_time_zone server_restored_at ""
  boolean smoke ""
  text spiritual_notes "Free-text spiritual check-up notes (church, personal notes, hope, etc.)."
  text surgical_history ""
  smallint tenant_id ""
}
"public.visits" {
  text chief_complaint ""
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  text diagnosis_text ""
  uuid id ""
  boolean is_deleted ""
  varchar_255_ location_name ""
  uuid patient_id FK ""
  text referral_notes ""
  timestamp_with_time_zone server_restored_at ""
  smallint tenant_id ""
  uuid trip_id FK ""
  timestamp_with_time_zone visit_date ""
}
"public.lab_results" {
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  uuid id ""
  boolean is_deleted ""
  varchar_255_ result_value ""
  timestamp_with_time_zone server_restored_at ""
  smallint tenant_id ""
  varchar_100_ test_name ""
  uuid visit_id FK ""
}
"public.treatments" {
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  text general_notes ""
  uuid id ""
  boolean is_deleted ""
  boolean is_flagged ""
  varchar_255_ provider_name ""
  timestamp_with_time_zone server_restored_at ""
  varchar_50_ type ""
  uuid visit_id FK ""
}
"public.vitals_core" {
  varchar_20_ bp ""
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  numeric_6_2_ glucose ""
  numeric_5_2_ height ""
  numeric_4_1_ hemoglobin ""
  uuid id ""
  boolean is_deleted ""
  integer oxygen_sat ""
  integer pulse ""
  integer resp ""
  timestamp_with_time_zone server_restored_at ""
  numeric_4_1_ temp_f ""
  smallint tenant_id ""
  uuid visit_id FK ""
  numeric_5_2_ weight ""
}
"public.trips" {
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  date end_date ""
  uuid id ""
  boolean is_deleted ""
  varchar_255_ name ""
  timestamp_with_time_zone server_restored_at ""
  date start_date ""
  varchar_20_ status ""
}
```

---

> Generated by [tbls](https://github.com/k1LoW/tbls)
