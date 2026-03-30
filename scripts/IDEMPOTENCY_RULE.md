# Idempotency Rule for Scripts

## Rule

**All scripts in the `scripts/` directory and any scripts they call MUST be idempotent.**

## What is Idempotency?

An idempotent script is one that can be run multiple times with the same result. Running it once or running it a hundred times should produce the same end state without errors or side effects.

## Requirements

1. **Check Before Action**: Before making any changes, scripts should check if the desired state already exists.

2. **Safe to Re-run**: Scripts should never fail if run multiple times. They should detect existing installations/configurations and skip or update them as needed.

3. **No Duplicate Operations**: Scripts should not create duplicate entries, install things multiple times, or perform redundant operations.

4. **State Verification**: Scripts should verify the current state and only make changes if needed.

## Examples

### ✅ Good (Idempotent)

```bash
# Check if hook exists and is up-to-date before installing
if [ -f "$target_file" ]; then
    if cmp -s "$source_file" "$target_file"; then
        echo "Already installed and up-to-date"
        return 0
    else
        echo "Updating existing hook"
    fi
fi
cp "$source_file" "$target_file"
```

### ❌ Bad (Not Idempotent)

```bash
# Always copies without checking - will fail if file exists and is read-only
cp "$source_file" "$target_file"
```

## Implementation Checklist

When creating or modifying scripts, ensure:

- [ ] Script checks for existing state before making changes
- [ ] Script handles "already exists" scenarios gracefully
- [ ] Script can be run multiple times without errors
- [ ] Script produces the same end state regardless of how many times it's run
- [ ] Script provides clear feedback about what it's doing (installing vs. already installed)

## Benefits

1. **User-Friendly**: Developers can run setup scripts without worrying about breaking things
2. **CI/CD Safe**: Scripts can be run in automated environments without special handling
3. **Maintenance**: Easier to maintain and debug
4. **Reliability**: Reduces risk of partial installations or corrupted states
