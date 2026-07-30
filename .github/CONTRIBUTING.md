# Contributing to create-structure-cli

Thanks for contributing! 🎉

This project is split across two repos:

- **[cli-project-structure-builder](https://github.com/SayantanCode/cli-project-structure-builder)** (this repo) — the CLI itself: `cli.js`, `lib/`, tests.
- **[create-structure-templates](https://github.com/SayantanCode/create-structure-templates)** — every built-in boilerplate, composer base, and composer module. The CLI fetches from this repo's `main` branch at runtime, so changes there go live immediately without a CLI release.

Bug in a generated project (wrong dependency, broken component, bad wiring)? That's almost always a `create-structure-templates` change, not a `cli.js` change.

## Reporting Bugs

- Search existing issues first.
- Include Node.js, npm versions, and OS details.
- If the bug is in a *generated* project, say which composer combo (base + modules) or built-in template produced it.
- Share a minimal reproduction if possible.

## Submitting Pull Requests (this repo)

1. Fork the repo
2. Create a new branch: `git checkout -b fix/some-bug`
3. Install dependencies: `npm install`
4. Run tests: `npm test` — all tests must pass
5. Submit a pull request; CI runs `npm test` automatically on every PR

## Submitting Pull Requests (templates repo)

1. Fork `create-structure-templates`
2. Add/edit a base, module, or template under `composer/` or `templates/`
3. Regenerate the index: `node scripts/generate-composer-index.mjs` (composer) or `node scripts/generate-index.mjs` (built-in templates)
4. Manually verify your change composes and builds — see that repo's README for the exact commands, since it has no local test runner of its own
5. Submit a pull request
