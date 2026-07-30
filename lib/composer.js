import fs from "fs";
import os from "os";
import path from "path";
import degit from "degit";
import { renderTemplate } from "./templateEngine.js";
import { describeGitHubFetchFailure } from "./githubDiagnostics.js";

const TEMPLATES_REPO = "SayantanCode/create-structure-templates";
const COMPOSER_INDEX_URL = `https://raw.githubusercontent.com/${TEMPLATES_REPO}/main/composer/composer-index.json`;

// Maps a module's wiring "target" key to the file it patches and the anchor
// comment for each "slot" that file exposes. Modules only ever describe
// *what* to insert; this is the only place that knows *where*. File paths
// differ per language (the TS base lives under src/ with .ts extensions),
// so this is built per-language rather than being a single static map.
function getAnchorMap(language) {
  // NestJS has no equivalent of app.js/routes-index.js — feature modules
  // self-register their own controllers and just need to be added to
  // app.module.ts's imports array, so it gets its own anchor shape entirely
  // rather than reusing the Express/Fastify one.
  if (language === "nest-ts") {
    const root = (p) => path.join("src", p);
    return {
      main: {
        file: root("main.ts"),
        slots: {
          imports: "// __COMPOSER_IMPORTS__",
          middleware: "// __COMPOSER_MIDDLEWARE__",
          startup: "// __COMPOSER_STARTUP__",
        },
      },
      "app.module": {
        file: root("app.module.ts"),
        slots: {
          imports: "// __COMPOSER_IMPORTS__",
          moduleImports: "// __COMPOSER_MODULE_IMPORTS__",
        },
      },
      "test/setup": {
        file: root(path.join("test", "setup.ts")),
        slots: {
          env: "// __COMPOSER_TEST_ENV__",
          imports: "// __COMPOSER_TEST_IMPORTS__",
          state: "// __COMPOSER_TEST_STATE__",
          beforeAll: "// __COMPOSER_TEST_BEFORE_ALL__",
          afterAll: "// __COMPOSER_TEST_AFTER_ALL__",
        },
      },
    };
  }

  // React (Vite): everything wires into App.{jsx,tsx} — there's no
  // Express-style app.js/routes-index.js split, and providers need to nest
  // (e.g. <AuthProvider><BrowserRouter>...), which is why providersClose
  // below is the one slot marked reverse: true.
  if (language === "jsx" || language === "tsx") {
    const ext = language;
    const root = (p) => path.join("src", p);
    return {
      app: {
        file: root(`App.${ext}`),
        slots: {
          imports: "// __COMPOSER_IMPORTS__",
          providersOpen: "{/* __COMPOSER_PROVIDERS_OPEN__ */}",
          providersClose: { marker: "{/* __COMPOSER_PROVIDERS_CLOSE__ */}", reverse: true },
          content: "{/* __COMPOSER_CONTENT__ */}",
        },
      },
      "test/setup": {
        file: root(path.join("test", `setup.${ext === "tsx" ? "ts" : "js"}`)),
        slots: {
          env: "// __COMPOSER_TEST_ENV__",
          imports: "// __COMPOSER_TEST_IMPORTS__",
          state: "// __COMPOSER_TEST_STATE__",
          beforeAll: "// __COMPOSER_TEST_BEFORE_ALL__",
          afterAll: "// __COMPOSER_TEST_AFTER_ALL__",
        },
      },
    };
  }

  const ext = language === "ts" ? "ts" : "js";
  const root = language === "ts" ? (p) => path.join("src", p) : (p) => p;

  return {
    app: {
      file: root(`app.${ext}`),
      slots: { imports: "// __COMPOSER_IMPORTS__", middleware: "// __COMPOSER_MIDDLEWARE__" },
    },
    server: {
      file: root(`server.${ext}`),
      slots: { imports: "// __COMPOSER_IMPORTS__", startup: "// __COMPOSER_STARTUP__" },
    },
    "routes/index": {
      file: root(path.join("routes", `index.${ext}`)),
      slots: { imports: "// __COMPOSER_ROUTE_IMPORTS__", mounts: "// __COMPOSER_ROUTE_MOUNTS__" },
    },
    "test/setup": {
      file: root(path.join("test", `setup.${ext}`)),
      slots: {
        env: "// __COMPOSER_TEST_ENV__",
        imports: "// __COMPOSER_TEST_IMPORTS__",
        state: "// __COMPOSER_TEST_STATE__",
        beforeAll: "// __COMPOSER_TEST_BEFORE_ALL__",
        afterAll: "// __COMPOSER_TEST_AFTER_ALL__",
      },
    },
  };
}
const README_ANCHOR = "<!-- __COMPOSER_README__ -->";

/**
 * Fetches the composer registry (available bases + modules) from the
 * templates repo. Throws a clear error if it can't be reached.
 */
export async function fetchComposerIndex() {
  let response;
  try {
    response = await fetch(COMPOSER_INDEX_URL);
  } catch (error) {
    throw new Error(
      `Could not reach the template registry — check your internet connection. (${error.message})`
    );
  }
  if (!response.ok) {
    throw new Error(`Could not reach the template registry (HTTP ${response.status}).`);
  }
  return response.json();
}

/**
 * Downloads the whole composer/ tree (all bases + modules) once into a temp
 * directory. Composing pulls in a base plus several modules, and fetching
 * each individually would mean one network round-trip per piece — a single
 * fetch here is cheaper and simpler.
 */
