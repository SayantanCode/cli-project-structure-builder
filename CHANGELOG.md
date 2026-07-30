# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-31

The last published release was `1.0.1`; `1.1.0` below was never published. This release supersedes both — everything listed under `1.1.0` ships as part of this version too.

### Breaking

- Dropped Node 18 support — `engines.node` is now `>=20`. A current dependency (`ora`) pulls in a transitive dependency using a regex feature Node 18's engine can't parse; Node 18 has also been end-of-life since April 2025.

### Added

- **Composable generator ("🔧 Compose a Project")** — pick a base (Express in 3 flavors, Fastify, NestJS, or React+Vite in JS/TS) and independently mix in modules per dimension: auth (JWT), RBAC (simple role-based or permission-based), database (MongoDB+Mongoose), validation (Zod), testing (Jest/Vitest), Docker, CI (GitHub Actions), routing (React Router), styling (Tailwind CSS/MUI/Ant Design), and state (Zustand). Everything is fetched from a remote template registry and assembled at scaffold time, so new bases/modules show up automatically without a CLI update.
- **Full-stack in one command ("🔗 Compose a Full-Stack App")** — composes a backend and a frontend together into one repo (`backend/` + `frontend/`), with the frontend's auth prompt defaulting to match the backend's pick, and a root README tying the two together.
- **Non-interactive composer** — `create-structure compose --base=... --<dimension>=<key>... --name=...`, plus `--list` (discover valid base/module keys), `--yes`, `--install`, and `--fullstack` (with `backend:`/`frontend:`-prefixed dimension flags) for CI/scripted use.
- **Custom Structure from a GitHub repo** — point the Custom Structure flow at a public GitHub URL (repo root or `/tree/<branch>/<subpath>`) instead of only a local file, with a choice of structure-only (empty files) or structure + real file contents.
- **RBAC** as a scaffold-time dimension (simple role-based, or permission-based) for both the composer and the built-in Express+Mongoose boilerplates.
- A React+Vite frontend composer output that ships a gradient landing page, live component showcase, light/dark/system theming, a favicon, and ESLint + Prettier already configured to match `npm create vite`'s defaults — regardless of which styling library you pick.
- The built-in boilerplate menu is now fetched from a remote, data-driven registry instead of hardcoded JS-string templates, so adding a boilerplate no longer requires a CLI release.
- "⬅ Back to main menu" on every flow's first question, so picking the wrong top-level menu item doesn't require restarting the CLI.
- Per-choice descriptions on the main menu (shown under whichever option is highlighted) explaining what each mode is actually for.
- CI (GitHub Actions) now runs this repo's own test suite across Ubuntu/Windows/macOS × Node 20/22 on every push and PR.

### Changed

- Main menu redesigned: "Compose a Backend" and "Compose a Full-Stack App" merged into one "🔧 Compose a Project" entry that asks Backend-only / Frontend-only / Full-stack first; "Built-in Boilerplate" renamed "⚡ Quick Boilerplate", with each menu item's description now cross-referencing the other so it's clear which one to pick.
- Clearer error message when a degit/GitHub fetch fails specifically because of GitHub's unauthenticated rate limit (60 requests/hour), instead of degit's generic "commit not found"-style message that couldn't be told apart from a genuinely bad branch/URL.
- Every scaffold flow now prints a "next steps" hint on success, even when there's no known dev command to suggest, instead of some paths finishing silently.

### Fixed

- A real bug caught by this release's new CI: `db-mongoose`'s `MONGO_URI` template shipped with a literal, unsubstituted `{{projectName}}` in every composed backend's `.env.example` — module-contributed `.env.example`/README content bypassed the `{{projectName}}` placeholder substitution that regular template files already got.
- Hand-typed custom-structure trees using ASCII dashes (`-- filename`, as opposed to the Unicode box-drawing `─` character) no longer leave a stray dash stuck to every parsed file/folder name.
- `.github/CONTRIBUTING.md` no longer says "Contributing to My NPM Package" (leftover placeholder text) and now explains the two-repo split (this repo vs. `create-structure-templates`).

## [1.1.0] - 2026-07-26

### Added

- Interactive menu with three modes: Official Template passthrough (create-vite, create-next-app, create-react-app, Angular, Fastify, Nest.js), built-in boilerplates, and Custom Structure
- Built-in boilerplates for React+Vite, Next.js (App Router/Pages Router), and Express+Mongoose, each in JavaScript and TypeScript
- Optional automatic `npm install` after scaffolding a structure or boilerplate that includes a `package.json`
- Styled CLI output via `chalk`

### Fixed

- Tree-style text structures no longer leave a stray `─` character prefixed to every parsed file/folder name
- Restored non-interactive `create-structure <file> [outputDir]` usage for scripted/CI use (the interactive rewrite had made the menu unconditional)
- Dependency installation now uses `spawn` instead of building a shell command string

### Changed

- `.gitignore` now excludes `node_modules`, `.env`, logs, and OS files (previously empty)

## [1.0.0] - 2025-08-15

### Added

- Initial release 🎉
- Core functionality for creating directory structures from text files and JSON templates
