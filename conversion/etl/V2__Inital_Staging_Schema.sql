-- ----------------------------------------------------------
-- MDB Tools - A library for reading MS Access database files
-- Copyright (C) 2000-2011 Brian Bruns and others.
-- Files in libmdb are licensed under LGPL and the utilities under
-- the GPL, see COPYING.LIB and COPYING files respectively.
-- Check out http://mdbtools.sourceforge.net
-- ----------------------------------------------------------

SET client_encoding = 'UTF-8';

CREATE TABLE IF NOT EXISTS "categories-meds"
 (
	"categoryid"			SERIAL, 
	"category"			VARCHAR (30), 
	"type"			VARCHAR (255)
);

-- CREATE INDEXES ...
CREATE INDEX "categories-meds_categoryid_idx" ON "categories-meds" ("categoryid");
ALTER TABLE "categories-meds" ADD CONSTRAINT "categories-meds_pkey" PRIMARY KEY ("categoryid");

CREATE TABLE IF NOT EXISTS "diagnosis"
 (
	"dxid"			SERIAL, 
	"dx code"			VARCHAR (255), 
	"category"			VARCHAR (50), 
	"diagnosis"			VARCHAR (255)
);

-- CREATE INDEXES ...
ALTER TABLE "diagnosis" ADD CONSTRAINT "diagnosis_pkey" PRIMARY KEY ("dxid");
CREATE INDEX "diagnosis_med code_idx" ON "diagnosis" ("dx code");

CREATE TABLE IF NOT EXISTS "dosestrength"
 (
	"dosestrength"			VARCHAR (20)
);

-- CREATE INDEXES ...
ALTER TABLE "dosestrength" ADD CONSTRAINT "dosestrength_pkey" PRIMARY KEY ("dosestrength");

CREATE TABLE IF NOT EXISTS "locations"
 (
	"location"			VARCHAR (255), 
	"locdesc"			VARCHAR (255)
);

-- CREATE INDEXES ...

CREATE TABLE IF NOT EXISTS "medications"
 (
	"medlistid"			SERIAL, 
	"medcode"			VARCHAR (255), 
	"medname"			VARCHAR (50), 
	"category"			VARCHAR (50), 
	"mednamealt"			VARCHAR (50), 
	"strength"			VARCHAR (6), 
	"discontinued"			BOOLEAN NOT NULL
);

-- CREATE INDEXES ...
ALTER TABLE "medications" ADD CONSTRAINT "medications_pkey" PRIMARY KEY ("medlistid");
CREATE INDEX "medications_medcode_idx" ON "medications" ("medcode");

CREATE TABLE IF NOT EXISTS "patients"
 (
	"id"			SERIAL, 
	"last name"			VARCHAR (25), 
	"first name"			VARCHAR (50), 
	"home phone"			VARCHAR (15), 
	"mobile phone"			VARCHAR (15), 
	"personalnotes"			TEXT, 
	"church"			VARCHAR (50), 
	"hope"			BOOLEAN NOT NULL, 
	"dob"			DATE, 
	"ssno"			VARCHAR (9), 
	"allergies"			TEXT, 
	"medhist"			TEXT, 
	"surgeries"			TEXT, 
	"maritalstatus"			VARCHAR (3), 
	"smoke"			BOOLEAN NOT NULL, 
	"alcohol"			BOOLEAN NOT NULL, 
	"famhist"			TEXT, 
	"gender"			VARCHAR (2), 
	"gyng"			INTEGER, 
	"gynp"			INTEGER, 
	"age"			INTEGER, 
	"spanish only"			BOOLEAN NOT NULL, 
	"ptupdatedon"			TIMESTAMP WITHOUT TIME ZONE, 
	"ptimage"			BYTEA, 
	"ptimage2"			Unknown_0012, 
	"wherelive"			VARCHAR (255), 
	"infonotes"			VARCHAR (255), 
	"heardgospel"			DATE, 
	"suffix"			VARCHAR (255), 
	"lastreaders"			VARCHAR (25), 
	"patienttype"			Unknown_0012, 
	"pttype"			VARCHAR (255)
);
COMMENT ON COLUMN "patients"."ssno" IS 'Social Security # (only if Pap is being performed)';
COMMENT ON COLUMN "patients"."allergies" IS 'Any known drug allergies';
COMMENT ON COLUMN "patients"."medhist" IS 'Any past medical history (DM, HTN,  Cancer)';
COMMENT ON COLUMN "patients"."surgeries" IS 'Any past surgeries including C-Sections';
COMMENT ON COLUMN "patients"."maritalstatus" IS 'Married, Single, Divorced, Common Law';
COMMENT ON COLUMN "patients"."smoke" IS 'Does Pt. smoke even if only occasionally';
COMMENT ON COLUMN "patients"."alcohol" IS 'Does Pt. drink alcohol even if only occasionally';
COMMENT ON COLUMN "patients"."famhist" IS 'Any past FAMILY medical history (DM, HTN,  Cancer)';
COMMENT ON COLUMN "patients"."gender" IS 'Male or Female';
COMMENT ON COLUMN "patients"."gyng" IS 'Number of births';
COMMENT ON COLUMN "patients"."gynp" IS 'Number of pregnancies';

