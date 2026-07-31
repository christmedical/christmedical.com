# Contributing to Christ Medical

Thanks for helping build tools for mission clinics.

## Dual license (why a CLA)

Christ Medical is free and open source under **AGPL-3.0**, with an optional
**commercial license** for parties who need different terms (see
[COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md)). To keep that dual-license model
honest, we need contributors to grant the copyright holder rights to license
their work under both AGPL and commercial terms. That is what the
[CLA](CLA.md) is for — without it, relicensing/dual-licensing becomes legally
fragile as the contributor base grows.

> **TODO (lawyer review):** Finalize [CLA.md](CLA.md) and commercial terms with
> counsel before treating contribution intake as production-ready.

## Before you start

1. Read [LICENSE](LICENSE) (AGPL-3.0) and [CLA.md](CLA.md).
2. Open an issue for non-trivial changes when practical.
3. Match existing code style; keep changes focused.
4. Update tests and [README.md](README.md) when behavior or tooling changes
   (see `.cursor/rules/tests-and-readme.mdc`).

## Accepting the CLA

**By opening a pull request, you agree that your contribution is submitted under
the terms of [CLA.md](CLA.md),** unless you conspicuously mark the submission
“Not a Contribution.”

Optional (recommended for clarity in git history): include a sign-off line in
your commit message:

```text
Signed-off-by: Your Name <you@example.com>
```

### CLA enforcement (intent)

**TODO (setup):** Wire a lightweight CLA check on pull requests — for example
[CLA assistant](https://github.com/cla-assistant/cla-assistant) (free GitHub App)
or a simple required checkbox / comment affirmation in the PR template. Do **not**
require a paid third-party service. Until that is live, maintainers should
confirm CLA awareness before merging external contributions.

## Development

See [README.md](README.md) for local setup (`make setup`, `make build`) and
project layout.

## Pull requests

- Prefer small, reviewable PRs.
- Use conventional commit messages when practical.
- Ensure `make build` (or the relevant subset) passes before requesting review.

## Questions

Contact the maintainer: jamey@mcelveen.us
