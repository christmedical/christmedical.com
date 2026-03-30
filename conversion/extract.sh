#!/bin/bash

# Configuration
DB_FILE="./data/01_original/belize-medical-database-rev5-b1.accdb"
OUTPUT_DIR="./data/02_extracted"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# This creates a .sql file with CREATE TABLE statements compatible with Postgres
mdb-schema "$DB_FILE" postgres > "$OUTPUT_DIR/schema.sql"

# Loop through all table names and export each to a CSV
for table in $(mdb-tables -1 "$DB_FILE"); do
    echo "Exporting $table..."
    mdb-export "$DB_FILE" "$table" > "$OUTPUT_DIR/$table.csv"
done

echo "Done! All tables are in $OUTPUT_DIR"