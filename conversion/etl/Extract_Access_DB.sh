#!/bin/bash


# Check if mdbtools is installed
if ! command -v mdb-schema &> /dev/null || ! command -v mdb-tables &> /dev/null || ! command -v mdb-export &> /dev/null; then
    echo "Error: mdbtools is not installed or not in your PATH."
    echo "Please install mdbtools to use this script."
    echo "You can install it via Homebrew on macOS:"
    echo "  brew install mdbtools"
    echo "Or check the mdbtools documentation for other platforms:"
    echo "  https://github.com/mdbtools/mdbtools"
    exit 1
fi

# Configuration

INPUT_FILE="$(pwd)/conversion/data/01_Original_Access_DB/belize-medical-database-rev5-b1.accdb"
OUTPUT_DIR="$(pwd)/conversion/data/02_Extracted_CSV"
SCHEMA_OUTPUT="$(pwd)/conversion/etl/V2__Inital_Staging_Schema.sql"

echo "Extracting Access database to CSV format..."
echo " input: $INPUT_FILE"
echo "output: $OUTPUT_DIR"
echo "schema: $SCHEMA_OUTPUT"

echo "Ensuring output directory exists..."
# Create the output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "Output directory does not exist. Creating it..."
    mkdir -p "$OUTPUT_DIR"
    touch "$OUTPUT_DIR/.gitkeep"
else
    echo "Output directory already exists."
    # Empty the output directory before extraction (idempotent)
    echo "Clearing existing files in output directory..."
    # sanity check to prevent accidental deletion of important files
    if [ "$OUTPUT_DIR" == "$(pwd)/conversion/data/02_Extracted_CSV" ]; then
        echo "Confirmed output directory is correct. Proceeding with cleanup..."
        rm -fr "$OUTPUT_DIR"
        rm -f "$SCHEMA_OUTPUT"
        mkdir -p "$OUTPUT_DIR"
        touch "$OUTPUT_DIR/.gitkeep"
    else
        echo "Output directory is not the expected location. Aborting..."
        exit 1
    fi
fi

echo "Extracting schema and tables..."

# This creates a .sql file with CREATE TABLE statements compatible with Postgres
mdb-schema "$INPUT_FILE" postgres > "$SCHEMA_OUTPUT"

# Scrub the SQL to make every column TEXT for a more resilient staging area
echo "Generalizing schema types to TEXT..."
# 1. Convert all known data types to TEXT
sed -i '' -E 's/(DATE|SERIAL|INTEGER|DOUBLE PRECISION|TIMESTAMP|BYTEA|Unknown_[0-9]+|BOOLEAN|NUMERIC\([0-9,]+\)|VARCHAR \([0-9]+\))/TEXT/gI' "$SCHEMA_OUTPUT"
# 2. Strip "NOT NULL" (Allows empty fields to load)
sed -i '' -E 's/ NOT NULL//gI' "$SCHEMA_OUTPUT"
# 3. Strip "WITHOUT TIME ZONE" (Cleans up leftover timestamp syntax)
sed -i '' -E 's/ WITHOUT TIME ZONE//gI' "$SCHEMA_OUTPUT"
echo "Removing Indexes, Primary Keys, and Foreign Key Relationships..."
# 4. Delete lines starting with CREATE INDEX
sed -i '' '/^CREATE INDEX/d' "$SCHEMA_OUTPUT"
# 5. Delete lines starting with CREATE UNIQUE INDEX
sed -i '' '/^CREATE UNIQUE INDEX/d' "$SCHEMA_OUTPUT"
# 6. Delete lines starting with -- CREATE INDEXES ... (removes index comments)
sed -i '' '/^-- CREATE INDEXES .../d' "$SCHEMA_OUTPUT"    
# 7. Delete lines starting with ALTER TABLE (removes Primary Keys)
sed -i '' '/^ALTER TABLE/d' "$SCHEMA_OUTPUT"
# 8. Delete trailing comments that mdb-schema adds about Relationships
sed -i '' '/^-- CREATE Relationships/,$d' "$SCHEMA_OUTPUT"
# 9. Remove lines starting with COMMENT ON COLUMN (removes column comments)
sed -i '' '/^COMMENT ON COLUMN/d' "$SCHEMA_OUTPUT"
# 13. Remove lines 1-8 (removes header lines to be replaced with our own custom header)
sed -i '' '1,8d' "$SCHEMA_OUTPUT"
# 14.Add the search_path to top so it lands in the right schema
sed -i '' '1i\
-- ----------------------------------------------------------\
-- Belize Medical Database Schema - Revision 5 B1\
-- ----------------------------------------------------------\
\
-- Create a clean workspace\
DROP SCHEMA IF EXISTS staging CASCADE;\
CREATE SCHEMA staging;\
\
SET search_path TO staging;' "$SCHEMA_OUTPUT"

Loop through all table names and export each to a CSV
for table in $(mdb-tables -1 "$INPUT_FILE"); do
    echo "Exporting $table..."
    # Extract the table to CSV and save it in the output directory using broken bar (¦) as the delimiter
    mdb-export -D "%Y-%m-%d %H:%M:%S" -Q -H -d "¦" "$INPUT_FILE" "$table" > "$OUTPUT_DIR/$table.csv"
done

echo "Done! All tables are in $OUTPUT_DIR"