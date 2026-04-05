#!/bin/bash

# Check if mdbtools is installed
if ! command -v mdb-schema &> /dev/null || ! command -v mdb-tables &> /dev/null || ! command -v mdb-export &> /dev/null; then
    echo "Error: mdbtools is not installed or not in your PATH."
    echo "Please install mdbtools to use this script."
    echo "  Debian/Ubuntu: apt-get install mdbtools"
    echo "  macOS:         brew install mdbtools"
    exit 1
fi

# REPO_ROOT = conversion/ directory (parent of etl-tool when run from EtlTool).
REPO_ROOT="${REPO_ROOT:-$(pwd)}"
INPUT_FILE="${ACCESS_DB_PATH:-$REPO_ROOT/data/01_Original_Access_DB/belize-medical-database-rev5-b1.accdb}"
OUTPUT_DIR="${CSV_OUTPUT_DIR:-$REPO_ROOT/data/02_Extracted_CSV}"
SCHEMA_OUTPUT="${STAGING_SCHEMA_SQL:-$REPO_ROOT/etl/V2__Inital_Staging_Schema.sql}"
ETL_FORCE_CLEAN_OUTPUT="${ETL_FORCE_CLEAN_OUTPUT:-0}"

echo "Extracting Access database to CSV format..."
echo " REPO_ROOT: $REPO_ROOT"
echo "     input: $INPUT_FILE"
echo "    output: $OUTPUT_DIR"
echo "   schema: $SCHEMA_OUTPUT"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Access database file not found: $INPUT_FILE"
    echo "Mount an .accdb under ACCESS_DB_PATH or place it at the default path."
    exit 1
fi

echo "Ensuring output directory exists..."
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "Creating output directory..."
    mkdir -p "$OUTPUT_DIR"
    touch "$OUTPUT_DIR/.gitkeep"
else
    echo "Output directory exists — preparing for re-extract..."
    CAN_CLEAN=0
    if [ "$ETL_FORCE_CLEAN_OUTPUT" = "1" ]; then
        CAN_CLEAN=1
    elif [ "$OUTPUT_DIR" = "$REPO_ROOT/data/02_Extracted_CSV" ]; then
        CAN_CLEAN=1
    fi
    if [ "$CAN_CLEAN" = "1" ]; then
        echo "Clearing existing CSV extract & raw V2 file..."
        rm -fr "$OUTPUT_DIR"
        rm -f "$SCHEMA_OUTPUT"
        mkdir -p "$OUTPUT_DIR"
        touch "$OUTPUT_DIR/.gitkeep"
    else
        echo "Output directory is not a recognised safe path (set ETL_FORCE_CLEAN_OUTPUT=1 to override). Aborting."
        exit 1
    fi
fi

echo "Extracting schema and tables..."
mdb-schema "$INPUT_FILE" postgres > "$SCHEMA_OUTPUT"
echo "Schema written to $SCHEMA_OUTPUT"

for table in $(mdb-tables -1 "$INPUT_FILE"); do
    echo "Exporting $table..."
    mdb-export -D "%Y-%m-%d %H:%M:%S" -H -d "," "$INPUT_FILE" "$table" > "$OUTPUT_DIR/$table.csv"
done

echo "Done! All tables are in $OUTPUT_DIR"
