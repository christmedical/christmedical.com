# GitHub Branch Protection Setup

This document explains how to configure branch protection rules for the `main` branch on GitHub.

## Automatic Protection (Recommended)

The GitHub Actions workflow in `.github/workflows/branch-protection.yml` will automatically fail and alert when direct pushes to `main` are detected. However, this runs *after* the push, so it serves as a warning rather than a blocker.

## Manual Branch Protection (Required for Full Protection)

For complete protection, you need to configure branch protection rules in GitHub's web interface. This will **prevent** direct pushes at the server level.

### Steps to Configure Branch Protection

1. Go to your repository on GitHub
2. Click on **Settings** → **Branches**
3. Under **Branch protection rules**, click **Add rule**
4. Configure the following settings:

   **Branch name pattern**: `main`

   **Protect matching branches** - Enable these options:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (recommended: 1)
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass before merging** (if you have CI/CD)
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings** (requires admin override)
   - ✅ **Restrict who can push to matching branches** (optional, but recommended)
     - Only allow specific teams/users to push directly (usually just admins)

5. Click **Create** to save the rule

### What This Does

- **Prevents direct pushes**: Users cannot push directly to `main` via `git push`
- **Requires pull requests**: All changes must go through a PR
- **Requires approvals**: PRs need at least one approval before merging
- **Prevents force pushes**: Protects against accidental history rewrites

### Emergency Override

If you're a repository administrator and need to bypass protection in an emergency:

1. Go to the branch protection rule settings
2. Temporarily disable the rule
3. Make your emergency change
4. Re-enable the rule immediately

**Note**: This should only be done in true emergencies. The protection is there for a reason.

## Current Protection Status

- ✅ **Local Protection**: Git hooks prevent commits/pushes locally (via `scripts/dev-setup.sh`)
- ✅ **Remote Protection (Workflow)**: GitHub Actions alerts on direct pushes
- ⚠️ **Remote Protection (Server-level)**: Must be configured manually in GitHub Settings (see above)

## Verification

After setting up branch protection, test it:

```bash
# This should fail if protection is properly configured
git checkout main
git commit --allow-empty -m "Test commit"
git push origin main
```

You should see an error message indicating that direct pushes are not allowed.
