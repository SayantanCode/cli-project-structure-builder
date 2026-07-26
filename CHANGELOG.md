# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
