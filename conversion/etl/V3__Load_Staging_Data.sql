-- Ensure we are working in the staging area
SET datestyle = 'ISO, MDY';
SET search_path TO staging;

-- 1. Clean existing data
TRUNCATE TABLE 
    "categories-meds", "diagnosis", "dosestrength", "locations", "medications",
    "patients", "patienttypes", "visits_chiro", "visits_dx", "visits_eye",
    "visits_gen", "visits_gyn", "visits_rx" CASCADE;

-- 2. Use the variable correctly inside the path string
-- PostgreSQL variable interpolation for \copy works by concatenating the variable
\copy "categories-meds" FROM 'conversion/data/02_extracted/Categories-Meds.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8');
\copy "diagnosis" FROM 'conversion/data/02_extracted/Diagnosis.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8');
\copy "dosestrength" FROM 'conversion/data/02_extracted/DoseStrength.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "locations" FROM 'conversion/data/02_extracted/Locations.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "medications" FROM 'conversion/data/02_extracted/Medications.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "patients" (id, "last name", "first name", "home phone", "mobile phone", personalnotes, church, hope, dob, ssno, allergies, medhist, surgeries, maritalstatus, smoke, alcohol, famhist, gender, gyng, gynp, age, "spanish only", ptupdatedon, ptimage, ptimage2, wherelive, infonotes, heardgospel, suffix, lastreaders, patienttype, pttype) FROM 'conversion/data/02_extracted/Patients.csv' WITH (FORMAT csv, HEADER, DELIMITER ',', QUOTE '"', ENCODING 'LATIN1');
\copy "patienttypes" FROM 'conversion/data/02_extracted/PatientTypes.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "visits_chiro" FROM 'conversion/data/02_extracted/Visits_Chiro.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "visits_dx" FROM 'conversion/data/02_extracted/Visits_Dx.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "visits_eye" FROM 'conversion/data/02_extracted/Visits_Eye.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');   
\copy "visits_gen" FROM 'conversion/data/02_extracted/Visits_Gen.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');
\copy "visits_gyn" FROM 'conversion/data/02_extracted/Visits_Gyn.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');  
\copy "visits_rx" FROM 'conversion/data/02_extracted/Visits_Rx.csv' WITH (FORMAT csv, HEADER, ENCODING 'UTF8', NULL '');