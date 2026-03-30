.PHONY: help setup setup-hooks install-hooks convert

# Default target
.DEFAULT_GOAL := help

# Colors for output (if terminal supports it)
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

##@ Development Setup

help: ## Display this help message
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(BLUE)  Christ Medical - Available Make Targets$(NC)"
	@echo "$(BLUE)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

setup: ## Run the full development setup (installs git hooks and verifies setup)
	@echo "$(BLUE)Running development setup...$(NC)"
	@bash scripts/dev-setup.sh

setup-hooks: install-hooks ## Alias for install-hooks

install-hooks: ## Install git hooks only (idempotent)
	@echo "$(BLUE)Installing git hooks...$(NC)"
	@bash scripts/install-hooks.sh

convert: ## Convert the Access database to CSV format (idempotent)
	@echo "$(BLUE)Converting access database to CSV...$(NC)"
	@bash ./conversion/convert.sh
