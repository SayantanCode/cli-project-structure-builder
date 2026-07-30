# create-structure-cli — Project Audit & Roadmap

**Purpose of this file:** a living, checkable backlog. Every item below is a specific, actionable finding from a full audit of both repos (`cli-project-structure-builder` + `create-structure-templates`) plus 2026 competitive/industry research. When you ship something on this list, change its `[ ]` to `[x]` and add a one-line note (date + what actually happened) so this stays trustworthy over time instead of turning into another stale doc.

Sourced claims link to where they came from. Unsourced items are direct findings from reading the code/repos themselves — verify they're still true before acting, since the codebase moves fast.

---

## 🚨 Critical — do these before anything else on this list

Nothing below matters to a real user until this section is done. Every feature built this entire session — the whole composer system, RBAC, the frontend composer, GitHub-repo sourcing, non-interactive mode, the full-stack flow, the menu redesign — **is currently invisible to anyone who installs the package**, because it's never been published.

- [ ] **Publish to npm.** Confirmed via `npm view create-structure-cli version` → **`1.0.1`**, published **2025-08-16**. Local `package.json` says `1.1.0`, but that version has never been published — meaning it, and everything built after it, doesn't exist for real users today. `npx create-structure-cli` right now gives someone the pre-composer, pre-RBAC, pre-frontend tool from a year ago.
- [ ] **Bump the version properly and backfill `CHANGELOG.md`.** It stops at `[1.1.0] - 2026-07-26` and doesn't mention the composer, RBAC, frontend composer, theming, GitHub Custom Structure sourcing, non-interactive `compose` command, the full-stack flow, or the menu redesign — i.e., nearly everything currently in the repo. Decide the version bump (this is easily a `2.0.0`, given how much surface area changed) and write real entries.
- [ ] **Fix `.github/CONTRIBUTING.md`** — it literally says "# Contributing to My NPM Package". Placeholder text that was never replaced; looks unmaintained to anyone who opens it.
- [ ] **Add CI to the CLI repo itself.** Confirmed: no `.github/workflows/` exists in `cli-project-structure-builder`. The tool generates GitHub Actions workflows for *other people's* projects but doesn't run its own 14 tests on push/PR. Anyone can currently merge a change that breaks `npm test` and nothing will flag it.
- [ ] **Add CI/validation to the templates repo.** Confirmed: no `.github/`, no `package.json`, no automated check at all in `create-structure-templates`. Every verification this session (does this base compile, does this module combo build, does ESLint pass) was done by hand via ad-hoc Node scripts. A bad commit to a base/module file goes live to every user immediately (the CLI always fetches `main`) with zero safety net. At minimum: a workflow that composes a representative matrix of base+module combos and runs `npm run build` / `tsc` on each.

---

## 📦 Dependency currency

Checked each against its actual current npm `latest` (not guessed). Several composer templates are now a full major version or more behind what a user would get from the official tool it's meant to compete with — directly undercuts the "as good as or better than official channels" goal.

| Package | Pinned in templates | Current latest | Gap |
| --- | --- | --- | --- |
| `react` / `react-dom` | ^18.3.1 | 19.2.8 | 1 major |
| `vite` | ^6.4.3 | 8.2.0 | 2 majors |
| `typescript` | ^5.4.5 | 7.0.2 | large — TS7 is the native/Go-port rewrite, needs real compatibility testing before bumping, not a blind bump |
| `express` (backend bases) | ^4.19.2 | 5.2.1 | 1 major |
| `mongoose` | ^8.4.1 | 9.9.0 | 1 major |
| `zustand` | ^4.5.4 | 5.0.14 | 1 major |
| `@mui/material` | ^9.2.0 | 9.2.0 | current ✅ |
| `antd` | ^6.5.2 | 6.5.2 | current ✅ |
| `fastify` | ^5.10.0 | 5.11.0 | current ✅ (minor gap only) |
| `@nestjs/core` | ^11.1.28 | 11.1.28 | current ✅ |

