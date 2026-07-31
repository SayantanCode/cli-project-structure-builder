<img width="95px" align="right" alt="create-structure-cli" src="/assets/create-structure-cli-logo.png" title="create-structure-cli"/>


[![npm version](https://badge.fury.io/js/create-structure-cli.svg)](https://badge.fury.io/js/create-structure-cli)
[![CI](https://github.com/SayantanCode/cli-project-structure-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/SayantanCode/cli-project-structure-builder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/create-structure-cli/1.0.1)](https://socket.dev/npm/package/create-structure-cli/overview/1.0.1)
![NPM Downloads](https://img.shields.io/npm/dm/create-structure-cli)
# create-structure-cli


> 🚀 A powerful CLI tool to instantly create directory structures from text files or JSON templates

Quickly scaffold project directories, organize file structures, and set up development environments with a simple command. Perfect for developers, project managers, and anyone who needs to create consistent directory layouts.

## ✨ Features

- 🧩 **Composable Backend & Frontend Generator**: Pick a base (Express in 3 flavors, Fastify, NestJS, or React+Vite) and independently mix in auth, RBAC, a database, validation, testing, Docker, CI, routing, styling, and state — each an independent module, assembled at scaffold time. The frontend's auth module is wired to the exact same JWT contract the backend auth modules expose, out of the box.
- 🔗 **Full-stack in one command**: Compose a backend and a frontend together into one repo (`backend/` + `frontend/`) instead of two separate runs — non-interactive/CI mode included.
- 🎨 **Real UI library choice, not just an empty shell**: The React+Vite composer lets you pick Tailwind CSS, MUI, or Ant Design (or none) — a shared `Button`/`Input`/`Modal`/`Spinner` contract means the rest of your app (auth forms, router pages, the state demo) doesn't care which one is actually behind it. Ships with light/dark/system theming, a gradient landing page, and a live component showcase on first run.
- 📁 **Multiple Input Formats**: Support for tree-style text files, JSON structure definitions, and public GitHub repo URLs
- ⚡️ **Built-in Boilerplates**: Scaffold React+Vite, Next.js (App/Pages Router), or Express+Mongoose projects, in JavaScript or TypeScript, from an interactive picker
- 🔩 **Official Template Passthrough**: Jump straight into `create-vite`, `create-next-app`, `create-react-app`, Angular, Fastify, or Nest.js from the same menu
- 🎯 **Interactive Mode**: A guided menu when run with no arguments; smart prompts when arguments are missing
- 🛡️ **Robust Error Handling**: Comprehensive validation and user-friendly error messages
- 🌍 **Cross-Platform**: Works on Windows(tested), macOS(test needed), and Linux(test needed)
- 🔄 **Flexible Paths**: Support for both absolute and relative paths
- 📝 **Batch Operations**: Create complex nested structures in seconds

## 🔒 Why trust this tool

The whole point of a scaffolding tool is that you're about to run its output on your machine — so here's exactly what's in it, no hand-waving:

- **4 direct dependencies, total**: [`chalk`](https://www.npmjs.com/package/chalk) (terminal colors), [`degit`](https://www.npmjs.com/package/degit) (fetching templates), [`inquirer`](https://www.npmjs.com/package/inquirer) (prompts), [`ora`](https://www.npmjs.com/package/ora) (spinners). No framework, no bundler, no telemetry SDK.
- **No postinstall/install scripts** — nothing runs on your machine at install time beyond what npm itself does. `npm pack --dry-run` on this repo shows exactly 8 files in the published package; there's nothing to hide.
- **No telemetry, period.** Nothing is collected or sent anywhere by this CLI. (If usage analytics are ever added later — to see which composer modules people actually pick, the way [Next.js](https://nextjs.org/telemetry) and [Nx](https://nx.dev/docs/reference/telemetry) do it — it will be opt-in, documented here first, and excludes file paths/contents/env vars by design. Not shipped today.)
- **Deterministic, diff-reviewable output** — every composed project is assembled from plain files in a public repo ([`create-structure-templates`](https://github.com/SayantanCode/create-structure-templates)) that you can read before you run anything, unlike AI code generators where the output isn't something you can audit against a known source.
- **CI on every push/PR** on both this repo and the templates repo — a representative matrix of base+module combinations is actually composed, installed, and built before anything merges.

## 🆚 How this compares

| Feature | This tool | `create-vite` / `create-next-app` | `create-t3-app` | Paid SaaS boilerplates (ShipFast, Makerkit, supastarter) | Yeoman / Cookiecutter |
| --- | --- | --- | --- | --- | --- |
| Backend **and** frontend, composed together | ✅ | ❌ (frontend only) | ⚠️ opinionated single stack | ✅ (opinionated single stack) | ⚠️ depends on the generator |
| Choice of framework (Express/Fastify/NestJS, or Next.js) | ✅ | ❌ | ❌ (Next.js only) | ❌ (usually Next.js only) | ⚠️ depends on the generator |
| Auth + RBAC wired backend↔frontend out of the box | ✅ | ❌ | ⚠️ auth yes, RBAC no | ✅ (usually hosted auth) | ❌ |
| Cost | Free, MIT | Free | Free | $199–$299 one-time or subscription | Free |
| Payments / multi-tenancy built in | ❌ (on the roadmap) | ❌ | ❌ | ✅ (their whole point) | ❌ |
| Update previously-scaffolded projects | ❌ (on the roadmap, Copier-style) | ❌ | ❌ | ❌ | ✅ (Copier only) |

Not a "this tool wins at everything" table — if you're shipping a SaaS product with billing on day one, a paid boilerplate is genuinely the faster path. This tool's niche is free, composable infrastructure scaffolding across more framework choices than any one of the above offers alone.

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g create-structure-cli
```

### Local Installation
```bash
npm install create-structure-cli
```

### Using npx (No Installation Required)
```bash
npx create-structure-cli
```

## 🚀 Quick Start
```bash
# Interactive mode - choose Official Template, Built-in Boilerplate, or Custom Structure
create-structure

# Specify structure file only (default output directory is current directory)
# Tree-style text file
create-structure ./project-structure.txt 
# or
# JSON style structure
create-structure ./project-structure.json

# Specify both structure file and output directory - output directory will be created if it doesn't exist and no prompts will be shown
create-structure ./structure.json ./my-new-project
```

Running `create-structure` with no arguments opens an interactive menu:

- **🔩 Official Template** — delegates to the framework's own official generator (`create-vite`, `create-next-app`, `create-react-app`, Angular CLI, Fastify CLI, Nest CLI)
- **⚡ Quick Boilerplate** — scaffolds a ready-made boilerplate (React+Vite, Next.js App/Pages Router, Express+Mongoose), in JavaScript or TypeScript, with an optional automatic `npm install` — sensible defaults, no extra choices
- **🔧 Compose a Project** — first asks whether you want a backend, a frontend, or both (full-stack), then lets you independently mix in modules along several dimensions; see [Compose a Project](#compose-a-project-backend-or-frontend) below
- **📂 Custom Structure** — the tree-text / JSON structure flow described below, sourced from either a local file or a public GitHub repo URL

Every flow's first question has an "⬅ Back to main menu" choice, so picking the wrong top-level option doesn't mean restarting the whole CLI.

## 🚀 Usage
```bash
create-structure [structure_file] [output_directory]
```
# Parameters:

- `structure_file`: The path to the structure file. It can be a tree-style text file or a JSON file.
- `output_directory`: The directory where the structure will be created. If not provided, the current directory will be used.

## 🧩 Compose a Project (Backend or Frontend)

Instead of picking one fixed boilerplate, the composer lets you build one from independent pieces. It first asks **Backend only / Frontend only / Full-stack (both)** — this picks which base list you choose from next, and full-stack hands off to the flow described in [Full-stack in one command](#full-stack-in-one-command) below. Either way, you then pick a **base** and answer a short series of "pick a module for this dimension, or None" prompts — only the dimensions that apply to your base are shown, and everything is assembled at scaffold time from a set of files that get merged together (a module can add its own files and wire itself into the base's shared entry point).

**Bases:**

| Base | Framework | Language |
| --- | --- | --- |
| Express (CommonJS) | Express | JavaScript |
| Express (ESM) | Express | JavaScript |
| Express (TypeScript) | Express | TypeScript |
| Fastify | Fastify | JavaScript |
| NestJS | NestJS | TypeScript |
| React + Vite | React | JavaScript |
| React + Vite | React | TypeScript |

**Backend dimensions**, available across Express/Fastify/NestJS (a module only shows up for the frameworks/languages it actually supports):

- **Database** — MongoDB + Mongoose
- **Validation** — Zod
- **Auth** — JWT, `POST /auth/{register,login,refresh,logout}` + `GET /auth/me`, access token in memory, refresh token in an httpOnly cookie
- **RBAC** — Simple (role-based) or Permission-based
- **Testing** — Jest
- **Docker** — a ready-to-use `Dockerfile`
- **CI** — a GitHub Actions workflow that runs your build/tests on every push/PR

**Frontend dimensions**, available for the React + Vite base:

- **Routing** — React Router, with a wired-up `Home`/`NotFound` page pair
- **Styling** — Tailwind CSS, MUI, or Ant Design (or none). Whichever you pick supplies its own `Button` / `Input` / `Modal` / `Spinner` / `ThemeToggle` — every other module (auth forms, the router pages, the state demo) imports these the same way regardless of which library is actually behind them, so switching later doesn't ripple through the rest of the app
- **State** — Zustand, with a small working counter demo
- **Auth** — a JWT auth flow (login/register/status) that talks to the *exact* contract the backend's Auth module exposes — pair the two and they work together out of the box
- **Testing** — Vitest

Every React + Vite project also always includes, regardless of what you pick: a light/dark/system `ThemeProvider` (persisted, extensible to more themes), a gradient landing page with a live showcase of the shared components, an `ErrorBoundary`, a favicon, and ESLint + Prettier already configured to match what `npm create vite` ships.

### Full-stack in one command

Picking **Full-stack (both)** at Compose a Project's first question runs both composers in one invocation, into `backend/` and `frontend/` inside a single project folder, instead of two disconnected runs. If the backend picks an auth module, the frontend's auth prompt defaults to match it. Every base's default env values already line up out of the box (backend `PORT=4000` + `CORS_ORIGIN=http://localhost:5173`, frontend `VITE_API_URL=http://localhost:4000/api/v1` — matching Vite's own default dev port) — the value this flow actually adds is not re-typing the same choices twice and getting one repo instead of two.

Non-interactively:

```bash
create-structure compose --fullstack \
  --backend=express-ts --backend:database=db-mongoose --backend:auth=auth-jwt \
  --frontend=react-vite-tsx --frontend:auth=auth-react --frontend:styling=styling-tailwind \
  --name=my-app --out=./my-app --yes --install
```

Dimension flags are namespaced with `backend:`/`frontend:` (instead of the bare `--<dimension>` the single-target command uses) since some dimensions — auth, testing — exist on both sides and need independent answers.

### Non-interactive / scripted use

For CI or scripting, `create-structure compose` takes every answer as a flag instead of prompting — module values are the stable **keys** from the registry, not the display names shown in the interactive menu:

```bash
# See every available base and module key
create-structure compose --list

# Compose a project without any prompts
create-structure compose \
  --base=express-ts \
  --database=db-mongoose \
  --auth=auth-jwt \
  --rbac=rbac-simple \
  --validation=validation-zod \
  --testing=testing-jest \
  --docker \
  --ci \
  --name=my-api \
  --out=./my-api \
  --yes \
  --install
```

- `--base` and `--name` are required; any dimension you omit is left out (same as choosing "None" interactively)
- `--out` defaults to `./<name>` if not given
- `--yes` skips the "target directory isn't empty" confirmation
- `--install` runs `npm install` automatically instead of just printing the command in "next steps"

## 📝 Structure File Formats
1. Tree-Style Text Format
Create a .txt file with your directory structure using tree notation:

```
my-project/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── About.jsx
│   ├── utils/
│   │   ├── helpers.js
│   │   └── constants.js
│   └── App.jsx
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── images/
│       └── styles/
├── tests/
│   ├── components/
│   └── utils/
├── docs/
│   ├── README.md
│   └── API.md
├── .gitignore
├── package.json
└── README.md
```
# Supported Tree Characters:
- `├──` for branches
- `└──` for last items
- `│` for vertical lines
- Folders must end with `/`
- Files without `/` are treated as files

My suggestion you can use the [tree.nathanfriend.com](https://tree.nathanfriend.com) to draw your structure.

2. JSON Format
Create a .json file with your directory structure using JSON notation:

```json
{
  "my-project": {
    "src": {
      "components": {
        "Header.jsx": "",
        "Footer.jsx": "",
        "Layout.jsx": ""
      },
      "pages": {
        "Home.jsx": "",
        "About.jsx": ""
      },
      "utils": {
        "helpers.js": "// Utility functions",
        "constants.js": "// App constants"
      },
      "App.jsx": ""
    },
    "public": {
      "index.html": "<!DOCTYPE html>...",
      "favicon.ico": "",
      "assets": {
        "images": {},
        "styles": {}
      }
    },
    "tests": {
      "components": {},
      "utils": {}
    },
    "docs": {
      "README.md": "# Documentation",
      "API.md": "# API Reference"
    },
    ".gitignore": "node_modules/\n.env\ndist/",
    "package.json": "",
    "README.md": "# My Project"
  }
}
```
# JSON Structure Rules:
- Objects represent directories
- String values represent file content
- Empty strings create empty files
- Nested objects create nested directories

## 🐙 Custom Structure from a GitHub Repo

Instead of a local file, the **Custom Structure** flow also accepts a public GitHub repo URL — the repo root, or a `/tree/<branch>/<subpath>` URL for a specific folder:

```text
https://github.com/owner/repo
https://github.com/owner/repo/tree/main/some/subfolder
```

After fetching the tree, you choose what actually gets created:

- **Structure only** — every file becomes an empty file (folders included), just the shape of the repo — handy for using someone else's project layout as a starting point without pulling in their actual code.
- **Structure + real file contents** — fetches every file's real content too.

Uses a single GitHub API call to list the whole tree, and fetches file contents (when requested) from `raw.githubusercontent.com` to avoid GitHub's stricter API rate limit.

**Private repos, or hitting the rate limit?** Set a `GITHUB_TOKEN` or `GH_TOKEN` environment variable (same convention as the `gh` CLI) to a [personal access token](https://github.com/settings/tokens) with `repo` scope — this raises the unauthenticated 60-requests/hour limit to 5,000/hour and unlocks private repos you have access to. Entirely optional; the flow works the same without one for public repos.

### Roadmap

- A `copier`-style update/re-sync command so a previously-scaffolded project can pull in template fixes made after it was created
- A monorepo output option (pnpm/Turborepo-style workspace) for the full-stack flow, instead of two independent `backend`/`frontend` folders
- Next.js support in the frontend composer (React + Vite only for now)
- Support for YAML and other structure formats
- A GitHub personal-access-token option for the Custom Structure GitHub flow, to raise the unauthenticated rate limit and support private repos
- Non-JS backend options (e.g. a Python/FastAPI or Go base)

## Contributing or Pull Requests

I welcome contributions! Please follow the [Contributing Guidelines](https://github.com/sayantanCode/cli-project-structure-builder/blob/main/.github/CONTRIBUTING.md) to contribute to this project.

## 📝 License

This project is released under the [MIT License](https://opensource.org/licenses/MIT).

## 📝 Issues

Found a bug or have a feature request?  
Please [open an issue](https://github.com/sayantanCode/cli-project-structure-builder/issues) using one of our templates.


## 📝 Changelog

See the [Changelog](https://github.com/sayantanCode/cli-project-structure-builder/blob/main/CHANGELOG.md) for a detailed history of changes and releases.

## 📝 Credits
- [Sayantan Chakraborty](https://github.com/sayantanCode)

## Made with ❤️ by 🙋‍‍ Sayantan Chakraborty