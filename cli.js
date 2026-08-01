#!/usr/bin/env node
//native modules
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
//external modules
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
//local modules
import { instantiateTemplate, fetchTemplateIndex } from "./lib/templateEngine.js";
import { composeBackend, fetchComposerIndex } from "./lib/composer.js";
import { parseGitHubUrl, fetchGitHubTree, writeGitHubStructure } from "./lib/githubSource.js";

// create the log object with styled methods
const log = {
  info: (message) => console.log(chalk.blue(message)),
  warn: (message) => console.warn(chalk.yellow(message)),
  error: (message) => console.error(chalk.red(message)),
  success: (message) => console.log(chalk.green(message)),
  debug: (message) => console.debug(chalk.gray(message)),
  custom: (message, style) => {
    const allStyles = style.split(".").map((s) => s.trim());
    let styledMessage = chalk;

    allStyles.forEach((s) => {
      if (/^rgb\(/i.test(s)) {
        // handle rgb(255,0,0)
        const values = s
          .replace(/^rgb\(/i, "")
          .replace(/\)$/, "")
          .split(",")
          .map(Number);
        styledMessage = styledMessage.rgb(...values);
      } else if (/^hex\(/i.test(s)) {
        // handle hex(#ff0000)
        const hex = s
          .replace(/^hex\(/i, "")
          .replace(/\)$/, "")
          .replace(/['"]/g, "");
        styledMessage = styledMessage.hex(hex);
      } else if (styledMessage[s]) {
        // handle normal chalk styles like bold, underline, bgRed
        styledMessage = styledMessage[s];
      } else {
        console.warn(chalk.yellow(`⚠️ Unknown chalk style: ${s}`));
      }
    });

    console.log(styledMessage(message));
  },
};

/**
 * Cleans a file path by removing surrounding quotes and resolving it to an absolute path.
 */
function cleanPath(inputPath) {
  let cleanedPath = inputPath.trim().replace(/^["']|["']$/g, "");
  return path.isAbsolute(cleanedPath)
    ? cleanedPath
    : path.resolve(process.cwd(), cleanedPath);
}

/**
 * Validates a file path.
 */
function validateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: `❌ File not found: ${filePath}` };
    }
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { valid: false, error: `❌ Path is not a file: ${filePath}` };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `❌ Error accessing file: ${error.message}` };
  }
}

/**
 * Validates a directory path.
 */
function validateDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      log.info(`📂 Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
      return { valid: true };
    }
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return { valid: false, error: `❌ Path is not a directory: ${dirPath}` };
    }
    fs.accessSync(dirPath, fs.constants.W_OK);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `❌ Cannot write to directory: ${error.message}`,
    };
  }
}

/**
 * If outDir already exists and has files in it, asks the user to confirm
 * before scaffolding into it. Returns true if it's fine to proceed.
 */
async function confirmOverwriteIfNeeded(outDir) {
  if (!fs.existsSync(outDir) || !fs.statSync(outDir).isDirectory()) {
    return true;
  }
  const contents = fs.readdirSync(outDir);
  if (contents.length === 0) return true;

  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: `Target directory "${outDir}" already has ${contents.length} item(s) in it. Continue anyway?`,
      default: false,
    },
  ]);
  return proceed;
}

const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Prompts for a project name, validated against npm package-name-shaped
 * rules (so it can't produce an invalid "name" field in package.json).
 */
async function promptProjectName(message = "Enter project name:") {
  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message,
      validate: (val) => {
        const trimmed = (val || "").trim();
        if (!trimmed) return "Project name is required";
        if (!PROJECT_NAME_PATTERN.test(trimmed)) {
          return "Use lowercase letters, numbers, hyphens, dots, or underscores, starting with a letter or number.";
        }
        return true;
      },
    },
  ]);
  return projectName.trim();
}

/**
 * Prints a "cd <outDir>, then run this" hint after any successful scaffold.
 * The single shared spot for this message so every flow (official
 * passthrough, built-in boilerplate, composer, custom structure) looks the
 * same instead of each hand-rolling its own.
 */
function printNextSteps(outDir, devCommand) {
  const lines = [`cd ${outDir}`];
  if (devCommand) lines.push(devCommand);
  log.custom(`🚀 Next steps:\n   ${lines.join("\n   ")}`, "rgb(194, 156, 247).bold");
}

/**
 * Looks for a real (non-template) package.json at the root of a freshly
 * created structure and, if it has a "dev" or "start" script, returns the
 * npm command for it — used so Custom Structure's "next steps" message can
 * suggest something real instead of staying silent just because it doesn't
 * know the project's framework the way the other flows do.
 */
function detectDevCommand(outDir) {
  const pkgPath = path.join(outDir, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (pkg.scripts?.dev) return "npm run dev";
    if (pkg.scripts?.start) return "npm start";
  } catch {
    // Not valid/parseable JSON — nothing to suggest.
  }
  return null;
}

/**
 * Runs `npm install` in outDir with a spinner. Shared by the interactive
 * install-confirmation flow and the non-interactive composer's `--install`
 * flag, so there's one place that owns the actual spawn/exit-code handling.
 */
function installDependencies(outDir) {
  return new Promise((resolve) => {
    const spinner = ora("Installing dependencies...").start();
    const startTime = Date.now();
    const installProc = spawn("npm", ["install"], {
      cwd: outDir,
      shell: true,
      stdio: "ignore",
    });
    installProc.on("error", (error) => {
      spinner.fail(`Error installing dependencies: ${error.message}`);
      process.exit(1);
    });
    installProc.on("close", (code) => {
      const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (code !== 0) {
        spinner.fail(`Error installing dependencies: npm install exited with code ${code}`);
        process.exit(1);
      } else {
        spinner.succeed(`Dependencies installed in ${timeElapsed}s`);
        resolve();
      }
    });
  });
}

/**
 * Shared helper → asks + installs dependencies if package.json has deps.
 * devCommand (optional) is shown in the final "next steps" message.
 */
async function maybeInstallDependencies(outDir, packageJsonContent, devCommand) {
  let pkg;
  try {
    pkg = JSON.parse(packageJsonContent);
  } catch {
    printNextSteps(outDir, devCommand);
    return;
  }

  const hasDeps =
    (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) ||
    (pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0);

  if (!hasDeps) {
    printNextSteps(outDir, devCommand);
    return;
  }

  const { confirmDependenciesInstall } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDependenciesInstall",
      message: "Auto install dependencies?",
      default: true,
    },
  ]);

  if (confirmDependenciesInstall) {
    await installDependencies(outDir);
    printNextSteps(outDir, devCommand);
  } else {
    log.warn(`⚠️ Remember to install dependencies manually. Run 'cd ${outDir} && npm install'`);
    printNextSteps(outDir, devCommand);
  }
}

/**
 * Main entry point with Inquirer flow.
 */
async function main() {
  // Non-interactive composer: `create-structure compose --base=... [--dimension=key]... --name=...`
  // Keeps the composer usable from scripts/CI without going through prompts.
  if (process.argv[2] === "compose") {
    await handleComposeNonInteractive(process.argv.slice(3));
    return;
  }

  // Non-interactive fast path: `create-structure <file> [outputDir]`
  // Keeps scripted/CI usage working without going through the menu.
  if (process.argv.length > 2) {
    const filePath = cleanPath(process.argv[2]);
    const fileValidation = validateFile(filePath);
    if (!fileValidation.valid) {
      log.error(fileValidation.error);
      process.exit(1);
    }

    const outDir =
      process.argv.length > 3 ? cleanPath(process.argv[3]) : process.cwd();
    const dirValidation = validateDirectory(outDir);
    if (!dirValidation.valid) {
      log.error(dirValidation.error);
      process.exit(1);
    }

    await runCustomStructure(filePath, outDir);
    return;
  }

  log.custom(
    "\n✨ Welcome to Create-Structure-CLI! \n",
    "rgb(85, 254, 254).underline"
  );
  log.custom(
    "🚀 Quickly scaffold your project structure with ease. 🚀 \n\n",
    "rgb(85, 254, 254).italic"
  );
  try {
    // Loops back here whenever a flow's first sub-prompt returns "BACK"
    // (its "⬅ Back to main menu" choice), instead of exiting after one pick.
    for (;;) {
      const { mode } = await inquirer.prompt([
        {
          type: "list",
          name: "mode",
          message: "What do you want to do?",
          choices: [
            {
              name: "🔩 Official Template",
              value: "official",
              description:
                "Delegates to the framework's own generator (create-vite, create-next-app, ng new, ...) — exactly what you'd get running it yourself.",
            },
            {
              name: "⚡ Quick Boilerplate",
              value: "boilerplate",
              description:
                "One ready-made project (React+Vite, Next.js, or Express+Mongoose) with sensible defaults already picked, no extra choices to make. Want to pick your own auth/database/styling instead? Use 'Compose a Project' below.",
            },
            {
              name: "🔧 Compose a Project",
              value: "compose",
              description:
                "Build a backend, a frontend, or both together — by picking each piece yourself: auth, database, styling, testing, and more. Just want a ready-made project fast with no choices? Use 'Quick Boilerplate' above instead.",
            },
            {
              name: "📂 Custom Structure",
              value: "custom",
              description:
                "Create an exact file/folder layout you already have in mind — from a text tree, a JSON file, or a GitHub repo URL.",
            },
          ],
        },
      ]);

      let result;
      if (mode === "custom") {
        result = await handleCustom();
      } else if (mode === "boilerplate") {
        result = await handleTemplate();
      } else if (mode === "compose") {
        result = await handleComposeBackend();
      } else if (mode === "official") {
        result = await handleOfficial();
      }

      if (result === "BACK") continue;
      break;
    }
  } catch (error) {
    log.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
  return;
}

/**
 * Runs a command with arguments in a given directory.
 * @param {string} cmd - The command to run.
 * @param {string[]} args - The command arguments.
 * @param {string} cwd - The working directory to run the command in.
 * @returns {Promise<void>} - Resolves when the command completes successfully, rejects on error.
 */
function runCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", cwd, shell: true });
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} failed`))
    );
  });
}

