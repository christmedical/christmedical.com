-- ----------------------------------------------------------
-- Christ Medical: Isolated Staging Schema
-- ----------------------------------------------------------

-- Create a clean workspace
DROP SCHEMA IF EXISTS staging CASCADE;
CREATE SCHEMA staging;

-- Set the path so we don't have to prefix every table manually
SET search_path TO staging;
SET client_encoding = 'UTF-8';

CREATE TABLE "categories-meds" (
    "categoryid"    INTEGER, 
    "category"      VARCHAR (30), 
    "type"          VARCHAR (255)
);

CREATE TABLE "diagnosis" (
    "dxid"          INTEGER, 
    "dx code"       VARCHAR (255), 
    "category"      VARCHAR (50), 
    "diagnosis"     VARCHAR (255)
);

CREATE TABLE "dosestrength" (
    "dosestrength"  TEXT
);

CREATE TABLE "locations" (
    "location"      VARCHAR (255), 
    "locdesc"       VARCHAR (255)
);

CREATE TABLE "medications" (
    "medlistid"     INTEGER, 
    "medcode"       VARCHAR (255), 
    "medname"       VARCHAR (50), 
    "category"      VARCHAR (50), 
    "mednamealt"    VARCHAR (50), 
    "strength"      TEXT, 
    "discontinued"  BOOLEAN
);

CREATE TABLE staging.patients (
    "id"            TEXT,
    "last name"     TEXT,
    "first name"    TEXT,
    "home phone"    TEXT,
    "mobile phone"  TEXT,
    "personalnotes" TEXT,
    "church"        TEXT,
    "hope"          TEXT,
    "dob"           TEXT,
    "ssno"          TEXT,
    "allergies"     TEXT,
    "medhist"       TEXT,
    "surgeries"     TEXT,
    "maritalstatus" TEXT,
    "smoke"         TEXT,
    "alcohol"       TEXT,
    "famhist"       TEXT,
    "gender"        TEXT,
    "gyng"          TEXT,
    "gynp"          TEXT,
    "age"           TEXT,
    "spanish only"  TEXT,
    "ptupdatedon"   TEXT,
    "ptimage"       TEXT,
    "ptimage2"      TEXT,
    "wherelive"     TEXT,
    "infonotes"     TEXT,
    "heardgospel"   TEXT,
    "suffix"        TEXT,
    "lastreaders"   TEXT,
    "patienttype"   TEXT,
    "pttype"        TEXT,
    "junk_drawer"   TEXT -- NEW: This catches any "extra data" errors
);

CREATE TABLE "visits_chiro" (
    "chiroid"           INTEGER, 
    "visitid"           INTEGER, 
    "patientid"         INTEGER, 
    "head"              BOOLEAN, 
    "cervical"          BOOLEAN, 
    "thoracic"          BOOLEAN, 
    "lumbar"            BOOLEAN, 
    "hand"              BOOLEAN, 
    "elbow"             BOOLEAN, 
    "shoulder"          BOOLEAN, 
    "leg"               BOOLEAN, 
    "knee"              BOOLEAN, 
    "foot"              BOOLEAN, 
    "painhead"          BOOLEAN, 
    "painneck"          BOOLEAN, 
    "painupback"        BOOLEAN, 
    "painlwrback"       BOOLEAN, 
    "painhand"          BOOLEAN, 
    "painelbow"         BOOLEAN, 
    "painshoulder"      BOOLEAN, 
    "painleg"           BOOLEAN, 
    "painknee"          BOOLEAN, 
    "painfoot"          BOOLEAN, 
    "osteoarthritis"    BOOLEAN, 
    "musclespasm"       BOOLEAN, 
    "jointdysfunction"  BOOLEAN, 
    "sprainstrain"      BOOLEAN, 
    "adjustment"        BOOLEAN, 
    "massage"           BOOLEAN, 
    "topicalanalgesic"  BOOLEAN, 
    "therapyrehab"      BOOLEAN, 
    "support"           BOOLEAN, 
    "chironote"         TEXT, 
    "subluxation"       BOOLEAN, 
    "chiroupdatedon"    TIMESTAMP
);

