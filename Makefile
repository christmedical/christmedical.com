.PHONY: help setup setup-hooks install-hooks convert extract db-up db-down

# Default target
.DEFAULT_GOAL := help

# Colors for output (if terminal supports it)
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Variables
DB_NAME=christ_medical
DB_USER=postgres
DB_PASS=password
DB_HOST=localhost
DB_PORT=5432
DB_URL=postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

# Paths
ROOT_DIR=$(shell pwd)
ETL_DIR=$(ROOT_DIR)/conversion/etl
EXTRACT_SCRIPT=$(ETL_DIR)/Extract_Access_DB.sh
DATA_DIR=$(ROOT_DIR)/conversion/data/02_extracted

##@ Development Setup

all: help

help: ## Display this help message
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)  Christ Medical - Available Make Targets$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""
	@echo "Christ Medical Makefile Commands:"
	@echo "  db-up         - Start the Postgres Docker container"
	@echo "  db-down        - Stop the Postgres Docker container"
	@echo "  init-schema   - Run V0, V1, and V2 SQL scripts (Reset & Build)"
	@echo "  load-staging  - Load CSVs into staging via psql \copy"
	@echo "  run-etl       - Run the .NET EtlTool"
	@echo "  full-reset    - Nuke DB, Rebuild Schema, and Reload Staging"

setup: ## Run the full development setup (installs git hooks and verifies setup)
	@echo "$(BLUE)Running development setup...$(NC)"
	@bash scripts/dev-setup.sh

setup-hooks: install-hooks ## Alias for install-hooks

install-hooks: ## Install git hooks only (idempotent)
	@echo "$(BLUE)Installing git hooks...$(NC)"
	@bash scripts/install-hooks.sh

extract: ## Extract the Access database to CSV format (idempotent)
	@echo "$(BLUE)Extracting access database to CSV...$(NC)"
	@bash $(EXTRACT_SCRIPT)

reset-db:
	@echo "Wiping production tables..."
	psql $(DATABASE_URL) -f ./conversion/V0__Reset_Schema.sql

convert: reset-db
	@echo "Starting extraction..."
	./conversion/convert.sh
	@echo "Running ETL via .NET..."
	dotnet run --project ./EtlTool/EtlTool.csproj

# - Infrastructure
db-up:
	docker-compose up -d db

db-down:
	docker-compose stop db

# - Database Schema Setup
## psql $(DB_URL) -f $(SCHEMA_DIR)/V0__Reset_Schema.sql
## psql $(DB_URL) -f $(SCHEMA_DIR)/V1__Initial_Schema.sql
init-schema:
	@echo "Initializing database schemas..."
	psql $(DB_URL) -f $(SCHEMA_DIR)/V2__Inital_Staging_Schema.sql

# - Data Loading (Using your \copy script)
load-staging:
	@echo "Scrubbing only the junk date string..."
	@for file in $(DATA_DIR)/*.csv; do \
		LC_ALL=C tr -d '\r' < "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		LC_ALL=C sed -i '' 's/01\/00\/00 00:00:00//g' "$$file"; \
	done
	@echo "Streaming scrubbed data to Docker..."
	psql $(DB_URL) -f $(SCHEMA_DIR)/V3__Load_Staging_Data.sql

# - Execute the ETL Logic (C#)
convert:
	@echo "Starting C# ETL Conversion..."
	cd etl-tool && dotnet run

# - The "I messed up, start over" Command
full-reset: db-up init-schema load-staging
	@echo "Environment is reset and staged. Ready for ETL."

# - Cleaning Up
clean:
	docker-compose down -v
	rm -rf $(DATA_DIR)/*.csv