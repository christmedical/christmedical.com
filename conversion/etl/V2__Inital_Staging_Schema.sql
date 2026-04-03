-- ----------------------------------------------------------
-- Belize Medical Database Schema - Revision 5 B1
-- ----------------------------------------------------------

-- Create a clean workspace
DROP SCHEMA IF EXISTS staging CASCADE;
CREATE SCHEMA staging;

SET search_path TO staging;
SET client_encoding = 'UTF-8';

CREATE TABLE IF NOT EXISTS "categories-meds"
 (
	"categoryid"			TEXT, 
	"category"			TEXT, 
	"type"			TEXT
);


CREATE TABLE IF NOT EXISTS "diagnosis"
 (
	"dxid"			TEXT, 
	"dx code"			TEXT, 
	"category"			TEXT, 
	"diagnosis"			TEXT
);


CREATE TABLE IF NOT EXISTS "dosestrength"
 (
	"dosestrength"			TEXT
);


CREATE TABLE IF NOT EXISTS "locations"
 (
	"location"			TEXT, 
	"locdesc"			TEXT
);


CREATE TABLE IF NOT EXISTS "medications"
 (
	"medlistid"			TEXT, 
	"medcode"			TEXT, 
	"medname"			TEXT, 
	"category"			TEXT, 
	"mednamealt"			TEXT, 
	"strength"			TEXT, 
	"discontinued"			TEXT
);


CREATE TABLE IF NOT EXISTS "patients"
 (
	"id"			TEXT, 
	"last name"			TEXT, 
	"first name"			TEXT, 
	"home phone"			TEXT, 
	"mobile phone"			TEXT, 
	"personalnotes"			TEXT, 
	"church"			TEXT, 
	"hope"			TEXT, 
	"dob"			TEXT, 
	"ssno"			TEXT, 
	"allergies"			TEXT, 
	"medhist"			TEXT, 
	"surgeries"			TEXT, 
	"maritalstatus"			TEXT, 
	"smoke"			TEXT, 
	"alcohol"			TEXT, 
	"famhist"			TEXT, 
	"gender"			TEXT, 
	"gyng"			TEXT, 
	"gynp"			TEXT, 
	"age"			TEXT, 
	"spanish only"			TEXT, 
	"ptupTEXTdon"			TEXT, 
	"ptimage"			TEXT, 
	"ptimage2"			TEXT, 
	"wherelive"			TEXT, 
	"infonotes"			TEXT, 
	"heardgospel"			TEXT, 
	"suffix"			TEXT, 
	"lastreaders"			TEXT, 
	"patienttype"			TEXT, 
	"pttype"			TEXT
);


CREATE TABLE IF NOT EXISTS "visits_chiro"
 (
	"chiroid"			TEXT, 
	"visitid"			TEXT, 
	"patientid"			TEXT, 
	"head"			TEXT, 
	"cervical"			TEXT, 
	"thoracic"			TEXT, 
	"lumbar"			TEXT, 
	"hand"			TEXT, 
	"elbow"			TEXT, 
	"shoulder"			TEXT, 
	"leg"			TEXT, 
	"knee"			TEXT, 
	"foot"			TEXT, 
	"painhead"			TEXT, 
	"painneck"			TEXT, 
	"painupback"			TEXT, 
	"painlwrback"			TEXT, 
	"painhand"			TEXT, 
	"painelbow"			TEXT, 
	"painshoulder"			TEXT, 
	"painleg"			TEXT, 
	"painknee"			TEXT, 
	"painfoot"			TEXT, 
	"osteoarthritis"			TEXT, 
	"musclespasm"			TEXT, 
	"jointdysfunction"			TEXT, 
	"sprainstrain"			TEXT, 
	"adjustment"			TEXT, 
	"massage"			TEXT, 
	"topicalanalgesic"			TEXT, 
	"therapyrehab"			TEXT, 
	"support"			TEXT, 
	"chironote"			TEXT, 
	"subluxation"			TEXT, 
	"chiroupTEXTdon"			TEXT
);


CREATE TABLE IF NOT EXISTS "visits_dx"
 (
	"visitdxid"			TEXT, 
	"visitid"			TEXT, 
	"dxcode"			TEXT, 
	"addlinfo"			TEXT, 
	"dxupTEXTdon"			TEXT
);


CREATE TABLE IF NOT EXISTS "visits_eye"
 (
	"eyeid"			TEXT, 
	"field1"			TEXT, 
	"patientid"			TEXT, 
	"visitid"			TEXT, 
	"va l"			TEXT, 
	"va r"			TEXT, 
	"tonr"			TEXT, 
	"tonl"			TEXT, 
	"impression"			TEXT, 
	"plan"			TEXT, 
	"readnear"			TEXT, 
	"readdist"			TEXT, 
	"eom"			TEXT, 
	"pupils"			TEXT, 
	"ar r"			TEXT, 
	"ar l"			TEXT, 
	"va"			TEXT, 
	"l"			TEXT, 
	"eyeupTEXTdon"			TEXT, 
	"cataracts"			TEXT, 
	"dryeyes"			TEXT, 
	"glaucoma"			TEXT, 
	"ptergium"			TEXT, 
	"other"			TEXT, 
	"readersgivenTEXT"			TEXT, 
	"readersgivenstrength"			TEXT
);


CREATE TABLE IF NOT EXISTS "visits_gen"
 (
	"genid"			TEXT, 
	"patientid"			TEXT, 
	"TEXTvisit"			TEXT, 
	"height"			TEXT, 
	"weight"			TEXT, 
	"pulse"			TEXT, 
	"bp"			TEXT, 
	"resp"			TEXT, 
	"temp"			TEXT, 
	"glucoseblood"			TEXT, 
	"hemoglobin"			TEXT, 
	"diagnosis"			TEXT, 
	"referral"			TEXT, 
	"bloodh"			TEXT, 
	"bloodn"			TEXT, 
	"urobilin"			TEXT, 
	"bilirubin"			TEXT, 
	"protein"			TEXT, 
	"nitrite"			TEXT, 
	"ketones"			TEXT, 
	"ascorbic"			TEXT, 
	"glucoseurine"			TEXT, 
	"ph"			TEXT, 
	"spgrav"			TEXT, 
	"leuk"			TEXT, 
	"pregtest"			TEXT, 
	"md"			TEXT, 
	"eye"			TEXT, 
	"gyn"			TEXT, 
	"ch"			TEXT, 
	"dnt"			TEXT, 
	"genupTEXTdon"			TEXT, 
	"location"			TEXT, 
	"oxygen"			TEXT
);


CREATE TABLE IF NOT EXISTS "visits_gyn"
 (
	"gynid"			TEXT, 
	"visitid"			TEXT, 
	"patientid"			TEXT, 
	"mam"			TEXT, 
	"pap"			TEXT, 
	"lmp"			TEXT, 
	"gynnotes"			TEXT, 
	"gynupTEXTdon"			TEXT
);


CREATE TABLE IF NOT EXISTS "visits_rx"
 (
	"rxid"			TEXT, 
	"visitid"			TEXT, 
	"medid"			TEXT, 
	"directions"			TEXT, 
	"dose"			TEXT, 
	"dnd"			TEXT, 
	"rxupTEXTdon"			TEXT
);


CREATE TABLE IF NOT EXISTS "patienttypes"
 (
	"id"			TEXT, 
	"patienttype"			TEXT
);