-- CREATE INDEXES ...
CREATE UNIQUE INDEX "patients_id_idx" ON "patients" ("id");
CREATE UNIQUE INDEX "patients_ptimage2_4d04481f2d0341c282f9a9d0c955e9f1_idx" ON "patients" ("ptimage2");
CREATE UNIQUE INDEX "patients_tempfield*0_32289a3bc1564937be560953613c3aec_idx" ON "patients" ("patienttype");

CREATE TABLE IF NOT EXISTS "visits_chiro"
 (
	"chiroid"			SERIAL, 
	"visitid"			INTEGER, 
	"patientid"			INTEGER, 
	"head"			BOOLEAN NOT NULL, 
	"cervical"			BOOLEAN NOT NULL, 
	"thoracic"			BOOLEAN NOT NULL, 
	"lumbar"			BOOLEAN NOT NULL, 
	"hand"			BOOLEAN NOT NULL, 
	"elbow"			BOOLEAN NOT NULL, 
	"shoulder"			BOOLEAN NOT NULL, 
	"leg"			BOOLEAN NOT NULL, 
	"knee"			BOOLEAN NOT NULL, 
	"foot"			BOOLEAN NOT NULL, 
	"painhead"			BOOLEAN NOT NULL, 
	"painneck"			BOOLEAN NOT NULL, 
	"painupback"			BOOLEAN NOT NULL, 
	"painlwrback"			BOOLEAN NOT NULL, 
	"painhand"			BOOLEAN NOT NULL, 
	"painelbow"			BOOLEAN NOT NULL, 
	"painshoulder"			BOOLEAN NOT NULL, 
	"painleg"			BOOLEAN NOT NULL, 
	"painknee"			BOOLEAN NOT NULL, 
	"painfoot"			BOOLEAN NOT NULL, 
	"osteoarthritis"			BOOLEAN NOT NULL, 
	"musclespasm"			BOOLEAN NOT NULL, 
	"jointdysfunction"			BOOLEAN NOT NULL, 
	"sprainstrain"			BOOLEAN NOT NULL, 
	"adjustment"			BOOLEAN NOT NULL, 
	"massage"			BOOLEAN NOT NULL, 
	"topicalanalgesic"			BOOLEAN NOT NULL, 
	"therapyrehab"			BOOLEAN NOT NULL, 
	"support"			BOOLEAN NOT NULL, 
	"chironote"			TEXT, 
	"subluxation"			BOOLEAN NOT NULL, 
	"chiroupdatedon"			TIMESTAMP WITHOUT TIME ZONE
);

-- CREATE INDEXES ...
CREATE INDEX "visits_chiro_patientid_idx" ON "visits_chiro" ("visitid");
CREATE INDEX "visits_chiro_patientid1_idx" ON "visits_chiro" ("patientid");
ALTER TABLE "visits_chiro" ADD CONSTRAINT "visits_chiro_pkey" PRIMARY KEY ("chiroid");