- [ ] Bump React 18→19 across `react-vite-jsx`/`react-vite-tsx` bases + every frontend module — check for breaking changes in the React Compiler / new hooks / any deprecated APIs the current components use first.
- [ ] Bump Vite 6→8 — check the Vite 7/8 migration guides for config changes (this project already went 5→6 once for a real CVE, so there's precedent for careful, justified bumps rather than blind ones).
- [ ] Bump Express 4→5 in all three Express bases — Express 5 changes some middleware/error-handling semantics, needs real testing, not just a version bump.
- [ ] Bump Mongoose 8→9 in `db-mongoose`.
- [ ] Bump Zustand 4→5 in `state-zustand`.
- [ ] Investigate TypeScript 7 separately and cautiously — it's a from-scratch native compiler port, not an incremental release; verify `ts-node`/`tsx`/build tooling compatibility before touching any TS base.
- [ ] Whatever the bump strategy, re-run this session's full verification discipline (compose → install → build → lint → real browser check) on every affected combo before shipping.

---

## 🧱 Missing composer dimensions (real gaps vs. what a 2026 full-stack starter should offer)

- [ ] **A SQL + modern ORM database option.** Mongoose is the *only* database choice today. 2026 research: Prisma has ~9.7M weekly downloads and is described as "the dominant default choice for traditional full-stack applications" in 2026, while Mongoose has "become less preferred for modern TypeScript development." Drizzle (~7.4M weekly downloads) is the pick for edge/serverless deployments. [Encore: Drizzle vs Prisma 2026](https://encore.dev/articles/drizzle-vs-prisma) · [Bytebase comparison](https://www.bytebase.com/blog/drizzle-vs-prisma/) · [npmtrends](https://npmtrends.com/drizzle-orm-vs-mongoose-vs-prisma). Add a `db-prisma-postgres` (or Drizzle) module alongside `db-mongoose`, not instead of it — Mongoose/Mongo is still a legitimate, simple choice for many projects.
- [ ] **A modern auth option beyond hand-rolled JWT.** [Better Auth](https://makerkit.dev/blog/tutorials/better-auth-vs-clerk) has emerged as the 2026 default for new TypeScript apps — 28,600+ GitHub stars, 150K+ weekly downloads, and it *absorbed* Auth.js/NextAuth (now maintenance-mode only) in early 2026. It ships 2FA, passkeys, and RBAC-as-a-plugin out of the box, which is strictly more than `auth-jwt` offers today. This doesn't mean rip out the current hand-rolled implementation (it's simple, auditable, and dependency-light — a real advantage per the trust-positioning research below) — but offer Better Auth as a second, richer option for people who want social login/2FA/passkeys without hand-rolling it.
- [ ] **Real-time / WebSocket module.** See the dedicated section below — this is a whole missing dimension, not a small gap.
- [ ] **tRPC as an alternate API layer**, at least for the Express/Fastify + React-Vite combo. 2026 research is consistent: tRPC has become close to a default for TypeScript-monorepo full-stack apps because it "eliminates client/server type drift that causes 30%+ of production bugs," while REST remains the right default only for *public* APIs consumed by outside developers. [DEV Community: tRPC vs REST vs GraphQL 2026](https://dev.to/whoffagents/trpc-vs-rest-vs-graphql-in-2026-a-saas-builders-honest-take-459k) · [APIScout](https://apiscout.dev/guides/trpc-vs-graphql-vs-rest-2026). Since this composer's whole pitch is "backend and frontend wired to match," tRPC is a very natural fit — arguably a bigger differentiator than the current hand-wired REST contract.
- [ ] GraphQL as a lower-priority third API-layer option — REST still dominates job listings (70%+) so this is genuinely optional, not urgent.

---

## ⚡ Real-time features (explicitly called out as never addressed)

Confirmed: there is no real-time/WebSocket module or dimension anywhere in the composer today. 2026 context: Socket.IO (latest stable 4.8.3) remains "one of the most popular and reliable JavaScript libraries for adding real-time, bidirectional communication," and Node 22 LTS now ships a native WebSocket client built in. [DEV Community Socket.IO guide 2026](https://dev.to/abanoubkerols/socketio-the-complete-guide-to-building-real-time-web-applications-2026-edition-c7h) · [ZeonEdge: building real-time apps 2026](https://zeonedge.com/blog/building-real-time-applications-websockets-2026-architecture-scaling)

- [ ] New `realtime` dimension for backend bases: a `realtime-socketio` module (Express/Fastify — NestJS has its own first-class WebSocket gateway support worth using natively instead) with a working namespace/room example, wired through the same auth middleware the `auth-jwt` module already sets up (so a socket connection can be authenticated the same way an HTTP request is).
- [ ] Matching frontend module: a `useSocket`/`RealtimeProvider` hook + a small live demo component (a shared counter or presence indicator) in the component showcase, same pattern as the existing `CounterDemo`/`AuthStatus` demos.
- [ ] Consider Server-Sent Events (SSE) as a lighter-weight alternative dimension for one-way server→client updates — much simpler than WebSockets for cases (notifications, progress bars) that don't need bidirectional communication.
- [ ] Separately from a *module*, the full-stack flow itself isn't "real-time" in the dev-loop sense either: today it's two `npm run dev` commands in two terminals. A `concurrently`-based root script (or a docker-compose for local dev, spinning up backend + frontend + Mongo together) would make the full-stack flow feel like one live thing instead of two coordinated-by-hand processes.

---

## ❓ What questions actually produce a good project (missing but high-value dimensions)

These are the things an experienced engineer configures in the first hour of a real project that this composer never asks about. Grounded in 2026 Node.js best-practices research: a "flawless configuration setup" needs typed, fail-fast validated config with secrets kept outside committed code, and production apps need structured logs, request tracing, and centralized error handling. [nodebestpractices (July 2026)](https://github.com/goldbergyoni/nodebestpractices) · [NodeStack: best observability platforms 2026](https://nodejs.tech/posts/best-nodejs-observability-error-tracking-platforms-2026/)

- [ ] **Environment variable validation** — a `zod`-based env schema that fails fast and loudly at boot if a required var is missing/malformed, instead of the current plain `process.env.X || fallback` pattern. Small module, high value, and it's the single most commonly-cited "every real project should do this" practice in the research.
- [ ] **Structured logging** (pino, given it's the fastest/most common pick for Node) replacing the current plain `morgan` dev-only logging — a real logger with levels and structured (JSON) output is table stakes for anything beyond a toy project.
- [ ] **Error tracking hook** (Sentry) — even just a wired-up-but-optional integration point, matching how `ErrorBoundary`'s README already says "extend `componentDidCatch` to report to Sentry" on the frontend side; do the equivalent on the backend's centralized error handler.
- [ ] **API documentation** — OpenAPI/Swagger generation for the REST-based backends (or a tRPC panel if the tRPC module above gets built). A composed API with zero API docs is a real gap for anything meant to be used by a frontend team or third party.
- [ ] **Rate limiting** — basic abuse protection (`express-rate-limit` or equivalent) on the auth endpoints at minimum; login/register routes with no rate limiting is a real, not theoretical, security gap.
- [ ] **Health-check endpoint + graceful shutdown** — `/healthz` returning DB-connectivity status, and a `SIGTERM` handler that closes the DB connection and in-flight requests cleanly. Both are near-universal requirements the moment anything gets containerized/deployed (and this tool already ships a Docker module).
- [ ] **Seed data / fixtures script** — a `npm run seed` that populates a couple of test users/records, so `npm run dev` doesn't start against a totally empty database.
- [ ] **i18n** for the frontend composer — even a minimal `react-i18next` setup with one extra locale would matter for reaching a non-English-first "large audience."
- [ ] **Feature flags** — a minimal, no-external-service flag-check utility (even just an env-driven boolean map) as a starting point.
- [ ] **Email service hook** (Resend/SendGrid) — extremely common early real-project need (password reset, welcome email) and it's what most SaaS boilerplates below bundle as a headline feature.
- [ ] **Payments hook** (Stripe) — see competitive positioning below; this is explicitly what the paid SaaS-boilerplate competitors monetize around, and even a documented "wire Stripe in here" stub narrows that gap without committing to a full billing system.

---

## 🏗️ Big architectural bets (carried over, still open)

Already identified and deliberately deferred earlier — still valid, still large:

- [ ] Monorepo output option for the full-stack flow (pnpm workspace / Turborepo-style) instead of two independent `backend`/`frontend` folders. 2026 research on `create-t3-turbo` is a useful reference point: it's explicitly positioned for "two or more deployments that benefit from shared code" (e.g., web + mobile sharing one API/DB layer) and is *not* recommended as a default — "start with a single project and add the monorepo when you have a concrete reason." [StarterPick: T3 Turbo review 2026](https://starterpick.com/guides/create-t3-turbo-review-2026) · [T3 Turbo](https://turbo.t3.gg/). Translation: don't make monorepo the default output — offer it as an explicit opt-in for people who actually need shared packages (e.g., once a mobile/Expo option ever exists).
- [ ] `copier`-style update/re-sync command so a previously-scaffolded project can pull in later template fixes — the single biggest structural weakness shared by all one-shot generators (Yeoman, Cookiecutter) per prior research this session.
- [ ] Non-JS backend option (Python/FastAPI or Go) — large audience expansion, but should come after the JS-side gaps above are closed, since most prospective users won't discover the JS-side differentiators yet anyway (see Documentation & Reach below).

---

## 🖥️ CLI UX / decision fatigue

2026 research on this is blunt: "decision fatigue happens when the brain has to make too many choices in a row... people avoid effortful trade-offs, delay decisions, and default to inaction," and the fix is to "curate first, expand on demand" rather than presenting a large unstructured set of choices. [Medium: 68% of users abandon tasks due to decision fatigue](https://medium.com/@claus.nisslmueller/68-of-users-abandon-tasks-due-to-decision-fatigue-heres-how-to-fix-it-ac3b5dcc2ed8) · [Thoughtworks CLI design guidelines](https://www.thoughtworks.com/insights/blog/engineering-effectiveness/elevate-developer-experiences-cli-design-guidelines) — which also states plainly: *"you should never require a prompt... always allow [users] to override prompts,"* meaning every interactive flow needs a non-interactive equivalent, not just the composer.

- [ ] The backend composer alone can ask up to 8 sequential module questions (database, validation, auth, rbac, testing, docker, ci) plus base + name + output dir — every one of them is real signal, but that's still a lot of sequential decisions for a first-timer. Consider a "🚀 Quick compose" option within Compose a Project that pre-picks a sensible default combo (e.g., JWT auth + Mongoose + Zod + Jest + CI, all "yes") and lets the user just confirm or fully customize, rather than making everyone answer every question every time.
- [ ] Non-interactive flag coverage is currently composer-only (`compose --base=...`). Per the Thoughtworks guideline above, `handleOfficial`, `handleTemplate`, and `handleCustom` should each also have a scriptable equivalent — right now they're prompt-only, which blocks CI/automation use for anything except Custom Structure (`create-structure <file> [outDir]`) and Compose.
- [ ] A dry-run/preview mode — show the file tree that *would* be created before actually writing anything, for any flow. Valuable for anyone unsure exactly what a given module combo produces.
- [ ] A saved-preset/config-file option (e.g., `.create-structure.json` or a `--preset=` flag reading a JSON file of flag values) so a team can standardize "this is our stack" once and re-run it, instead of re-typing the same 10 flags every time.

---

## 🔒 Security & trust positioning

- [ ] Add a GitHub personal-access-token option to the Custom Structure GitHub flow — raises the 60/hour unauthenticated rate limit and unlocks private repos. (Already on the README roadmap from the prior audit pass — still open.)
- [ ] **Turn the tool's already-lean dependency footprint into an explicit selling point.** Current deps are just `chalk`, `degit`, `inquirer`, `ora` — no install/postinstall scripts, nothing exotic. With npm's move toward blocking postinstall scripts by default after supply-chain incidents, "no telemetry, no postinstall scripts, fully auditable" is a real, current differentiator against both heavier toolchains and AI-code-generators (whose output isn't diff-reviewable the same way). This was flagged in the earlier research pass this session too — still not written down anywhere user-facing.
- [ ] Consider **opt-in, anonymous telemetry** — not to spy on users, but the same way Next.js and Nx do it: to see which composer dimensions/modules actually get picked, which tells you what to invest in next instead of guessing. Both explicitly design it to exclude file paths, env vars, and file contents, and both make it a one-command opt-out. [Next.js telemetry](https://nextjs.org/telemetry) · [Nx telemetry](https://nx.dev/docs/reference/telemetry). Get this into the audience-facing docs and license language *before* shipping it, not after — telemetry added silently is a fast way to lose exactly the trust point above.
- [ ] Add Dependabot or Renovate config to both repos so dependency bumps (including the ones in the table above) become routine PRs instead of one giant manual audit pass every few months.

---

## 📚 Documentation & reach

The single highest-leverage finding from this session's earlier research pass still applies and has gotten *more* true, not less, as more features shipped: **the tool's real differentiators are still under-surfaced.**

- [ ] npm package **description is stale and undersells the tool**: `"Create a project structure from text or JSON input"` — says nothing about the composer, RBAC, the frontend composer, or GitHub-repo sourcing. This is literally the first thing anyone sees on the npm registry page and in search results.
- [ ] `CHANGELOG.md` staleness (already listed under Critical, repeated here because it's also a reach/trust issue — an unmaintained-looking changelog reads as an unmaintained project).
- [ ] No dedicated docs site — everything lives in one (now quite long) `README.md`. For a project this feature-rich, a small [Starlight](https://docsio.co/blog/starlight-docs) site (Astro-based, fast, built-in search, no React dependency needed) is a very achievable step up from a single README, and would let the composer's dimensions/modules be documented as real reference pages instead of one long scroll. Docusaurus is the heavier, more customizable alternative (used by React Native, Redux Toolkit, Prettier) if more plugin/theming flexibility is wanted later.
- [ ] No comparison-to-competitors section anywhere — prior research flagged this as a real gap; a short, honest "vs create-t3-app / vs Yeoman / vs paid SaaS boilerplates" table would help a browsing developer place this tool immediately instead of having to infer it.
- [ ] No demo/playground — a hosted preview (or even just a short video/GIF) of what a composed React+Vite+MUI+auth app actually looks like on first run would do a lot of work, given how much visual/UX effort went into the gradient hero + theming + component showcase this session — none of that is visible to someone just reading the README.

---

## 🏆 Competitive positioning (context, not a checklist)

Where this tool actually sits as of this audit, based on 2026 research:

- **vs. `create-vite` / `create-next-app` / `create-react-app`**: those are single-framework, no backend story at all. This tool's frontend composer (styling-library choice, state, auth wired to a real backend contract) is more capable but far less battle-tested and far smaller community. CRA itself is now fully [sunset by the React team](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) — worth confirming the "Official Template" passthrough menu doesn't still offer it as a live option without a caveat.
- **vs. `create-t3-app` / `create-t3-turbo`**: T3 is deliberately opinionated (one blessed stack: Next.js + tRPC + Prisma), not mix-and-match across frameworks — this tool's "choice of Express/Fastify/NestJS + choice of styling library" is the differentiator, but T3 currently wins on ecosystem polish, tRPC (a gap identified above), and Prisma (a gap identified above).
- **vs. paid SaaS boilerplates (ShipFast $199, Makerkit ~$299, supastarter ~$299)**: these bundle auth (increasingly Better Auth or hosted, e.g. Clerk/Supabase), payments (Stripe/Lemon Squeezy/Polar and others), multi-tenancy, and teams/roles as headline features. [supastarter vs Makerkit 2026](https://supastarter.dev/supastarter-vs-makerkit) · [Makerkit SaaS boilerplate comparison](https://makerkit.dev/saas-starter-kit). A free, composable, fully auditable alternative is a legitimate wedge *if* the payments/teams/modern-auth gaps above get addressed — right now this tool doesn't compete in the same conversation as these for anyone building an actual SaaS product, only for people who want infrastructure scaffolding without the SaaS-specific business logic.
- **vs. Yeoman / Cookiecutter / Copier**: this tool's biggest structural disadvantage vs. Copier specifically is the missing update/re-sync story (listed above) — Copier's `copier update` is explicitly called out in prior research as the thing that differentiates it from one-shot generators.
- **vs. GitHub template repos**: complementary, not competitive — template repos are better for org-level governance and zero-install browser use; CLI tools like this one are better for developer-centric, scriptable, offline workflows. [Repo template vs CLI comparison](https://bharathvaj-ganesan.medium.com/scaffolding-a-new-project-based-on-the-existing-git-template-repository-b447f1b0e744). Not a gap to close, just useful framing for messaging — don't position this tool as *replacing* "Use this template," since they solve different problems.

---

## ✅ Already solid (confirmed this audit — no action needed, just don't regress)

- Composer architecture (base + independently-selectable modules, anchor-based wiring) is a genuinely good, extensible design — confirmed by how easily RBAC, the frontend composer, and the full-stack flow all slotted into it without engine changes.
- Non-interactive `compose` command, `--fullstack` mode, GitHub-repo Custom Structure sourcing, RBAC (simple + permission-based across Express/Fastify/Nest), the React+Vite frontend composer with real theming and a shared component contract, and the redesigned main menu with back-navigation are all real, working, tested features as of this session.
- `npm audit` on the CLI itself: 0 vulnerabilities.
- Dependency footprint is genuinely lean (4 direct deps) — a real trust asset once it's actually marketed as one (see above).
- MUI, Ant Design, Fastify, and NestJS versions are current as of this audit.
