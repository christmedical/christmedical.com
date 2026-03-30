#!/bin/bash
#
# Idempotent script to install git hooks
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_SOURCE_DIR="$SCRIPT_DIR/git-hooks"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Function to install a hook
install_hook() {
    local hook_name=$1
    local source_file="$HOOKS_SOURCE_DIR/$hook_name"
    local target_file="$GIT_HOOKS_DIR/$hook_name"
    
    if [ ! -f "$source_file" ]; then
        echo -e "${YELLOW}⚠️  Warning: Source hook file not found: $source_file${NC}"
        return 1
    fi
    
    # Check if hook already exists and is identical
    if [ -f "$target_file" ]; then
        if cmp -s "$source_file" "$target_file"; then
            echo -e "${BLUE}✓${NC} Hook ${GREEN}$hook_name${NC} already installed and up-to-date"
            return 0
        else
            echo -e "${YELLOW}⚠️  Hook $hook_name exists but differs. Updating...${NC}"
        fi
    else
        echo -e "${BLUE}→${NC} Installing hook ${GREEN}$hook_name${NC}"
    fi
    
    # Copy the hook
    cp "$source_file" "$target_file"
    chmod +x "$target_file"
    
    echo -e "${GREEN}✓${NC} Hook ${GREEN}$hook_name${NC} installed successfully"
    return 0
}

# Install hooks
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Installing Git Hooks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

install_hook "pre-commit"
install_hook "pre-push"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Git hooks installation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