// Dev command shown in the "next steps" message per official framework.
const OFFICIAL_DEV_COMMANDS = {
  "React (CRA)": "npm start",
  Vite: "npm run dev",
  "Next.js": "npm run dev",
  Angular: "npm start",
  Fastify: "npm start",
  "Nest.js": "npm run start:dev",
};

/**
 * Handle flow for official templates.
 */
async function handleOfficial() {
  const { framework } = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Choose an official framework/library:",
      choices: [
        "⬅ Back to main menu",
        "React (CRA)",
        "Vite",
        "Next.js",
        "Angular",
        "Fastify",
        "Nest.js",
      ],
    },
  ]);
  if (framework === "⬅ Back to main menu") return "BACK";

  const projectName = await promptProjectName();

  const outDir = path.join(process.cwd(), projectName);
  const canProceed = await confirmOverwriteIfNeeded(outDir);
  if (!canProceed) {
    log.warn("⚠️ Aborted — target directory not empty.");
    return;
  }

  log.info(`⚙️ Setting up ${framework} project...`);

  try {
    if (framework === "React (CRA)") {
      await runCommand("npx", ["create-react-app", projectName], process.cwd());
    } else if (framework === "Vite") {
      await runCommand(
        "npm",
        ["create", "vite@latest", projectName],
        process.cwd()
      );
    } else if (framework === "Next.js") {
      await runCommand(
        "npx",
        ["create-next-app@latest", projectName],
        process.cwd()
      );
    } else if (framework === "Angular") {
      await runCommand(
        "npx",
        ["-p", "@angular/cli", "ng", "new", projectName],
        process.cwd()
      );
    } else if (framework === "Fastify") {
      await runCommand(
        "npx",
        ["fastify-cli", "generate", projectName],
        process.cwd()
      );
    } else if (framework === "Nest.js") {
      await runCommand(
        "npx",
        ["@nestjs/cli", "new", projectName],
        process.cwd()
      );
    }
    log.success(`✅ ${framework} project created at ${projectName}`);
    printNextSteps(projectName, OFFICIAL_DEV_COMMANDS[framework]);
  } catch (err) {
    log.error(`❌ Failed to create ${framework} project: ${err.message}`);
    process.exit(1);
  }
  return;
}

