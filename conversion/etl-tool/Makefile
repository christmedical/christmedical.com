# Run from conversion/etl-tool (or use repository root Makefile target `convert`).

DB_NAME=christ_medical
DB_USER=postgres
DB_PASS=password
DB_HOST=localhost
DB_PORT=5432
DB_URL=postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

CONV_DIR=$(shell cd .. && pwd)
SCHEMA_DIR=$(CONV_DIR)/etl
DATA_DIR=$(CONV_DIR)/data/02_extracted

all: help

help:
	@echo "Run from conversion/etl-tool. Prefer: cd conversion && docker compose up (appliance) or use repo Makefile convert."

db-up:
	cd ../.. && docker compose up -d db

db-down:
	cd ../.. && docker compose stop db

init-schema:
	psql $(DB_URL) -f $(SCHEMA_DIR)/V0__Reset_Schema.sql
	psql $(DB_URL) -f $(SCHEMA_DIR)/V1__Initial_Schema.sql
	psql $(DB_URL) -f $(SCHEMA_DIR)/V2__Inital_Staging_Schema.sql

run-etl:
	dotnet run --project ./EtlTool.csproj

full-reset: db-up init-schema
	@echo "Ready for ETL after manual staging load if needed."

clean:
	cd ../.. && docker compose down -v
