#!/bin/bash
#
# Development setup script for Christ Medical
# This script is idempotent - safe to run multiple times
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Banner
echo ""
echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║                                                       ║${NC}"
echo -e "${CYAN}${BOLD}║     ${MAGENTA}Christ Medical - Development Setup${CYAN}${BOLD}          ║${NC}"
echo -e "${CYAN}${BOLD}║                                                       ║${NC}"
echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: Checking Git Hooks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run the hook installation script
if [ -f "$SCRIPT_DIR/install-hooks.sh" ]; then
    bash "$SCRIPT_DIR/install-hooks.sh"
    HOOKS_EXIT_CODE=$?
    
    if [ $HOOKS_EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} Git hooks check complete"
    else
        echo ""
        echo -e "${RED}❌${NC} Git hooks installation failed"
        exit 1
    fi
else
    echo -e "${RED}❌ Error: install-hooks.sh not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: Verifying Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify hooks are installed
HOOKS_INSTALLED=0
if [ -f "$PROJECT_ROOT/.git/hooks/pre-commit" ] && [ -x "$PROJECT_ROOT/.git/hooks/pre-commit" ]; then
    echo -e "${GREEN}✓${NC} pre-commit hook is installed and executable"
    HOOKS_INSTALLED=$((HOOKS_INSTALLED + 1))
else
    echo -e "${RED}❌${NC} pre-commit hook is missing or not executable"
fi

if [ -f "$PROJECT_ROOT/.git/hooks/pre-push" ] && [ -x "$PROJECT_ROOT/.git/hooks/pre-push" ]; then
    echo -e "${GREEN}✓${NC} pre-push hook is installed and executable"
    HOOKS_INSTALLED=$((HOOKS_INSTALLED + 1))
else
    echo -e "${RED}❌${NC} pre-push hook is missing or not executable"
fi

echo ""
echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
if [ $HOOKS_INSTALLED -eq 2 ]; then
    echo -e "${CYAN}${BOLD}║  ${GREEN}✓ Setup Complete - All checks passed!${CYAN}${BOLD}              ║${NC}"
else
    echo -e "${CYAN}${BOLD}║  ${RED}❌ Setup Incomplete - Some checks failed${CYAN}${BOLD}            ║${NC}"
fi
echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Summary
echo -e "${BOLD}Summary:${NC}"
echo -e "  • Git hooks installed: ${GREEN}$HOOKS_INSTALLED/2${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} This script is idempotent. You can run it multiple times safely."
echo ""

if [ $HOOKS_INSTALLED -eq 2 ]; then
    exit 0
else
    exit 1
fi