/**
 * Flow for custom structure.
 */
async function handleCustom() {
  const { source } = await inquirer.prompt([
    {
      type: "list",
      name: "source",
      message: "Where is your structure coming from?",
      choices: ["⬅ Back to main menu", "📁 Local file", "🐙 GitHub repository"],
    },
  ]);
  if (source === "⬅ Back to main menu") return "BACK";

  if (source === "🐙 GitHub repository") {
    await handleCustomFromGitHub();
    return;
  }

  const { inputFilePath } = await inquirer.prompt([
    {
      type: "input",
      name: "inputFilePath",
      message: "Enter path (with extension) of your custom structure file:",
    },
  ]);

  const filePath = cleanPath(inputFilePath);
  const fileValidation = validateFile(filePath);
  if (!fileValidation.valid) {
    log.error(fileValidation.error);
    process.exit(1);
  }

  const { outputBase } = await inquirer.prompt([
    {
      type: "input",
      name: "outputBase",
      message: "Enter output directory (leave empty for current directory):",
    },
  ]);

  const outDir = outputBase.trim() ? cleanPath(outputBase) : process.cwd();
  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    log.error(dirValidation.error);
    process.exit(1);
  }

  await runCustomStructure(filePath, outDir);
}

/**
 * Custom-structure flow sourced from a public GitHub repo (or a subfolder
 * within one) instead of a local file. Uses GitHub's tree API for a single
 * listing call, then either writes empty files (structure only) or fetches
 * real content per file from raw.githubusercontent.com.
 */
async function handleCustomFromGitHub() {
  const { githubUrl } = await inquirer.prompt([
    {
      type: "input",
      name: "githubUrl",
      message: "Enter the GitHub repo URL (optionally .../tree/<branch>/<subpath>):",
    },
  ]);

  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    log.error(
      "❌ Could not parse that as a GitHub URL. Expected something like https://github.com/owner/repo or https://github.com/owner/repo/tree/branch/path."
    );
    process.exit(1);
  }

  // GITHUB_TOKEN/GH_TOKEN (matching gh CLI's own convention) — raises the
  // unauthenticated 60/hour rate limit to 5,000/hour and unlocks private
  // repos. Entirely optional; the flow works the same without one.
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined;
  if (token) {
    log.info("ℹ️ Using GITHUB_TOKEN for authenticated GitHub requests (5,000/hour limit).");
  }

  const { includeContents } = await inquirer.prompt([
    {
      type: "list",
      name: "includeContents",
      message: "What should be created?",
      choices: [
        { name: "📂 Structure only (empty files/folders)", value: false },
        { name: "📄 Structure + real file contents", value: true },
      ],
    },
  ]);

  const fetchSpinner = ora(`Fetching structure from ${parsed.owner}/${parsed.repo}...`).start();
  let tree;
  try {
    tree = await fetchGitHubTree({ ...parsed, token });
    fetchSpinner.stop();
  } catch (error) {
    fetchSpinner.fail(error.message);
    process.exit(1);
  }

  if (tree.truncated) {
    log.warn(
      "⚠️ GitHub truncated this listing (the repo/subfolder is very large) — some deeply nested files may be missing."
    );
  }

  const fileCount = tree.entries.filter((entry) => entry.type === "blob").length;
  if (fileCount === 0) {
    log.error("❌ No files found at that location.");
    process.exit(1);
  }

  if (fileCount > 300) {
    const { proceedLarge } = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceedLarge",
        message: `This will create ${fileCount} files${
          includeContents ? " and fetch all their contents" : ""
        }. Continue?`,
        default: false,
      },
    ]);
    if (!proceedLarge) {
      log.info("Cancelled.");
      return;
    }
  }

  const { outputBase } = await inquirer.prompt([
    {
      type: "input",
      name: "outputBase",
      message: "Enter output directory (leave empty for current directory):",
    },
  ]);

  const outDir = outputBase.trim() ? cleanPath(outputBase) : process.cwd();
  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    log.error(dirValidation.error);
    process.exit(1);
  }

  const canProceed = await confirmOverwriteIfNeeded(outDir);
  if (!canProceed) {
    log.info("Cancelled.");
    return;
  }

  const writeSpinner = ora(
    includeContents ? `Fetching ${fileCount} file(s)...` : `Creating ${fileCount} file(s)...`
  ).start();
  let result;
  try {
    result = await writeGitHubStructure({
      owner: parsed.owner,
      repo: parsed.repo,
      branch: tree.branch,
      entries: tree.entries,
      outDir,
      includeContents,
      token,
    });
    writeSpinner.stop();
  } catch (error) {
    writeSpinner.fail(error.message);
    process.exit(1);
  }

  log.success(`✅ Structure created successfully at: ${outDir}`);
  if (result.failures > 0) {
    log.warn(`⚠️ ${result.failures} file(s) could not be fetched and were created empty instead.`);
  }

  const devCommand = includeContents ? detectDevCommand(outDir) : null;
  printNextSteps(outDir, devCommand ? `npm install\n   ${devCommand}` : null);
}

/**
 * Creates a structure from an already-validated file path and output directory.
 * Shared by the interactive "Custom Structure" flow and the non-interactive
 * `create-structure <file> [outputDir]` argv fast path.
 */