CREATE TABLE "visits_dx" (
    "visitdxid"         INTEGER, 
    "visitid"           INTEGER, 
    "dxcode"            VARCHAR (255), 
    "addlinfo"          VARCHAR (255), 
    "dxupdatedon"       TIMESTAMP
);

CREATE TABLE "visits_eye" (
    "eyeid"         INTEGER, 
    "field1"        BOOLEAN, 
    "patientid"     INTEGER, 
    "visitid"       INTEGER, 
    "va l"          VARCHAR (255), 
    "va r"          VARCHAR (255), 
    "tonr"          VARCHAR (255), 
    "tonl"          VARCHAR (255), 
    "impression"    VARCHAR (255), 
    "plan"          VARCHAR (255), 
    "readnear"      VARCHAR (255), 
    "readdist"      VARCHAR (255), 
    "eom"           VARCHAR (255), 
    "pupils"        VARCHAR (255), 
    "ar r"          VARCHAR (255), 
    "ar l"          VARCHAR (255), 
    "va"            VARCHAR (255), 
    "l"             VARCHAR (255), 
    "eyeupdatedon"  TIMESTAMP, 
    "cataracts"     BOOLEAN, 
    "dryeyes"       BOOLEAN, 
    "glaucoma"      BOOLEAN, 
    "ptergium"      BOOLEAN, 
    "other"         VARCHAR (255), 
    "readersgivendate"      TIMESTAMP, 
    "readersgivenstrength"  TEXT
);

CREATE TABLE "visits_gen" (
    "genid"         TEXT, 
    "patientid"     TEXT, 
    "datevisit"     TEXT, 
    "height"        TEXT, 
    "weight"        TEXT, 
    "pulse"         DOUBLE PRECISION, 
    "bp"            VARCHAR (255), 
    "resp"          DOUBLE PRECISION, 
    "temp"          TEXT, 
    "glucoseblood"  DOUBLE PRECISION, 
    "hemoglobin"    DOUBLE PRECISION, 
    "diagnosis"     TEXT, 
    "referral"      TEXT, 
    "bloodh"        VARCHAR (5), 
    "bloodn"        VARCHAR (5), 
    "urobilin"      VARCHAR (5), 
    "bilirubin"     VARCHAR (5), 
    "protein"       VARCHAR (5), 
    "nitrite"       VARCHAR (5), 
    "ketones"       VARCHAR (5), 
    "ascorbic"      VARCHAR (5), 
    "glucoseurine"  VARCHAR (5), 
    "ph"            VARCHAR (5), 
    "spgrav"        VARCHAR (5), 
    "leuk"          VARCHAR (5), 
    "pregtest"      TEXT, 
    "md"            BOOLEAN, 
    "eye"           BOOLEAN, 
    "gyn"           BOOLEAN, 
    "ch"            BOOLEAN, 
    "dnt"           BOOLEAN, 
    "genupdatedon"  TIMESTAMP, 
    "location"      TEXT, 
    "oxygen"        VARCHAR (255)
);

CREATE TABLE "visits_gyn" (
    "gynid"         INTEGER, 
    "visitid"       INTEGER, 
    "patientid"     INTEGER, 
    "mam"           VARCHAR (255), 
    "pap"           VARCHAR (255), 
    "lmp"           VARCHAR (255), 
    "gynnotes"      TEXT, 
    "gynupdatedon"  TIMESTAMP
);

CREATE TABLE "visits_rx" (
    "rxid"          INTEGER, 
    "visitid"       INTEGER, 
    "medid"         INTEGER, 
    "directions"    VARCHAR (100), 
    "dose"          VARCHAR (255), 
    "dnd"           BOOLEAN, 
    "rxupdatedon"   TIMESTAMP
);

CREATE TABLE "patienttypes" (
    "id"            INTEGER, 
    "patienttype"   VARCHAR (255)
);