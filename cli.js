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
 * Shared helper → asks + installs dependencies if package.json has deps.
 * devCommand (optional) is shown in the final "next steps" message.
 */
async function maybeInstallDependencies(outDir, packageJsonContent, devCommand) {
  try {
    const pkg = JSON.parse(packageJsonContent);
    const hasDeps =
      (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) ||
      (pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0);

    if (!hasDeps) return;

    const { confirmDependenciesInstall } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDependenciesInstall",
        message: "Auto install dependencies?",
        default: true,
      },
    ]);

    const printNextSteps = () => {
      const lines = [`cd ${outDir}`];
      if (devCommand) lines.push(devCommand);
      log.custom(`🚀 Next steps:\n   ${lines.join("\n   ")}`, "rgb(194, 156, 247).bold");
    };

    if (confirmDependenciesInstall) {
      const spinner = ora("Installing dependencies...").start();
      const startTime = Date.now();

      await new Promise((resolve) => {
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
            printNextSteps();
          }
          resolve();
        });
      });
    } else {
      log.warn(
        `⚠️ Remember to install dependencies manually. Run 'cd ${outDir} && npm install'`
      );
      printNextSteps();
    }
  } catch {
    // ignore if parsing fails
  }
}

/**
 * Main entry point with Inquirer flow.
 */
async function main() {
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
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "What do you want to do?",
        choices: [
          "🔩 Official Template (npx create-*)",
          "⚡️ Built-in Boilerplate",
          "🧩 Compose a Backend",
          "📂 Custom Structure",
        ],
      },
    ]);

    if (mode === "📂 Custom Structure") {
      await handleCustom();
    } else if (mode === "⚡️ Built-in Boilerplate") {
      await handleTemplate();
    } else if (mode === "🧩 Compose a Backend") {
      await handleComposeBackend();
    } else if (mode === "🔩 Official Template (npx create-*)") {
      await handleOfficial();
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
        "React (CRA)",
        "Vite",
        "Next.js",
        "Angular",
        "Fastify",
        "Nest.js",
      ],
    },
  ]);

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
    const devCommand = OFFICIAL_DEV_COMMANDS[framework];
    log.custom(
      `🚀 Next steps:\n   cd ${projectName}${devCommand ? `\n   ${devCommand}` : ""}`,
      "rgb(194, 156, 247).bold"
    );
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
    await maybeInstallDependencies(outDir, packageJsonContent);
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
      choices: uniqueValues(candidates, "category"),
    },
  ]);
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

// Order dimensions are asked in, with their prompt message. RBAC is only
// ever shown if a module it depends on (auth) was actually selected — see
// the availability filter below.
const COMPOSER_DIMENSIONS = [
  ["database", "Choose a database:"],
  ["validation", "Choose a validation library:"],
  ["auth", "Choose an auth style:"],
  ["rbac", "Choose an access-control (RBAC) style:"],
  ["testing", "Choose a testing library:"],
];

/**
 * Flow for the composable backend generator: instead of picking one of a
 * fixed set of complete templates, each answer here selects an independent
 * module (or none) that the composer assembles into the final project.
 * Entirely data-driven from the fetched composer index — a new module shows
 * up here automatically, no cli.js changes needed.
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

  let base;
  if (index.bases.length === 1) {
    base = index.bases[0];
  } else {
    const { baseName } = await inquirer.prompt([
      {
        type: "list",
        name: "baseName",
        message: "Choose a base:",
        choices: index.bases.map((b) => b.name),
      },
    ]);
    base = index.bases.find((b) => b.name === baseName);
  }

  const baseKey = base.key;
  const language = base.language;

  const modulesByDimension = {};
  for (const mod of index.modules) {
    if (!mod.languages.includes(language)) continue;
    (modulesByDimension[mod.dimension] ||= []).push(mod);
  }

  const selected = {};
  for (const [dimension, message] of COMPOSER_DIMENSIONS) {
    const candidates = modulesByDimension[dimension] || [];
    if (candidates.length === 0) continue;

    const available = candidates.filter((mod) =>
      (mod.dependsOn || []).every((dep) => selected[dep])
    );
    if (available.length === 0) continue;

    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message,
        choices: [...available.map((mod) => mod.name), "None"],
      },
    ]);
    if (choice === "None") continue;

    const mod = available.find((m) => m.name === choice);
    selected[mod.key] = mod;
  }

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
      const rootFolderName = firstLine
        .replace(/[├└│─ ]/g, "")
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
        const name = cleanedLine.trim().replace(/^─+\s*/, "");

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
