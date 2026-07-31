.PHONY: help setup setup-hooks install-hooks convert extract db-up db-down demo-up demo-down docker-up deploy deploy-login build ci run lockfile-sync schema-docs schema-docs-check mobile-test mobile-ios-test mobile-android-test

# Default target
.DEFAULT_GOAL := help

# Optional local overrides (copy .env.example → .env). Keeps secrets out of git.
-include .env

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

# Docker Compose (v2 plugin). Override: make demo-up COMPOSE="docker-compose"
COMPOSE ?= docker compose
# Demo stack: ephemeral Postgres + pre-seeded DB; api/web from registry unless you build locally.
# Defaults apply when .env is missing; .env overrides via include above.
DOCKERHUB_NAMESPACE ?= christmedical
IMAGE_TAG ?= latest
export DOCKERHUB_NAMESPACE
export IMAGE_TAG
# Standalone file (avoids merge with base db volumes + tmpfs conflict on older Compose).
COMPOSE_DEMO=-f $(ROOT_DIR)/docker-compose.demo.yaml
EXTRACT_SCRIPT=$(ETL_DIR)/Extract_Access_DB.sh
DATA_DIR=$(ROOT_DIR)/conversion/data/02_extracted

##@ Development Setup

# Display help
all:help

build: ## Full local CI: dotnet format, build, test; frontend lint, test, build
	@echo "$(BLUE)dotnet format (verify)...$(NC)"
	dotnet restore "$(ROOT_DIR)/christmedical.com.sln"
	dotnet format "$(ROOT_DIR)/christmedical.com.sln" --verify-no-changes --no-restore
	@echo "$(BLUE).NET build + test...$(NC)"
	dotnet build "$(ROOT_DIR)/christmedical.com.sln" -c Release --no-restore
	dotnet test "$(ROOT_DIR)/christmedical.com.sln" -c Release --no-build
	@echo "$(BLUE)frontend npm ci + lint + test + build...$(NC)"
	cd "$(ROOT_DIR)/frontend" && npm ci && npm run ci
	@echo "$(GREEN)All checks passed.$(NC)"

ci: build ## Alias for build (CI parity)

mobile-test: mobile-ios-test mobile-android-test ## Run iOS + Android mobile unit tests

mobile-ios-test: ## Run iOS ChristMedicalKit unit tests (SwiftPM; no Simulator required)
	@echo "$(BLUE)iOS unit tests (SwiftPM)...$(NC)"
	cd "$(ROOT_DIR)/mobile/ios" && swift test
	@echo "$(GREEN)iOS unit tests passed.$(NC)"

mobile-android-test: ## Run Android unit tests (requires JDK 11+ and Android SDK)
	@echo "$(BLUE)Android unit tests...$(NC)"
	cd "$(ROOT_DIR)/mobile/android" && ./gradlew testDebugUnitTest --quiet
	@echo "$(GREEN)Android unit tests passed.$(NC)"

schema-docs: ## Regenerate docs/schema from Postgres via tbls (Docker ephemeral DB if daemon is up)
	@if docker info >/dev/null 2>&1; then \
		bash scripts/schema-docs-docker.sh; \
	else \
		bash scripts/schema-docs.sh; \
	fi

schema-docs-check: ## Fail when docs/schema drifts from migrated database (requires TBLS_DSN)
	@bash scripts/schema-docs-check.sh

help: ## Display this help message
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)  Christ Medical - Available Make Targets$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""
	@echo "Christ Medical Makefile Commands:"
	@echo "  db-up         - Start the Postgres Docker container"
	@echo "  db-down       - Stop the Postgres Docker container"
	@echo "  run           - Stop everything, rebuild if needed, start demo stack (open http://localhost:3000)"
	@echo "  demo-up       - Start demo stack without full stop/rebuild cycle"
	@echo "  init-schema   - Run V0, V1, and V2 SQL scripts (Reset & Build)"
	@echo "  load-staging  - Load CSVs into staging via psql \copy"
	@echo "  Convert       - Run the Conversion"
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

convert-legacy: reset-db
	@echo "Starting extraction..."
	./conversion/convert.sh
	@echo "Running ETL via .NET..."
	dotnet run --project ./conversion/etl-tool/EtlTool.csproj

# - Infrastructure
db-up:
	docker-compose up -d db

db-down:
	docker-compose stop db

docker-up: demo-up ## Alias for demo-up (Docker web + API + ephemeral DB)

demo-up: ## Start demo stack (db + api + web) in background; UI http://localhost:3000 API http://localhost:5050/api
	@echo "$(BLUE)Starting demo stack (DOCKERHUB_NAMESPACE=$(DOCKERHUB_NAMESPACE) IMAGE_TAG=$(IMAGE_TAG))...$(NC)"
	cd "$(ROOT_DIR)" && $(COMPOSE) $(COMPOSE_DEMO) up -d
	@echo ""
	@echo "$(GREEN)Demo containers are up.$(NC)"
	@echo "$(GREEN)  → Open the app:$(NC)  http://localhost:3000"
	@echo "$(GREEN)  → API base:$(NC)       http://localhost:5050/api"
	@echo "$(GREEN)  → Example:$(NC)        http://localhost:5050/api/v1/patients?tenantId=1"
	@echo ""
	@cd "$(ROOT_DIR)" && $(COMPOSE) $(COMPOSE_DEMO) ps
	@echo ""
	@echo "$(YELLOW)Logs (if a page is blank):$(NC) $(COMPOSE) $(COMPOSE_DEMO) logs -f web"
	@echo "$(YELLOW)Stop:$(NC) make demo-down"
	@echo ""