async function fetchComposerTree() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "create-structure-composer-"));
  const emitter = degit(`${TEMPLATES_REPO}/composer`, { cache: false, force: true });
  try {
    await emitter.clone(tempDir);
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Could not fetch the composer registry: ${await describeGitHubFetchFailure(error.message)}`);
  }
  return tempDir;
}

function topoSort(moduleKeys, modulesByKey) {
  const sorted = [];
  const visited = new Set();
  function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    for (const dep of modulesByKey[key].dependsOn || []) {
      if (moduleKeys.includes(dep)) visit(dep);
    }
    sorted.push(key);
  }
  for (const key of moduleKeys) visit(key);
  return sorted;
}

function applyWiring(outDir, accumulator, language) {
  // Iterate every known anchor (not just ones a module contributed to) so
  // markers get cleared to blank even when nothing filled them in — e.g. a
  // bare compose with zero modules selected still needs a clean app.js.
  for (const [targetKey, target] of Object.entries(getAnchorMap(language))) {
    const slots = accumulator[targetKey] || {};

    const filePath = path.join(outDir, target.file);
    // The file this wiring targets doesn't exist (e.g. testing-jest wasn't
    // selected, so there's no test/setup.js) — nothing to patch, skip.
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, "utf-8");
    for (const [slot, slotDef] of Object.entries(target.slots)) {
      // A slot is normally just its marker string. Some slots (e.g. JSX
      // provider close tags) need their contributions joined in reverse
      // selection order so nesting comes out correct — `<AuthProvider><Router>
      // ...</Router></AuthProvider>`, not the other way round — so a slot may
      // instead be `{ marker, reverse: true }`.
      const marker = typeof slotDef === "string" ? slotDef : slotDef.marker;
      const reverse = typeof slotDef === "object" && slotDef.reverse === true;
      if (!content.includes(marker)) continue;
      let lines = slots[slot] || [];
      if (reverse) lines = [...lines].reverse();
      content = content.split(marker).join(lines.join("\n"));
    }
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

/**
 * Composes a backend from a base skeleton plus a set of selected modules.
 * Throws if a module's dependsOn isn't satisfied by the selection, or if the
 * base/a module doesn't exist in the registry.
 *
 * @param {object} params
 * @param {string} params.baseKey - e.g. "express-esm"
 * @param {string[]} params.moduleKeys - e.g. ["db-mongoose", "auth-jwt", "rbac-simple", "testing-jest"]
 * @param {string} params.language - language target each module is rendered for (Phase 4a: "esm" only)
 * @param {string} params.outDir
 * @param {Record<string,string>} params.vars - e.g. { projectName }
 */
export async function composeBackend({ baseKey, moduleKeys, language, outDir, vars }) {
  const index = await fetchComposerIndex();
  const modulesByKey = Object.fromEntries(index.modules.map((m) => [m.key, m]));

  if (!index.bases.some((b) => b.key === baseKey)) {
    throw new Error(`Unknown base: ${baseKey}`);
  }
  for (const key of moduleKeys) {
    const mod = modulesByKey[key];
    if (!mod) throw new Error(`Unknown module: ${key}`);
    if (!mod.languages.includes(language)) {
      throw new Error(`Module "${key}" doesn't support language target "${language}" yet.`);
    }
    for (const dep of mod.dependsOn || []) {
      if (!moduleKeys.includes(dep)) {
        throw new Error(`Module "${key}" requires "${dep}" to also be selected.`);
      }
    }
  }

  const composerTree = await fetchComposerTree();
  try {
    renderTemplate(path.join(composerTree, "bases", baseKey, "files"), outDir, vars);

    const orderedKeys = topoSort(moduleKeys, modulesByKey);
    const accumulator = {};
    let dependencies = {};
    let devDependencies = {};
    let scripts = {};
    let packageJsonExtra = {};
    const envExampleLines = [];
    const readmeBlocks = [];

    for (const key of orderedKeys) {
      const mod = modulesByKey[key];
      const langData = mod[language];

      renderTemplate(path.join(composerTree, "modules", key, language, "files"), outDir, vars);

      dependencies = { ...dependencies, ...(langData.dependencies || {}) };
      devDependencies = { ...devDependencies, ...(langData.devDependencies || {}) };
      scripts = { ...scripts, ...(langData.scripts || {}) };
      packageJsonExtra = { ...packageJsonExtra, ...(langData.packageJsonExtra || {}) };
      if (langData.envExample) envExampleLines.push(...langData.envExample);
      if (langData.readme) readmeBlocks.push(langData.readme);

      for (const [targetKey, contributions] of Object.entries(langData.wiring || {})) {
        accumulator[targetKey] ||= {};
        for (const [slot, lines] of Object.entries(contributions)) {
          accumulator[targetKey][slot] ||= [];
          accumulator[targetKey][slot].push(...lines);
        }
      }
    }

    applyWiring(outDir, accumulator, language);

    const pkgPath = path.join(outDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.dependencies = { ...(pkg.dependencies || {}), ...dependencies };
    pkg.devDependencies = { ...(pkg.devDependencies || {}), ...devDependencies };
    pkg.scripts = { ...(pkg.scripts || {}), ...scripts };
    Object.assign(pkg, packageJsonExtra);
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

    if (envExampleLines.length > 0) {
      const envPath = path.join(outDir, ".env.example");
      const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
      fs.writeFileSync(
        envPath,
        existing.replace(/\n?$/, "\n") + envExampleLines.join("\n") + "\n",
        "utf-8"
      );
    }

    const readmePath = path.join(outDir, "README.md");
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, "utf-8");
      fs.writeFileSync(readmePath, content.split(README_ANCHOR).join(readmeBlocks.join("")), "utf-8");
    }
  } finally {
    fs.rmSync(composerTree, { recursive: true, force: true });
  }
}
