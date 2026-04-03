# ---------------------------------------------------------
# Christ Medical ETL & Dev Pipeline
# ---------------------------------------------------------

# Variables
DB_NAME=christ_medical
DB_USER=postgres
DB_PASS=password
DB_HOST=localhost
DB_PORT=5432
DB_URL=postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

# Paths
ROOT_DIR=$(shell pwd)
EXTRACT_SCRIPT=$(ROOT_DIR)/conversion/extract.sh
SCHEMA_DIR=$(ROOT_DIR)/conversion/etl
DATA_DIR=$(ROOT_DIR)/conversion/data/02_extracted

# Default task
all: help

help:
	@echo "Christ Medical Makefile Commands:"
	@echo "  db-up         - Start the Postgres Docker container"
	@echo "  db-down        - Stop the Postgres Docker container"
	@echo "  init-schema   - Run V0, V1, and V2 SQL scripts (Reset & Build)"
	@echo "  load-staging  - Load CSVs into staging via psql \copy"
	@echo "  run-etl       - Run the .NET EtlTool"
	@echo "  full-reset    - Nuke DB, Rebuild Schema, and Reload Staging"

# 1. Infrastructure
db-up:
	docker-compose up -d db

db-down:
	docker-compose stop db

# 2. Database Schema Setup
init-schema:
	@echo "Initializing database schemas..."
	psql $(DB_URL) -f $(SCHEMA_DIR)/V0__Reset_Schema.sql
	psql $(DB_URL) -f $(SCHEMA_DIR)/V1__Initial_Schema.sql
	psql $(DB_URL) -f $(SCHEMA_DIR)/V2__Inital_Staging_Schema.sql

# 3. Data Loading (Using your \copy script)
load-staging:
	@echo "Streaming CSVs from $(DATA_DIR) to Docker..."
	psql $(DB_URL) -v base_path="$(DATA_DIR)" -f $(SCHEMA_DIR)/etl/V3__Load_Staging_Data.sql

# 4. The ETL Logic (C#)
run-etl:
	@echo "Starting C# ETL Conversion..."
	cd EtlTool && dotnet run

# 5. The "I messed up, start over" Command
full-reset: db-up init-schema load-staging
	@echo "Environment is reset and staged. Ready for ETL."

# 6. Cleaning Up
clean:
	docker-compose down -v
	rm -rf $(DATA_DIR)/*.csv