async function runCustomStructure(filePath, outDir) {
  let packageJsonContent = null;

  // check if JSON and contains package.json
  if (filePath.endsWith(".json")) {
    try {
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8").trim());
      if (jsonData["package.json"]) {
        packageJsonContent = jsonData["package.json"];
      }
    } catch {
      log.warn("⚠️ Could not parse JSON file, skipping dependency check.");
    }
  }

  await processStructure(filePath, outDir);
  log.success(`✅ Structure created successfully at: ${outDir}`);

  if (packageJsonContent) {
    await maybeInstallDependencies(outDir, packageJsonContent, detectDevCommand(outDir));
  } else {
    printNextSteps(outDir, detectDevCommand(outDir));
  }
}

function uniqueValues(list, key) {
  return [...new Set(list.map((item) => item[key]).filter(Boolean))];
}

/**
 * Flow for built-in templates. Fully data-driven: the category/framework/
 * variant/language prompts (and the final set of choices at each step) come
 * from the fetched template registry index, not hardcoded lists — so adding
 * a template to the registry never requires touching this function.
 */
async function handleTemplate() {
  let index;
  const indexSpinner = ora("Fetching template registry...").start();
  try {
    index = await fetchTemplateIndex();
    indexSpinner.stop();
  } catch (error) {
    indexSpinner.fail(error.message);
    process.exit(1);
  }

  if (!index || index.length === 0) {
    log.warn("⚠️ No built-in templates are available right now.");
    return;
  }

  let candidates = index;

  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: "Choose a project category:",
      choices: ["⬅ Back to main menu", ...uniqueValues(candidates, "category")],
    },
  ]);
  if (category === "⬅ Back to main menu") return "BACK";
  candidates = candidates.filter((t) => t.category === category);

  const { framework } = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Choose a framework:",
      choices: uniqueValues(candidates, "framework"),
    },
  ]);
  candidates = candidates.filter((t) => t.framework === framework);

  const remainingDimensions = [
    ["variant", "a variant"],
    ["router", "a Next.js router"],
    ["language", "a language"],
    ["rbac", "an access-control (RBAC) style"],
  ];
  for (const [dim, label] of remainingDimensions) {
    const values = uniqueValues(candidates, dim);
    if (values.length > 1) {
      const answer = await inquirer.prompt([
        {
          type: "list",
          name: dim,
          message: `Choose ${label}:`,
          choices: values,
        },
      ]);
      candidates = candidates.filter((t) => t[dim] === answer[dim]);
    }
  }

  if (candidates.length !== 1) {
    log.error(
      candidates.length === 0
        ? "❌ No template matches that combination."
        : "❌ That combination matches more than one template — the registry has ambiguous data."
    );
    process.exit(1);
  }

  const template = candidates[0];

  const projectName = await promptProjectName();
  const { outputBase } = await inquirer.prompt([
    {
      type: "input",
      name: "outputBase",
      message:
        "Enter output directory (leave empty to create a new folder with the project name):",
    },
  ]);

  const outDir = outputBase.trim()
    ? cleanPath(outputBase)
    : path.join(process.cwd(), projectName);

  const canProceed = await confirmOverwriteIfNeeded(outDir);
  if (!canProceed) {
    log.warn("⚠️ Aborted — target directory not empty.");
    return;
  }

  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    log.error(dirValidation.error);
    process.exit(1);
  }

  const spinner = ora(`Fetching ${template.name}...`).start();
  try {
    await instantiateTemplate(template.key, outDir, { projectName });
    spinner.succeed(`Project created at: ${outDir}`);
  } catch (error) {
    spinner.fail(`Error creating project: ${error.message}`);
    process.exit(1);
  }

  const generatedPkgPath = path.join(outDir, "package.json");
  if (fs.existsSync(generatedPkgPath)) {
    await maybeInstallDependencies(
      outDir,
      fs.readFileSync(generatedPkgPath, "utf-8"),
      template.devCommand
    );
  }
}

// Order dimensions are asked in, with their prompt message and (optionally)
// which module name should be pre-highlighted as the default choice. RBAC is
// only ever shown if a module it depends on (auth) was actually selected —
// see the availability filter below.
const COMPOSER_DIMENSIONS = [
  ["database", "Choose a database:"],
  ["validation", "Choose a validation library:"],
  ["routing", "Choose a routing library:"],
  ["styling", "Choose a styling approach:", "Tailwind CSS"],
  ["state", "Choose a state management library:"],
  ["auth", "Choose an auth style:"],
  ["rbac", "Choose an access-control (RBAC) style:"],
  ["realtime", "Add a real-time (WebSocket) option?"],
  ["logging", "Choose a logging library (Pino is used by default):", "None"],
  ["testing", "Choose a testing library:"],
  ["docker", "Add Docker support?"],
  ["ci", "Add CI (GitHub Actions)?"],
];

/**
 * Parses `--key=value` and bare `--flag` arguments into an object. Bare
 * flags (no `=`) become `true`. Anything not starting with `--` is ignored.
 */
function parseCliFlags(argv) {
  const flags = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    if (eq === -1) {
      flags[arg.slice(2)] = true;
    } else {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    }
  }
  return flags;
}

/**
 * Prints every base and module key in the registry, grouped by dimension —
 * the reference `create-structure compose --list` points to, since the
 * non-interactive flags below take module *keys* (stable identifiers), not
 * the display names shown in the interactive menu.
 */
function printComposerRegistry(index) {
  log.custom("\nBases (--base=<key>):", "bold");
  for (const base of index.bases) {
    log.info(`  ${base.key.padEnd(20)} ${base.name} (${base.framework}, ${base.language})`);
  }

  const byDimension = {};
  for (const mod of index.modules) {
    (byDimension[mod.dimension] ||= []).push(mod);
  }

  for (const [dimension] of COMPOSER_DIMENSIONS) {
    const mods = byDimension[dimension];
    if (!mods) continue;
    log.custom(`\n--${dimension}=<key>:`, "bold");
    for (const mod of mods) {
      log.info(`  ${mod.key.padEnd(24)} ${mod.name} (${mod.framework}, ${mod.languages.join("/")})`);
    }
  }
}

