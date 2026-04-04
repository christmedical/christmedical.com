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
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "Output directory does not exist. Creating it..."
    mkdir -p "$OUTPUT_DIR"
    touch "$OUTPUT_DIR/.gitkeep"
else
    echo "Output directory already exists."
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

# Generate the raw PostgreSQL schema from the Access DB.
# NOTE: All type-scrubbing (TEXT normalisation, index/FK removal, header replacement)
# is handled by SchemaService.cs in the .NET ETL process, NOT here.
# This avoids Perl/sed portability issues on macOS and keeps the logic testable in C#.
mdb-schema "$INPUT_FILE" postgres > "$SCHEMA_OUTPUT"
echo "Schema written to $SCHEMA_OUTPUT"

# Loop through all table names and export each to a CSV
for table in $(mdb-tables -1 "$INPUT_FILE"); do
    echo "Exporting $table..."
    # Standard CSV: comma delimiter, fields quoted when necessary (no -Q flag so that
    # fields containing commas or embedded newlines are properly quoted).
    # -H outputs the header row.
    mdb-export -D "%Y-%m-%d %H:%M:%S" -H -d "," "$INPUT_FILE" "$table" > "$OUTPUT_DIR/$table.csv"
done

echo "Done! All tables are in $OUTPUT_DIR"
