FROM postgres:16-alpine

# Demo DB image: schema + seed data.
# The compose demo override mounts /var/lib/postgresql/data as tmpfs, so data is ephemeral.

COPY conversion/etl/V1__Initial_Schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY conversion/etl/V2__Inital_Staging_Schema.sql /docker-entrypoint-initdb.d/02_staging.sql
COPY conversion/etl/V4__Patients_spiritual.sql /docker-entrypoint-initdb.d/04_patients_spiritual.sql
COPY conversion/etl/V5__Clinical_auxiliary.sql /docker-entrypoint-initdb.d/05_clinical_aux.sql
COPY conversion/etl/V6__patients_phonetic.sql /docker-entrypoint-initdb.d/06_patients_phonetic.sql

COPY demo/db/99_demo_seed.sql /docker-entrypoint-initdb.d/99_demo_seed.sql

