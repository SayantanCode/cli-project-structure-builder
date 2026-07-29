<img width="95px" align="right" alt="create-structure-cli" src="/assets/create-structure-cli-logo.png" title="create-structure-cli"/>


[![npm version](https://badge.fury.io/js/create-structure-cli.svg)](https://badge.fury.io/js/create-structure-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/create-structure-cli/1.0.1)](https://socket.dev/npm/package/create-structure-cli/overview/1.0.1)
![NPM Downloads](https://img.shields.io/npm/dm/create-structure-cli)
# create-structure-cli


> 🚀 A powerful CLI tool to instantly create directory structures from text files or JSON templates

Quickly scaffold project directories, organize file structures, and set up development environments with a simple command. Perfect for developers, project managers, and anyone who needs to create consistent directory layouts.

## ✨ Features

- 📁 **Multiple Input Formats**: Support for both tree-style text files and JSON structure definitions
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
- **📂 Custom Structure** — the tree-text / JSON structure flow described below, sourced from either a local file or a public GitHub repo URL

## 🚀 Usage
```bash
create-structure [structure_file] [output_directory]
```
# Parameters:

- `structure_file`: The path to the structure file. It can be a tree-style text file or a JSON file.
- `output_directory`: The directory where the structure will be created. If not provided, the current directory will be used.

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

### Upcoming Features

- More built-in boilerplates (Fastify, NestJS, fullstack, utility templates)
- Support for YAML and other structure formats

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