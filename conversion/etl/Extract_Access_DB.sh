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

echo "Extracting Access database to CSV format..."
echo " input: $INPUT_FILE"
echo "output: $OUTPUT_DIR"

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
        mkdir -p "$OUTPUT_DIR"
        touch "$OUTPUT_DIR/.gitkeep"
    else
        echo "Output directory is not the expected location. Aborting..."
        exit 1
    fi
fi

echo "Extracting schema and tables..."
# This creates a .sql file with CREATE TABLE statements compatible with Postgres
mdb-schema "$INPUT_FILE" postgres > "$OUTPUT_DIR/Access_DB.sql"

# Loop through all table names and export each to a CSV
for table in $(mdb-tables -1 "$INPUT_FILE"); do
    echo "Exporting $table..."
    # Extract the table to CSV and save it in the output directory using broken bar (¦) as the delimiter
    mdb-export -D "%Y-%m-%d %H:%M:%S" -Q -H -d "¦" "$INPUT_FILE" "$table" > "$OUTPUT_DIR/$table.csv"
done

echo "Done! All tables are in $OUTPUT_DIR"