/**
 * Flag-driven equivalent of promptModuleSelection(): resolves module
 * selections for one base from `--<prefix><dimension>=<key>` flags,
 * honoring dependsOn requirements the same way the interactive prompt does.
 * `prefix` namespaces the flag keys ("backend:"/"frontend:" for --fullstack,
 * "" for the single-target command) so the same dimension name (auth,
 * testing) can be answered independently on each side without colliding.
 */
function resolveModulesFromFlags(index, base, flags, prefix = "") {
  const { language, framework } = base;

  const modulesByDimension = {};
  for (const mod of index.modules) {
    if (!mod.languages.includes(language)) continue;
    if (mod.framework !== "any" && mod.framework !== framework) continue;
    (modulesByDimension[mod.dimension] ||= []).push(mod);
  }

  const selected = {};
  for (const [dimension] of COMPOSER_DIMENSIONS) {
    const flagKey = `${prefix}${dimension}`;
    const flagValue = flags[flagKey];
    if (!flagValue || flagValue === true) continue;

    const candidates = modulesByDimension[dimension] || [];
    const mod = candidates.find((m) => m.key === flagValue);
    if (!mod) {
      const validKeys = candidates.map((m) => m.key).join(", ") || "(none available for this base)";
      log.error(
        `❌ Unknown or unavailable module "${flagValue}" for --${flagKey}. Valid options: ${validKeys}`
      );
      process.exit(1);
    }

    const missingDeps = (mod.dependsOn || []).filter((dep) => !selected[dep]);
    if (missingDeps.length > 0) {
      log.error(
        `❌ --${flagKey}=${flagValue} requires ${missingDeps.join(", ")} to also be selected.`
      );
      process.exit(1);
    }

    selected[mod.key] = mod;
  }

  return selected;
}

/**
 * Non-interactive full-stack composer: `create-structure compose --fullstack
 * --backend=<key> --frontend=<key> --backend:<dim>=<key> --frontend:<dim>=<key>
 * --name=... `. Mirrors handleComposeFullStack()'s logic (one repo, backend/
 * + frontend/ subfolders, shared README) but takes every answer from flags.
 */
async function runFullStackNonInteractive(index, flags) {
  if (!flags.backend || flags.backend === true) {
    log.error("❌ --backend=<key> is required with --fullstack. Run `create-structure compose --list`.");
    process.exit(1);
  }
  if (!flags.frontend || flags.frontend === true) {
    log.error("❌ --frontend=<key> is required with --fullstack. Run `create-structure compose --list`.");
    process.exit(1);
  }

  const backendBase = index.bases.find((b) => b.key === flags.backend && b.framework !== "react");
  if (!backendBase) {
    log.error(`❌ Unknown or non-backend base "${flags.backend}".`);
    process.exit(1);
  }
  const frontendBase = index.bases.find((b) => b.key === flags.frontend && b.framework === "react");
  if (!frontendBase) {
    log.error(`❌ Unknown or non-frontend base "${flags.frontend}".`);
    process.exit(1);
  }

  const backendSelected = resolveModulesFromFlags(index, backendBase, flags, "backend:");
  const frontendSelected = resolveModulesFromFlags(index, frontendBase, flags, "frontend:");

  if (!flags.name || flags.name === true) {
    log.error("❌ --name=<projectName> is required.");
    process.exit(1);
  }
  if (!PROJECT_NAME_PATTERN.test(flags.name)) {
    log.error(
      "❌ --name must use lowercase letters, numbers, hyphens, dots, or underscores, starting with a letter or number."
    );
    process.exit(1);
  }

  const rootDir =
    flags.out && flags.out !== true ? cleanPath(flags.out) : path.join(process.cwd(), flags.name);
  const backendDir = path.join(rootDir, "backend");
  const frontendDir = path.join(rootDir, "frontend");

  if (!flags.yes) {
    const canProceed = await confirmOverwriteIfNeeded(rootDir);
    if (!canProceed) {
      log.info("Cancelled.");
      return;
    }
  }

  for (const dir of [backendDir, frontendDir]) {
    const dirValidation = validateDirectory(dir);
    if (!dirValidation.valid) {
      log.error(dirValidation.error);
      process.exit(1);
    }
  }

  const backendSpinner = ora("Composing backend...").start();
  try {
    await composeBackend({
      baseKey: backendBase.key,
      moduleKeys: Object.keys(backendSelected),
      language: backendBase.language,
      outDir: backendDir,
      vars: { projectName: flags.name },
    });
    backendSpinner.succeed(`Backend created at: ${backendDir}`);
  } catch (error) {
    backendSpinner.fail(`Error composing backend: ${error.message}`);
    process.exit(1);
  }

  const frontendSpinner = ora("Composing frontend...").start();
  try {
    await composeBackend({
      baseKey: frontendBase.key,
      moduleKeys: Object.keys(frontendSelected),
      language: frontendBase.language,
      outDir: frontendDir,
      vars: { projectName: flags.name },
    });
    frontendSpinner.succeed(`Frontend created at: ${frontendDir}`);
  } catch (error) {
    frontendSpinner.fail(`Error composing frontend: ${error.message}`);
    process.exit(1);
  }

  writeFullStackReadme(rootDir, {
    projectName: flags.name,
    backendHasAuth: Object.keys(backendSelected).some((key) => key.startsWith("auth-")),
    frontendHasAuth: Boolean(frontendSelected["auth-react"]),
  });

  if (flags.install) {
    await installDependencies(backendDir);
    await installDependencies(frontendDir);
  }
  printFullStackNextSteps(backendDir, frontendDir, !flags.install);
}

/**
 * Non-interactive composer entry point: `create-structure compose --base=...`.
 * Mirrors handleComposeBackend()'s logic (same registry, same dimension
 * list, same composeBackend() call) but takes every answer from flags
 * instead of prompting, so it can run unattended in CI. `--fullstack`
 * switches to the two-sided flow (--backend/--frontend instead of --base).
 */