CREATE TABLE IF NOT EXISTS "visits_dx"
 (
	"visitdxid"			SERIAL, 
	"visitid"			INTEGER, 
	"dxcode"			VARCHAR (255), 
	"addlinfo"			VARCHAR (255), 
	"dxupdatedon"			TIMESTAMP WITHOUT TIME ZONE
);

-- CREATE INDEXES ...
CREATE INDEX "visits_dx_dxcode_idx" ON "visits_dx" ("dxcode");
CREATE INDEX "visits_dx_eyesid_idx" ON "visits_dx" ("visitdxid");
ALTER TABLE "visits_dx" ADD CONSTRAINT "visits_dx_pkey" PRIMARY KEY ("visitdxid");
CREATE INDEX "visits_dx_visitid_idx" ON "visits_dx" ("visitid");

CREATE TABLE IF NOT EXISTS "visits_eye"
 (
	"eyeid"			SERIAL, 
	"field1"			BOOLEAN NOT NULL, 
	"patientid"			INTEGER, 
	"visitid"			INTEGER, 
	"va l"			VARCHAR (255), 
	"va r"			VARCHAR (255), 
	"tonr"			VARCHAR (255), 
	"tonl"			VARCHAR (255), 
	"impression"			VARCHAR (255), 
	"plan"			VARCHAR (255), 
	"readnear"			VARCHAR (255), 
	"readdist"			VARCHAR (255), 
	"eom"			VARCHAR (255), 
	"pupils"			VARCHAR (255), 
	"ar r"			VARCHAR (255), 
	"ar l"			VARCHAR (255), 
	"va"			VARCHAR (255), 
	"l"			VARCHAR (255), 
	"eyeupdatedon"			TIMESTAMP WITHOUT TIME ZONE, 
	"cataracts"			BOOLEAN NOT NULL, 
	"dryeyes"			BOOLEAN NOT NULL, 
	"glaucoma"			BOOLEAN NOT NULL, 
	"ptergium"			BOOLEAN NOT NULL, 
	"other"			VARCHAR (255), 
	"readersgivendate"			TIMESTAMP WITHOUT TIME ZONE, 
	"readersgivenstrength"			VARCHAR (25)
);

-- CREATE INDEXES ...
CREATE INDEX "visits_eye_patientid_idx" ON "visits_eye" ("patientid");
ALTER TABLE "visits_eye" ADD CONSTRAINT "visits_eye_pkey" PRIMARY KEY ("eyeid");
CREATE INDEX "visits_eye_visitid_idx" ON "visits_eye" ("visitid");

CREATE TABLE IF NOT EXISTS "visits_gen"
 (
	"genid"			SERIAL, 
	"patientid"			INTEGER, 
	"datevisit"			DATE, 
	"height"			DOUBLE PRECISION, 
	"weight"			DOUBLE PRECISION, 
	"pulse"			DOUBLE PRECISION, 
	"bp"			VARCHAR (255), 
	"resp"			DOUBLE PRECISION, 
	"temp"			VARCHAR (10), 
	"glucoseblood"			DOUBLE PRECISION, 
	"hemoglobin"			DOUBLE PRECISION, 
	"diagnosis"			TEXT, 
	"referral"			TEXT, 
	"bloodh"			VARCHAR (5), 
	"bloodn"			VARCHAR (5), 
	"urobilin"			VARCHAR (5), 
	"bilirubin"			VARCHAR (5), 
	"protein"			VARCHAR (5), 
	"nitrite"			VARCHAR (5), 
	"ketones"			VARCHAR (5), 
	"ascorbic"			VARCHAR (5), 
	"glucoseurine"			VARCHAR (5), 
	"ph"			VARCHAR (5), 
	"spgrav"			VARCHAR (5), 
	"leuk"			VARCHAR (5), 
	"pregtest"			VARCHAR (15), 
	"md"			BOOLEAN NOT NULL, 
	"eye"			BOOLEAN NOT NULL, 
	"gyn"			BOOLEAN NOT NULL, 
	"ch"			BOOLEAN NOT NULL, 
	"dnt"			BOOLEAN NOT NULL, 
	"genupdatedon"			TIMESTAMP WITHOUT TIME ZONE, 
	"location"			VARCHAR (10), 
	"oxygen"			VARCHAR (255)
);

