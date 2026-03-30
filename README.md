# Christ Medical

## Development Setup

### Initial Setup

Run the development setup to configure your local environment:

**Using Make (Recommended - Unix/Mac/Linux):**
```bash
make setup
```

**Or run the script directly:**

**Unix/Mac/Linux:**
```bash
./scripts/dev-setup.sh
```

**Windows:**
```cmd
scripts\dev-setup.bat
```

**Available Make targets:**
- `make setup` - Run full development setup (installs hooks and verifies)
- `make install-hooks` - Install git hooks only
- `make help` - Show all available targets

This will install git hooks that protect the `main` branch from direct commits and pushes.

### Branch Protection

The `main` branch is protected both locally and remotely:

- **Local Protection**: Git hooks prevent direct commits and pushes to `main`
- **Remote Protection**: GitHub Actions workflow enforces branch protection rules

#### Working with Protected Branches

Always work on feature branches:

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "Your commit message"

# Push the feature branch
git push origin feature/your-feature-name

# Create a Pull Request to merge into main
```

#### If You Make a Mistake

If you accidentally commit to `main`:

1. **Undo the commit (keeps changes)**: `git reset --soft HEAD~1`
2. **Or undo the commit (discards changes)**: `git reset --hard HEAD~1`
3. **Create a feature branch**: `git checkout -b feature/your-feature-name`
4. **Commit again on the feature branch**

If you accidentally push to `main`:

1. Create a revert branch: `git checkout -b revert/main-push`
2. Reset to previous state: `git reset --hard origin/main@{1}`
3. Force push the revert: `git push origin revert/main-push --force`
4. Create a PR to revert the changes

## Project Structure

- `scripts/` - Development setup and maintenance scripts
- `.github/workflows/` - GitHub Actions workflows for CI/CD and branch protection