async function handleComposeNonInteractive(argv) {
  const flags = parseCliFlags(argv);

  const indexSpinner = ora("Fetching composer registry...").start();
  let index;
  try {
    index = await fetchComposerIndex();
    indexSpinner.stop();
  } catch (error) {
    indexSpinner.fail(error.message);
    process.exit(1);
  }

  if (flags.list) {
    printComposerRegistry(index);
    return;
  }

  if (flags.fullstack) {
    await runFullStackNonInteractive(index, flags);
    return;
  }

  if (!flags.base || flags.base === true) {
    log.error("❌ --base=<key> is required. Run `create-structure compose --list` to see available bases.");
    process.exit(1);
  }
  const base = index.bases.find((b) => b.key === flags.base);
  if (!base) {
    log.error(
      `❌ Unknown base "${flags.base}". Run \`create-structure compose --list\` to see available bases.`
    );
    process.exit(1);
  }

  const { key: baseKey, language } = base;
  const selected = resolveModulesFromFlags(index, base, flags);
  const moduleKeys = Object.keys(selected);

  if (!flags.name || flags.name === true) {
    log.error("❌ --name=<projectName> is required.");
    process.exit(1);
  }
  if (!PROJECT_NAME_PATTERN.test(flags.name)) {
    log.error(
      "❌ --name must use lowercase letters, numbers, hyphens, dots, or underscores, starting with a letter or number."
    );
    process.exit(1);
  }

  const outDir =
    flags.out && flags.out !== true ? cleanPath(flags.out) : path.join(process.cwd(), flags.name);

  if (!flags.yes) {
    const canProceed = await confirmOverwriteIfNeeded(outDir);
    if (!canProceed) {
      log.info("Cancelled.");
      return;
    }
  }

  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    log.error(dirValidation.error);
    process.exit(1);
  }

  const composeSpinner = ora("Composing project...").start();
  try {
    await composeBackend({ baseKey, moduleKeys, language, outDir, vars: { projectName: flags.name } });
    composeSpinner.succeed(`Project created at: ${outDir}`);
  } catch (error) {
    composeSpinner.fail(`Error composing project: ${error.message}`);
    process.exit(1);
  }

  if (flags.install) {
    await installDependencies(outDir);
    printNextSteps(outDir, "npm run dev");
  } else {
    printNextSteps(outDir, "npm install\n   npm run dev");
  }
}

/**
 * Runs the "pick a module for this dimension, or None" prompt loop for one
 * base, respecting each module's language/framework filter and dependsOn
 * requirements. Shared by the single-target composer and the full-stack
 * flow (which calls this once per side). `defaultOverrides` lets a caller
 * default a dimension to something other than COMPOSER_DIMENSIONS' own
 * default for this one run — used by the full-stack flow to default the
 * frontend's auth prompt to match when the backend already picked one.
 */
async function promptModuleSelection(index, base, defaultOverrides = {}) {
  const { language, framework } = base;

  const modulesByDimension = {};
  for (const mod of index.modules) {
    if (!mod.languages.includes(language)) continue;
    if (mod.framework !== "any" && mod.framework !== framework) continue;
    (modulesByDimension[mod.dimension] ||= []).push(mod);
  }

  const selected = {};
  for (const [dimension, message, defaultName] of COMPOSER_DIMENSIONS) {
    const candidates = modulesByDimension[dimension] || [];
    if (candidates.length === 0) continue;

    const available = candidates.filter((mod) =>
      (mod.dependsOn || []).every((dep) => selected[dep])
    );
    if (available.length === 0) continue;

    const choices = [...available.map((mod) => mod.name), "None"];
    const prompt = { type: "list", name: "choice", message, choices };
    const effectiveDefault = defaultOverrides[dimension] || defaultName;
    if (effectiveDefault && choices.includes(effectiveDefault)) {
      prompt.default = effectiveDefault;
    }

    const { choice } = await inquirer.prompt([prompt]);
    if (choice === "None") continue;

    const mod = available.find((m) => m.name === choice);
    selected[mod.key] = mod;
  }

  return selected;
}

/**
 * Flow for the composable generator: instead of picking one of a fixed set
 * of complete templates, each answer here selects an independent module (or
 * none) that the composer assembles into the final project. First asks
 * whether you want a backend, a frontend, or both (full-stack) — filtering
 * the base list to match — then hands off to the same per-dimension
 * selection loop either way. Entirely data-driven from the fetched composer
 * index, so a new base or module shows up here automatically, no cli.js
 * changes needed.
 */
async function handleComposeBackend() {
  const indexSpinner = ora("Fetching composer registry...").start();
  let index;
  try {
    index = await fetchComposerIndex();
    indexSpinner.stop();
  } catch (error) {
    indexSpinner.fail(error.message);
    process.exit(1);
  }

  const { scope } = await inquirer.prompt([
    {
      type: "list",
      name: "scope",
      message: "What do you want to compose?",
      choices: [
        { name: "⬅ Back to main menu", value: "back" },
        {
          name: "Backend only",
          value: "backend",
          description: "An API server — Express, Fastify, or NestJS — with auth, database, etc. picked module by module.",
        },
        {
          name: "Frontend only",
          value: "frontend",
          description: "A React + Vite app with routing, styling, state, etc. picked module by module.",
        },
        {
          name: "Full-stack (both)",
          value: "fullstack",
          description: "A backend AND a frontend together in one folder, already set up to talk to each other (matching auth, ports, CORS).",
        },
      ],
    },
  ]);

  if (scope === "back") return "BACK";
  if (scope === "fullstack") return handleComposeFullStack(index);

  const candidateBases = index.bases.filter((b) =>
    scope === "backend" ? b.framework !== "react" : b.framework === "react"
  );
  if (candidateBases.length === 0) {
    log.error(`❌ The registry doesn't currently have any ${scope} bases available.`);
    process.exit(1);
  }

  let base;
  if (candidateBases.length === 1) {
    base = candidateBases[0];
  } else {
    const { baseName } = await inquirer.prompt([
      {
        type: "list",
        name: "baseName",
        message: "Choose a base:",
        choices: candidateBases.map((b) => b.name),
      },
    ]);
    base = candidateBases.find((b) => b.name === baseName);
  }

  const baseKey = base.key;
  const language = base.language;

  const selected = await promptModuleSelection(index, base);
  const moduleKeys = Object.keys(selected);

  const projectName = await promptProjectName();
  const { outputBase } = await inquirer.prompt([
    {
      type: "input",
      name: "outputBase",
      message:
        "Enter output directory (leave empty to create a new folder with the project name):",
    },
  ]);
  const outDir = outputBase.trim()
    ? cleanPath(outputBase)
    : path.join(process.cwd(), projectName);

  const canProceed = await confirmOverwriteIfNeeded(outDir);
  if (!canProceed) {
    log.warn("⚠️ Aborted — target directory not empty.");
    return;
  }

  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    log.error(dirValidation.error);
    process.exit(1);
  }

  const spinner = ora("Composing backend...").start();
  try {
    await composeBackend({ baseKey, moduleKeys, language, outDir, vars: { projectName } });
    spinner.succeed(`Project created at: ${outDir}`);
  } catch (error) {
    spinner.fail(`Error composing project: ${error.message}`);
    process.exit(1);
  }

  const generatedPkgPath = path.join(outDir, "package.json");
  if (fs.existsSync(generatedPkgPath)) {
    await maybeInstallDependencies(
      outDir,
      fs.readFileSync(generatedPkgPath, "utf-8"),
      "npm run dev"
    );
  }
}

