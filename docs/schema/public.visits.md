# public.visits

## Labels

`clinical`

## Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
| ---- | ---- | ------- | -------- | -------- | ------- | ------- |
| chief_complaint | text |  | true |  |  |  |
| client_updated_at | timestamp with time zone | CURRENT_TIMESTAMP | true |  |  |  |
| device_id | varchar(50) |  | true |  |  |  |
| diagnosis_text | text |  | true |  |  |  |
| id | uuid | gen_random_uuid() | false | [public.lab_results](public.lab_results.md) [public.treatments](public.treatments.md) [public.vitals_core](public.vitals_core.md) |  |  |
| is_deleted | boolean | false | true |  |  |  |
| location_name | varchar(255) |  | true |  |  |  |
| patient_id | uuid |  | true |  | [public.patients](public.patients.md) |  |
| referral_notes | text |  | true |  |  |  |
| server_restored_at | timestamp with time zone |  | true |  |  |  |
| tenant_id | smallint | 1 | false |  |  |  |
| trip_id | uuid |  | true |  | [public.trips](public.trips.md) |  |
| visit_date | timestamp with time zone | CURRENT_TIMESTAMP | true |  |  |  |

## Constraints

| Name | Type | Definition |
| ---- | ---- | ---------- |
| visits_patient_id_fkey | FOREIGN KEY | FOREIGN KEY (patient_id) REFERENCES patients(id) |
| visits_pkey | PRIMARY KEY | PRIMARY KEY (id) |
| visits_trip_id_fkey | FOREIGN KEY | FOREIGN KEY (trip_id) REFERENCES trips(id) |

## Indexes

| Name | Definition |
| ---- | ---------- |
| visits_pkey | CREATE UNIQUE INDEX visits_pkey ON public.visits USING btree (id) |

## Relations

```mermaid
erDiagram

"public.lab_results" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.treatments" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.prescriptions" }o--o| "public.treatments" : "FOREIGN KEY (treatment_id) REFERENCES treatments(id)"
"public.procedure_details" }o--o| "public.treatments" : "FOREIGN KEY (treatment_id) REFERENCES treatments(id)"
"public.vitals_core" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.visits" }o--o| "public.patients" : "FOREIGN KEY (patient_id) REFERENCES patients(id)"
"public.patients" }o--o| "public.patients" : "FOREIGN KEY (next_of_kin_id) REFERENCES patients(id)"
"public.visits" }o--o| "public.trips" : "FOREIGN KEY (trip_id) REFERENCES trips(id)"

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
"public.prescriptions" {
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  text directions ""
  varchar_255_ dose ""
  uuid id ""
  boolean is_deleted ""
  varchar_255_ medication_name ""
  integer quantity ""
  timestamp_with_time_zone server_restored_at ""
  varchar_50_ status ""
  uuid treatment_id FK ""
}
"public.procedure_details" {
  timestamp_with_time_zone client_updated_at ""
  varchar_50_ device_id ""
  uuid id ""
  boolean is_deleted ""
  jsonb metadata ""
  timestamp_with_time_zone server_restored_at ""
  uuid treatment_id FK ""
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