demo-down: ## Stop and remove demo stack (ephemeral DB data is discarded)
	@echo "$(BLUE)Stopping demo stack...$(NC)"
	cd "$(ROOT_DIR)" && $(COMPOSE) $(COMPOSE_DEMO) down
	@echo "$(GREEN)Demo stopped.$(NC)"

run: ## Stop local processes + containers, rebuild if needed, start full stack (UI :3000 API :5050)
	@bash "$(ROOT_DIR)/scripts/run-local.sh"

lockfile-sync: ## Regenerate frontend/package-lock.json on Linux (fixes Docker npm ci after Mac npm install)
	@echo "$(BLUE)Regenerating package-lock.json in node:20-alpine...$(NC)"
	docker run --rm -v "$(ROOT_DIR)/frontend:/app" -w /app node:20-alpine sh -c "rm -rf node_modules && npm install"
	@echo "$(GREEN)Done. Commit frontend/package-lock.json if changed.$(NC)"

# Docker Hub: non-interactive login when DOCKER_USERNAME + DOCKER_PASSWORD are set (e.g. from .env);
# otherwise use existing ~/.docker/config.json or run interactive docker login once.
deploy-login:
	@if [ -n "$(DOCKER_USERNAME)" ] && [ -n "$(DOCKER_PASSWORD)" ]; then \
		echo "$(BLUE)Logging in to docker.io as $(DOCKER_USERNAME)$(NC)"; \
		if [ "$(DOCKER_USERNAME)" != "$(DOCKERHUB_NAMESPACE)" ]; then \
			echo "$(YELLOW)Note: DOCKER_USERNAME ($(DOCKER_USERNAME)) != DOCKERHUB_NAMESPACE ($(DOCKERHUB_NAMESPACE)).$(NC)"; \
			echo "$(YELLOW)  Push only works if this account can write to that namespace (org membership, etc.).$(NC)"; \
		fi; \
		docker logout docker.io 2>/dev/null || true; \
		printf '%s' '$(DOCKER_PASSWORD)' | docker login docker.io -u '$(DOCKER_USERNAME)' --password-stdin; \
	elif [ -f "$(HOME)/.docker/config.json" ] && grep -q 'index.docker.io' "$(HOME)/.docker/config.json" 2>/dev/null; then \
		echo "$(GREEN)Using existing Docker Hub auth in ~/.docker/config.json$(NC)"; \
	else \
		echo "$(YELLOW)No DOCKER_USERNAME/DOCKER_PASSWORD in Makefile env — run: docker login docker.io$(NC)"; \
		docker login docker.io; \
	fi

deploy: deploy-login ## Build and push christmedical-api, christmedical-web, christmedical-demo-db to Docker Hub
	@echo "$(BLUE)Building and pushing $(DOCKERHUB_NAMESPACE)/*:$(IMAGE_TAG) ...$(NC)"
	cd "$(ROOT_DIR)" && docker build -f api/Dockerfile \
		-t "$(DOCKERHUB_NAMESPACE)/christmedical-api:$(IMAGE_TAG)" \
		-t "$(DOCKERHUB_NAMESPACE)/christmedical-api:latest" .
	cd "$(ROOT_DIR)" && docker build -f frontend/Dockerfile \
		--build-arg NEXT_PUBLIC_API_URL=http://localhost:5050/api \
		-t "$(DOCKERHUB_NAMESPACE)/christmedical-web:$(IMAGE_TAG)" \
		-t "$(DOCKERHUB_NAMESPACE)/christmedical-web:latest" .
	cd "$(ROOT_DIR)" && docker build -f demo/db/Dockerfile \
		-t "$(DOCKERHUB_NAMESPACE)/christmedical-demo-db:$(IMAGE_TAG)" \
		-t "$(DOCKERHUB_NAMESPACE)/christmedical-demo-db:latest" .
	docker push "$(DOCKERHUB_NAMESPACE)/christmedical-api:$(IMAGE_TAG)"
	docker push "$(DOCKERHUB_NAMESPACE)/christmedical-api:latest"
	docker push "$(DOCKERHUB_NAMESPACE)/christmedical-web:$(IMAGE_TAG)"
	docker push "$(DOCKERHUB_NAMESPACE)/christmedical-web:latest"
	docker push "$(DOCKERHUB_NAMESPACE)/christmedical-demo-db:$(IMAGE_TAG)"
	docker push "$(DOCKERHUB_NAMESPACE)/christmedical-demo-db:latest"
	@echo "$(GREEN)Published.$(NC) Pull with: DOCKERHUB_NAMESPACE=$(DOCKERHUB_NAMESPACE) IMAGE_TAG=$(IMAGE_TAG) make docker-up"

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

# - Execute the ETL Logic (C#)  — project lives under conversion/
convert:
	@echo "Starting Conversion..."
	cd conversion/etl-tool && dotnet run --project ./EtlTool.csproj

# - The "I messed up, start over" Command
full-reset: db-up init-schema load-staging
	@echo "Environment is reset and staged. Ready for ETL."

# - Cleaning Up
clean:
	docker-compose down -v
	rm -rf $(DATA_DIR)/*.csv