/**
 * Writes a root-level README for the full-stack flow, tying the two
 * independently-composed halves together and calling out that their auth
 * modules (when both picked) already match each other's default env values
 * out of the box — no manual wiring needed for the common case.
 */
function writeFullStackReadme(rootDir, { projectName, backendHasAuth, frontendHasAuth }) {
  const authNote =
    backendHasAuth && frontendHasAuth
      ? "\nBoth sides include auth — `frontend/`'s auth module talks to the exact JWT contract `backend/`'s auth module exposes, and their default `.env.example` values (backend port 4000 + CORS origin, frontend's API URL) already match each other out of the box.\n"
      : "\n";

  const content = `# ${projectName}

A full-stack app composed with [create-structure-cli](https://www.npmjs.com/package/create-structure-cli) — an independently-composed backend and frontend, in one repo.

## Structure

\`\`\`
backend/    — see backend/README.md for what was composed in
frontend/   — see frontend/README.md for what was composed in
\`\`\`
${authNote}
## Running both

\`\`\`bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
\`\`\`

Each side has its own \`.env.example\` — copy it to \`.env\` before running if you change any of the defaults (backend port, CORS origin, frontend API URL).
`;

  fs.writeFileSync(path.join(rootDir, "README.md"), content, "utf-8");
}

/**
 * Prints the combined "next steps" for the full-stack flow — two dev
 * servers in two terminals, rather than the single-project message
 * printNextSteps() gives everywhere else.
 */
function printFullStackNextSteps(backendDir, frontendDir, needsInstall) {
  const installStep = needsInstall ? "npm install && " : "";
  log.custom(
    `🚀 Next steps:\n` +
      `   Terminal 1: cd ${backendDir} && ${installStep}npm run dev\n` +
      `   Terminal 2: cd ${frontendDir} && ${installStep}npm run dev`,
    "rgb(194, 156, 247).bold"
  );
}

/**
 * Full-stack flow: composes a backend AND a frontend in one invocation,
 * nested under backend/ and frontend/ inside a single project folder,
 * instead of two unrelated runs of the single-target composer. Defaults the
 * frontend's auth dimension to match if the backend picked one, since the
 * two auth modules are built to talk to each other. Called from
 * handleComposeBackend() once "Full-stack" is picked, reusing the registry
 * it already fetched — `index` is only re-fetched here if called without one.
 */
async function handleComposeFullStack(index) {
  if (!index) {
    const indexSpinner = ora("Fetching composer registry...").start();
    try {
      index = await fetchComposerIndex();
      indexSpinner.stop();
    } catch (error) {
      indexSpinner.fail(error.message);
      process.exit(1);
    }
  }

  const backendBases = index.bases.filter((b) => b.framework !== "react");
  const frontendBases = index.bases.filter((b) => b.framework === "react");
  if (backendBases.length === 0 || frontendBases.length === 0) {
    log.error("❌ The registry doesn't currently have both a backend and a frontend base available.");
    process.exit(1);
  }

  log.custom("\n— Backend —", "bold");
  const { backendBaseName } = await inquirer.prompt([
    {
      type: "list",
      name: "backendBaseName",
      message: "Choose a backend base:",
      choices: backendBases.map((b) => b.name),
    },
  ]);
  const backendBase = backendBases.find((b) => b.name === backendBaseName);
  const backendSelected = await promptModuleSelection(index, backendBase);
  const backendHasAuth = Object.keys(backendSelected).some((key) => key.startsWith("auth-"));

  log.custom("\n— Frontend —", "bold");
  const { frontendBaseName } = await inquirer.prompt([
    {
      type: "list",
      name: "frontendBaseName",
      message: "Choose a frontend base:",
      choices: frontendBases.map((b) => b.name),
    },
  ]);
  const frontendBase = frontendBases.find((b) => b.name === frontendBaseName);
  const frontendDefaults = backendHasAuth ? { auth: "Auth (JWT)" } : {};
  const frontendSelected = await promptModuleSelection(index, frontendBase, frontendDefaults);

  const projectName = await promptProjectName();
  const { outputBase } = await inquirer.prompt([
    {
      type: "input",
      name: "outputBase",
      message: "Enter output directory (leave empty to create a new folder with the project name):",
    },
  ]);
  const rootDir = outputBase.trim() ? cleanPath(outputBase) : path.join(process.cwd(), projectName);
  const backendDir = path.join(rootDir, "backend");
  const frontendDir = path.join(rootDir, "frontend");

  const canProceed = await confirmOverwriteIfNeeded(rootDir);
  if (!canProceed) {
    log.warn("⚠️ Aborted — target directory not empty.");
    return;
  }

  for (const dir of [backendDir, frontendDir]) {
    const dirValidation = validateDirectory(dir);
    if (!dirValidation.valid) {
      log.error(dirValidation.error);
      process.exit(1);
    }
  }

  const backendSpinner = ora("Composing backend...").start();
  try {
    await composeBackend({
      baseKey: backendBase.key,
      moduleKeys: Object.keys(backendSelected),
      language: backendBase.language,
      outDir: backendDir,
      vars: { projectName },
    });
    backendSpinner.succeed(`Backend created at: ${backendDir}`);
  } catch (error) {
    backendSpinner.fail(`Error composing backend: ${error.message}`);
    process.exit(1);
  }

  const frontendSpinner = ora("Composing frontend...").start();
  try {
    await composeBackend({
      baseKey: frontendBase.key,
      moduleKeys: Object.keys(frontendSelected),
      language: frontendBase.language,
      outDir: frontendDir,
      vars: { projectName },
    });
    frontendSpinner.succeed(`Frontend created at: ${frontendDir}`);
  } catch (error) {
    frontendSpinner.fail(`Error composing frontend: ${error.message}`);
    process.exit(1);
  }

  writeFullStackReadme(rootDir, {
    projectName,
    backendHasAuth,
    frontendHasAuth: Boolean(frontendSelected["auth-react"]),
  });
  log.success(`✅ Full-stack project created at: ${rootDir}`);

  const { confirmInstall } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmInstall",
      message: "Auto install dependencies for both backend and frontend?",
      default: true,
    },
  ]);

  if (confirmInstall) {
    await installDependencies(backendDir);
    await installDependencies(frontendDir);
  }
  printFullStackNextSteps(backendDir, frontendDir, !confirmInstall);
}

