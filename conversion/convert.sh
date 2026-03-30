#!/bin/bash

# Configuration
DB_FILE="../legacy/belize-medical-database-rev5-b1.accdb"
OUTPUT_DIR="../legacy/csv_export"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Loop through all table names and export each to a CSV
for table in $(mdb-tables -1 "$DB_FILE"); do
    echo "Exporting $table..."
    mdb-export "$DB_FILE" "$table" > "$OUTPUT_DIR/$table.csv"
done

echo "Done! All tables are in $OUTPUT_DIR"