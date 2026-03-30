# Scripts Directory

This directory contains development setup and maintenance scripts for the Christ Medical project.

## Setup Scripts

### `dev-setup.sh` (Unix/Mac/Linux)

Run this script to set up your development environment:

```bash
./scripts/dev-setup.sh
```

Or from the project root:

```bash
bash scripts/dev-setup.sh
```

### `dev-setup.bat` (Windows)

Run this script to set up your development environment on Windows:

```cmd
scripts\dev-setup.bat
```

## What These Scripts Do

The setup scripts will:

1. **Install Git Hooks**: Automatically install pre-commit and pre-push hooks that protect the `main` branch
2. **Verify Installation**: Check that all hooks are properly installed and executable
3. **Provide Feedback**: Display colorful, informative output about the setup process

## Git Hooks

The hooks installed by the setup scripts will:

- **pre-commit**: Prevent direct commits to the `main` branch locally
- **pre-push**: Prevent direct pushes to the `main` branch

Both hooks provide helpful error messages and instructions for fixing mistakes.

## Idempotency

All scripts in this directory are **idempotent**, meaning you can run them multiple times safely. They will:

- Check if hooks are already installed
- Only update hooks if they've changed
- Skip installation if everything is already set up correctly

See `IDEMPOTENCY_RULE.md` for more details about the idempotency requirement.

## Manual Hook Installation

If you need to install hooks manually, you can run:

```bash
# Unix/Mac/Linux
bash scripts/install-hooks.sh

# Windows
scripts\install-hooks.bat
```

## Troubleshooting

### Hooks Not Working

1. Make sure hooks are executable: `chmod +x .git/hooks/pre-commit .git/hooks/pre-push`
2. Re-run the setup script: `./scripts/dev-setup.sh`
3. Verify hooks exist: `ls -la .git/hooks/`

### Need to Bypass Hooks (Emergency Only)

If you absolutely need to bypass hooks (not recommended):

```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# Skip pre-push hook
git push --no-verify
```

**Warning**: Only use `--no-verify` in emergencies. The main branch should always be protected.
