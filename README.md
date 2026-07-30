<img width="95px" align="right" alt="create-structure-cli" src="/assets/create-structure-cli-logo.png" title="create-structure-cli"/>


[![npm version](https://badge.fury.io/js/create-structure-cli.svg)](https://badge.fury.io/js/create-structure-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/create-structure-cli/1.0.1)](https://socket.dev/npm/package/create-structure-cli/overview/1.0.1)
![NPM Downloads](https://img.shields.io/npm/dm/create-structure-cli)
# create-structure-cli


> 🚀 A powerful CLI tool to instantly create directory structures from text files or JSON templates

Quickly scaffold project directories, organize file structures, and set up development environments with a simple command. Perfect for developers, project managers, and anyone who needs to create consistent directory layouts.

## ✨ Features

- 🧩 **Composable Backend & Frontend Generator**: Pick a base (Express in 3 flavors, Fastify, NestJS, or React+Vite) and independently mix in auth, RBAC, a database, validation, testing, Docker, CI, routing, styling, and state — each an independent module, assembled at scaffold time. The frontend's auth module is wired to the exact same JWT contract the backend auth modules expose, out of the box.
- 🎨 **Real UI library choice, not just an empty shell**: The React+Vite composer lets you pick Tailwind CSS, MUI, or Ant Design (or none) — a shared `Button`/`Input`/`Modal`/`Spinner` contract means the rest of your app (auth forms, router pages, the state demo) doesn't care which one is actually behind it. Ships with light/dark/system theming, a gradient landing page, and a live component showcase on first run.
- 📁 **Multiple Input Formats**: Support for tree-style text files, JSON structure definitions, and public GitHub repo URLs
- ⚡️ **Built-in Boilerplates**: Scaffold React+Vite, Next.js (App/Pages Router), or Express+Mongoose projects, in JavaScript or TypeScript, from an interactive picker
- 🔩 **Official Template Passthrough**: Jump straight into `create-vite`, `create-next-app`, `create-react-app`, Angular, Fastify, or Nest.js from the same menu
- 🎯 **Interactive Mode**: A guided menu when run with no arguments; smart prompts when arguments are missing
- 🛡️ **Robust Error Handling**: Comprehensive validation and user-friendly error messages
- 🌍 **Cross-Platform**: Works on Windows(tested), macOS(test needed), and Linux(test needed)
- 🔄 **Flexible Paths**: Support for both absolute and relative paths
- 📝 **Batch Operations**: Create complex nested structures in seconds

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
- **⚡️ Our Built-in Template** — scaffolds a ready-made boilerplate (React+Vite, Next.js App/Pages Router, Express+Mongoose), in JavaScript or TypeScript, with an optional automatic `npm install`
- **🧩 Compose a Project (Backend or Frontend)** — pick a base and independently mix in modules along several dimensions; see [Compose a Project](#compose-a-project-backend-or-frontend) below
- **📂 Custom Structure** — the tree-text / JSON structure flow described below, sourced from either a local file or a public GitHub repo URL

## 🚀 Usage
```bash
create-structure [structure_file] [output_directory]
```
# Parameters:

- `structure_file`: The path to the structure file. It can be a tree-style text file or a JSON file.
- `output_directory`: The directory where the structure will be created. If not provided, the current directory will be used.

## 🧩 Compose a Project (Backend or Frontend)

Instead of picking one fixed boilerplate, the composer lets you build one from independent pieces. Pick a **base**, then answer a short series of "pick a module for this dimension, or None" prompts — only the dimensions that apply to your base are shown, and everything is assembled at scaffold time from a set of files that get merged together (a module can add its own files and wire itself into the base's shared entry point).

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

**Current limitation:** the backend and frontend composers are two separate runs of the CLI into two separate output folders — there's no single "compose a full-stack app into one repo" command yet, even though the auth modules on each side are built to match. Run the composer twice (once per side) and point the frontend's `VITE_API_URL` at the backend's `CORS_ORIGIN`.

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

This only works for public repos (no auth token support yet), uses a single GitHub API call to list the whole tree, and fetches file contents (when requested) from `raw.githubusercontent.com` to avoid GitHub's stricter API rate limit.

### Roadmap

- A single "compose a full-stack app" flow that runs the backend and frontend composers together into one repo, instead of two separate runs
- Non-interactive/flag mode for the composer (`--base=express-ts --auth=jwt --db=mongoose ...`) for scripted/CI use
- Next.js support in the frontend composer (React + Vite only for now)
- Support for YAML and other structure formats
- A GitHub personal-access-token option for the Custom Structure GitHub flow, to raise the unauthenticated rate limit and support private repos

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