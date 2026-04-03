-- ---------------------------------------------------------
-- Christ Medical: Total Schema Reset
-- ---------------------------------------------------------

DROP TABLE IF EXISTS "Categories" CASCADE;
DROP TABLE IF EXISTS "Diagnosis" CASCADE;
DROP TABLE IF EXISTS "DoseStrength" CASCADE;
DROP TABLE IF EXISTS "Locations" CASCADE;
DROP TABLE IF EXISTS "Medications" CASCADE;
DROP TABLE IF EXISTS "Patients" CASCADE;
DROP TABLE IF EXISTS "PatientTypes" CASCADE;
DROP TABLE IF EXISTS "Visits_Chiro" CASCADE;
DROP TABLE IF EXISTS "Visits_Dx" CASCADE;
DROP TABLE IF EXISTS "Visits_Eye" CASCADE;
DROP TABLE IF EXISTS "Visits_Gen" CASCADE;
DROP TABLE IF EXISTS "Visits_Gyn" CASCADE;
DROP TABLE IF EXISTS "Visits_Rx" CASCADE;

-- Drop tables in reverse order of dependency to avoid FK conflicts
DROP TABLE IF EXISTS procedure_details CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS vitals_core CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS workstation_log CASCADE;
DROP TABLE IF EXISTS trips CASCADE;

-- Optional: Clear the pgcrypto extension if you want a true 100% reset
-- DROP EXTENSION IF EXISTS "pgcrypto";

-- Success Message (visible in Flyway/CLI logs)
DO $$ BEGIN
    RAISE NOTICE 'Production schema has been successfully cleared.';
END $$;