/**
 * Process structure file (JSON or text tree).
 */
async function processStructure(filePath, outputBase) {
  try {
    const content = fs.readFileSync(filePath, "utf-8").trim();
    if (!content) {
      log.error(`❌ File is empty: ${filePath}`);
      process.exit(1);
    }

    if (filePath.endsWith(".json") || content.startsWith("{")) {
      try {
        const jsonData = JSON.parse(content);
        createFromJson(jsonData, outputBase);
      } catch (error) {
        log.error(`❌ Invalid JSON format: ${error.message}`);
        process.exit(1);
      }
    } else {
      createFromText(content.split("\n"), outputBase);
    }
  } catch (error) {
    log.error(`❌ Error processing structure: ${error.message}`);
    process.exit(1);
  }
}
// Decode content if it's base64 encoded (for binary files) or return as is
function decodeContent(content) {
  // assumimg base64 if starts with data: not a foolproof check need better way
  if (content.startsWith("data:")) {
    try {
      const base64Data = content.split(",")[1];
      return Buffer.from(base64Data, "base64");
    } catch (error) {
      log.error(`❌ Error decoding content: ${error.message}`);
      throw error;
    }
  }
  // return as is if not base64
  return content;
}
/**
 * Create files/folders from JSON.
 */
function createFromJson(structure, basePath) {
  for (const name in structure) {
    try {
      const fullPath = path.join(basePath, name);
      if (typeof structure[name] === "string") {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        const content = decodeContent(structure[name]); // returns Buffer or string
        fs.writeFileSync(fullPath, content);
      } else {
        fs.mkdirSync(fullPath, { recursive: true });
        createFromJson(structure[name], fullPath);
      }
    } catch (error) {
      log.error(`❌ Error creating ${name}: ${error.message}`);
      process.exit(1);
    }
  }
}

/**
 * Create files/folders from text tree.
 */
function createFromText(lines, basePath) {
  try {
    lines = lines.filter((line) => line.trim());
    if (lines.length === 0) {
      log.error(`❌ No valid content found in the structure file`);
      process.exit(1);
    }

    let stack = [{ depth: -1, dir: basePath }];
    const firstLine = lines[0].trim();

    if (firstLine.endsWith("/")) {
      // Anchored (^) so this only strips leading tree-drawing chars/ASCII
      // dashes, never a hyphen that's actually part of the folder's own
      // name (e.g. "my-app/") — a global strip here would mangle those.
      const rootFolderName = firstLine
        .replace(/^[├└│─\-\s]+/, "")
        .replace(/\/$/, "");
      const rootPath = path.join(basePath, rootFolderName);
      fs.mkdirSync(rootPath, { recursive: true });
      stack = [{ depth: -1, dir: rootPath }];
      lines = lines.slice(1);
    }

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try {
        const cleanedLine = line.replace(/[├└│]/g, "");
        const depth = cleanedLine.search(/\S/);
        // Matches the box-drawing dash (─) *and* plain ASCII hyphens typed
        // by hand ("--", "- ", etc.) — previously only ─ was stripped, so
        // a hand-typed "-- filename" tree left a literal "-- " stuck to
        // every name.
        const name = cleanedLine.trim().replace(/^[─\-]+\s*/, "");

        if (!name) {
          log.warn(`⚠️ Warning: Empty name at line ${index + 1}, skipping`);
          return;
        }

        const isDir = name.endsWith("/");

        while (stack.length && stack[stack.length - 1].depth >= depth) {
          stack.pop();
        }

        if (stack.length === 0) {
          log.error(
            `❌ Invalid structure at line ${index + 1}: No parent directory`
          );
          process.exit(1);
        }

        const parentDir = stack[stack.length - 1].dir;
        const targetPath = path.join(parentDir, name.replace(/\/$/, ""));

        if (isDir) {
          fs.mkdirSync(targetPath, { recursive: true });
          stack.push({ depth, dir: targetPath });
        } else {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, "");
        }
      } catch (error) {
        log.error(
          `❌ Error processing line ${index + 1}: "${line}":
          ${error.message}`
        );
        process.exit(1);
      }
    });
  } catch (error) {
    log.error(`❌ Error creating text structure: ${error.message}`);
    process.exit(1);
  }
}

// Start the application
main();
