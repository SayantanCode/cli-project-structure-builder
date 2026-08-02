# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-02

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
- **PostgreSQL + Prisma** as a second database option (`db-prisma-postgres`, TypeScript bases only) — a fully typed client via Prisma 7's driver-adapter API, `prisma.config.ts`, and `db:push`/`db:migrate`/`db:studio` scripts, plus a matching `auth-jwt-prisma` module so the JWT auth contract works identically no matter which database you picked.
- **Real-time (WebSocket)** as a composer dimension — Socket.IO for Express/Fastify backends, and a matching `useRealtime()` hook + live "who's online" presence list for the React frontend, authenticated with the same JWT the REST API uses.
- **Caching, background jobs, and scheduled jobs** as composer dimensions: Redis (a `cache.get/set/del/getOrSet` helper, not just the raw client), BullMQ (a worked producer/worker example — the worker runs as its own process on purpose, so a slow job never blocks an HTTP response), and node-cron (its README leads with the real multi-instance duplicate-execution gotcha most tutorials skip, and documents both ways out).
- **A `loaders` startup pattern** — every backend base now has `src/loaders/index.ts`, connecting every external resource (database, cache, queue, ...) in sequence before the app starts accepting requests, instead of each module hand-rolling its own spot in `server.ts`.
- **Logging is now a real, removable choice**, not a hardcoded default — Pino or Winston, both wired the same way as every other dimension. Picking neither genuinely means no third-party logging library at all (a bare, zero-dependency console logger with the same call signature), not secretly Pino anyway.
- **A Mongoose transaction helper** (`withTransaction`) that wraps the session/`withTransaction()` boilerplate into one call, with README docs on the real replica-set requirement — including the actual error MongoDB throws without one, not just the textbook one.
- Every composed backend now also ships `GET /health`/`GET /healthz` (liveness/readiness — reports live connectivity for every connected dependency you picked), a graceful `SIGTERM`/`SIGINT` shutdown handler, fail-fast env-var validation (Zod) at boot, rate-limited login/register (20 requests/15 min per IP), and an `npm run seed` script so `npm run dev` doesn't start against an empty database.
- The React + Vite composer output now has real pages — a floating nav and a dedicated, animated 404 page — instead of everything crammed onto one screen, plus a card-grid showcase for the demo components, a modernized counter demo, and forms with fixed-height error areas (no layout shift when a validation error appears) and a show/hide-password toggle.
- `--help`/`-h` — full usage for every command and flag, from anywhere (including `compose --help`) — and `--version`/`-v`.
- **`compose` now prompts for whatever a partial command didn't answer**, instead of failing outright. Run `create-structure compose --name=my-api` in a real terminal and it walks through the rest — scope, base, every dimension — one question at a time, using the same choices and defaults the fully-interactive flow does, and skipping anything already answered via flag. Piped/CI input keeps the strict old behavior (missing flag = clear error, no hanging prompt).
- A flag → valid-key(s) reference table in the README, next to the non-interactive `compose` example, so you don't have to cross-reference the prose dimension list against the actual keys you'd type.

### Changed

- Main menu redesigned: "Compose a Backend" and "Compose a Full-Stack App" merged into one "🔧 Compose a Project" entry that asks Backend-only / Frontend-only / Full-stack first; "Built-in Boilerplate" renamed "⚡ Quick Boilerplate", with each menu item's description now cross-referencing the other so it's clear which one to pick.
- Clearer error message when a degit/GitHub fetch fails specifically because of GitHub's unauthenticated rate limit (60 requests/hour), instead of degit's generic "commit not found"-style message that couldn't be told apart from a genuinely bad branch/URL.
- Every scaffold flow now prints a "next steps" hint on success, even when there's no known dev command to suggest, instead of some paths finishing silently.

### Fixed

- A real bug caught by this release's new CI: `db-mongoose`'s `MONGO_URI` template shipped with a literal, unsubstituted `{{projectName}}` in every composed backend's `.env.example` — module-contributed `.env.example`/README content bypassed the `{{projectName}}` placeholder substitution that regular template files already got.
- Hand-typed custom-structure trees using ASCII dashes (`-- filename`, as opposed to the Unicode box-drawing `─` character) no longer leave a stray dash stuck to every parsed file/folder name.
- `.github/CONTRIBUTING.md` no longer says "Contributing to My NPM Package" (leftover placeholder text) and now explains the two-repo split (this repo vs. `create-structure-templates`).
- The "Real-time" composer dimension was completely unreachable through the actual CLI — never wired into the dimension list the interactive prompts, `--<dimension>=` flags, and `--list` all read from.
- Bare boolean flags with no value (`--docker`, `--ci` — exactly as this README documents) silently composed a project with neither a Dockerfile nor a CI workflow, with no error at all. They now resolve correctly whenever a dimension has exactly one valid option, and fail loudly with the valid keys listed anywhere that'd be ambiguous instead of guessing.
- The published npm package now ships only `cli.js` and `lib/` (an explicit `files` allowlist) — previously, anything not excluded by `.npmignore` would ship, including any generated test project left in the repo root from manual testing.

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
