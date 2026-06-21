# christ_medical

## Description

Auto-generated from the live PostgreSQL `public` schema after API bootstrap migrations.  
Design reference (hand-maintained target model): docs/DATABASE_MODEL.md  


## Tables

| Name | Columns | Comment | Type | Labels |
| ---- | ------- | ------- | ---- | ------ |
| [public.feedback](public.feedback.md) | 11 | Early-reviewer UI feedback pins; standalone from clinical data. | BASE TABLE | `feedback` |
| [public.feedback_reviewer_prefs](public.feedback_reviewer_prefs.md) | 4 | Owner-controlled allowlist for who may use the in-app feedback widget. | BASE TABLE | `feedback` |
| [public.lab_results](public.lab_results.md) | 9 |  | BASE TABLE | `clinical` |
| [public.patients](public.patients.md) | 29 | Mission patient chart (tenant-scoped). | BASE TABLE | `clinical` |
| [public.prescriptions](public.prescriptions.md) | 11 |  | BASE TABLE | `clinical` |
| [public.procedure_details](public.procedure_details.md) | 7 |  | BASE TABLE | `clinical` |
| [public.tenants](public.tenants.md) | 7 | Mission/clinic registry; subdomain slug maps to tenants.slug. | BASE TABLE | `auth` |
| [public.treatments](public.treatments.md) | 10 |  | BASE TABLE | `clinical` |
| [public.trips](public.trips.md) | 9 |  | BASE TABLE | `clinical` |
| [public.user_tenant_memberships](public.user_tenant_memberships.md) | 3 | Users may belong to multiple tenants; JWT carries one active tenant per session. | BASE TABLE | `auth` |
| [public.users](public.users.md) | 8 |  | BASE TABLE | `auth` |
| [public.visits](public.visits.md) | 13 |  | BASE TABLE | `clinical` |
| [public.vitals_core](public.vitals_core.md) | 16 |  | BASE TABLE | `clinical` |

## Relations

```mermaid
erDiagram

"public.lab_results" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.patients" }o--o| "public.patients" : "FOREIGN KEY (next_of_kin_id) REFERENCES patients(id)"
"public.prescriptions" }o--o| "public.treatments" : "FOREIGN KEY (treatment_id) REFERENCES treatments(id)"
"public.procedure_details" }o--o| "public.treatments" : "FOREIGN KEY (treatment_id) REFERENCES treatments(id)"
"public.treatments" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"
"public.user_tenant_memberships" }o--|| "public.tenants" : "FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE"
"public.user_tenant_memberships" }o--|| "public.users" : "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
"public.visits" }o--o| "public.trips" : "FOREIGN KEY (trip_id) REFERENCES trips(id)"
"public.visits" }o--o| "public.patients" : "FOREIGN KEY (patient_id) REFERENCES patients(id)"
"public.vitals_core" }o--o| "public.visits" : "FOREIGN KEY (visit_id) REFERENCES visits(id)"

"public.feedback" {
  timestamp_with_time_zone created_at ""
  uuid id ""
  text note ""
  text page_path ""
  real pin_x ""
  real pin_y ""
  text reviewer_label ""
  varchar_10_ status ""
  text user_agent ""
  integer viewport_h ""
  integer viewport_w ""
}
"public.feedback_reviewer_prefs" {
  varchar_120_ display_name ""
  varchar_256_ email ""
  boolean feedback_enabled ""
  timestamp_with_time_zone updated_at ""
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
"public.tenants" {
  timestamp_with_time_zone created_at ""
  smallint id ""
  boolean is_active ""
  varchar_120_ name ""
  varchar_40_ short_name ""
  varchar_63_ slug ""
  varchar_7_ theme_color_hex ""
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
"public.user_tenant_memberships" {
  varchar_20_ role ""
  smallint tenant_id FK ""
  uuid user_id FK ""
}
"public.users" {
  timestamp_with_time_zone created_at ""
  varchar_120_ display_name ""
  varchar_256_ email ""
  varchar_100_ first_name "Given name for sign-in accounts."
  uuid id ""
  boolean is_active ""
  varchar_100_ last_name "Family name for sign-in accounts."
  text password_hash ""
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
```

---

> Generated by [tbls](https://github.com/k1LoW/tbls)