-- CREATE INDEXES ...
CREATE INDEX "visits_gen_patientid_idx" ON "visits_gen" ("patientid");
ALTER TABLE "visits_gen" ADD CONSTRAINT "visits_gen_pkey" PRIMARY KEY ("genid");

CREATE TABLE IF NOT EXISTS "visits_gyn"
 (
	"gynid"			SERIAL, 
	"visitid"			INTEGER, 
	"patientid"			INTEGER, 
	"mam"			VARCHAR (255), 
	"pap"			VARCHAR (255), 
	"lmp"			VARCHAR (255), 
	"gynnotes"			TEXT, 
	"gynupdatedon"			TIMESTAMP WITHOUT TIME ZONE
);

-- CREATE INDEXES ...
CREATE INDEX "visits_gyn_patientid_idx" ON "visits_gyn" ("patientid");
ALTER TABLE "visits_gyn" ADD CONSTRAINT "visits_gyn_pkey" PRIMARY KEY ("gynid");
CREATE INDEX "visits_gyn_visitid_idx" ON "visits_gyn" ("visitid");

CREATE TABLE IF NOT EXISTS "visits_rx"
 (
	"rxid"			SERIAL, 
	"visitid"			INTEGER, 
	"medid"			INTEGER, 
	"directions"			VARCHAR (100), 
	"dose"			VARCHAR (255), 
	"dnd"			BOOLEAN NOT NULL, 
	"rxupdatedon"			TIMESTAMP WITHOUT TIME ZONE
);
COMMENT ON COLUMN "visits_rx"."dnd" IS 'Did not Dispense';

-- CREATE INDEXES ...
CREATE INDEX "visits_rx_medid_idx" ON "visits_rx" ("medid");
ALTER TABLE "visits_rx" ADD CONSTRAINT "visits_rx_pkey" PRIMARY KEY ("rxid");
CREATE INDEX "visits_rx_visitid_idx" ON "visits_rx" ("visitid");

CREATE TABLE IF NOT EXISTS "patienttypes"
 (
	"id"			SERIAL, 
	"patienttype"			VARCHAR (255)
);

-- CREATE INDEXES ...
ALTER TABLE "patienttypes" ADD CONSTRAINT "patienttypes_pkey" PRIMARY KEY ("id");


-- CREATE Relationships ...
-- Relationship from "Visits_Gen" ("patientid") to "Last Visit"("patientid") does not enforce integrity.
-- Relationship from "Visits_Gen" ("datevisit") to "Last Visit"("maxdate") does not enforce integrity.
-- Relationship from "Visits_Rx" ("medid") to "Medications"("medlistid") does not enforce integrity.
-- Relationship from "Visits_Gen" ("patientid") to "Patients Query"("id") does not enforce integrity.
-- Relationship from "Visits_Gen" ("patientid") to "Patients"("id") does not enforce integrity.
-- Relationship from "f_62ED9736DE96422FBF41FEEDCA2805B6_TempField*0" ("value") to "PatientTypes"("id") does not enforce integrity.
-- Relationship from "Visits_Dx" ("visitid") to "Visits_Gen"("genid") does not enforce integrity.
-- Relationship from "Visits_Chiro" ("visitid") to "Visits_Gen"("genid") does not enforce integrity.
-- Relationship from "Visits_Eye" ("visitid") to "Visits_Gen"("genid") does not enforce integrity.
-- Relationship from "Visits_Gyn" ("visitid") to "Visits_Gen"("genid") does not enforce integrity.
-- Relationship from "Visits_Rx" ("visitid") to "Visits_Gen"("genid") does not enforce integrity.
