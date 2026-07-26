#!/usr/bin/env node
//native modules
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
//external modules
import inquirer from "inquirer";
import chalk from "chalk";
//local modules
import { instantiateTemplate } from "./lib/templateEngine.js";

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
// log.custom(
//   "✨ Starting Create-Structure-CLI...",
//   "rgb(85, 254, 254).underline"
// );

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
 * Shared helper → asks + installs dependencies if package.json has deps.
 */
async function maybeInstallDependencies(outDir, packageJsonContent) {
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

    if (confirmDependenciesInstall) {
      log.info("⚙️ Installing dependencies...");
      // Loader animation while installing
      const loaderChars = ["|", "/", "-", "\\"];
      const dots = ["", ".", "..", "..."];
      const spaces = ["   ", "  ", " ", ""];
      let i = 0;
      let seconds = 0;

      // Combined output for spinner and timer
      const interval = setInterval(() => {
        const spinner = loaderChars[i % loaderChars.length];
        const dotStr = dots[i % dots.length];
        const spaceStr = spaces[i % spaces.length];
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          `${spinner} Please wait${dotStr}${spaceStr}  ⏳ ${seconds} seconds elapsed`
        );
        i++;
        if (i % 5 === 0) seconds++;
      }, 200);
      const startTime = Date.now();
      const installProc = spawn("npm", ["install"], {
        cwd: outDir,
        shell: true,
        stdio: "ignore",
      });
      installProc.on("error", (error) => {
        clearInterval(interval);
        process.stdout.write("\n");
        log.error(`❌ Error installing dependencies: ${error.message}`);
        process.exit(1);
      });
      installProc.on("close", (code) => {
        clearInterval(interval);
        const timeElapsed = Date.now() - startTime;
        process.stdout.write("\n"); // Move to next line after loader
        if (code !== 0) {
          log.error(`❌ Error installing dependencies: npm install exited with code ${code}`);
          process.exit(1);
        } else {
          log.success(
            `✅ Dependencies installed successfully within ${
              timeElapsed / 1000
            } seconds`
          );
          log.custom(
            `🚀 Happy coding! To open in VS Code, type 'cd ${outDir} && code .'`,
            "rgb(194, 156, 247).bold"
          );
        }
      });
    } else {
      log.warn(
        `⚠️ Remember to install dependencies manually. Run 'cd ${outDir} && npm install'`
      );
      log.custom(
        `🚀 Happy coding! To open in VS Code, type 'cd ${outDir} && code .'`,
        "rgb(194, 156, 247).bold"
      );
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
          "🔩 Official Template( np* create-* )",
          "⚡️ Our Built-in Template",
          "📂 Custom Structure",
        ],
      },
    ]);

    if (mode === "📂 Custom Structure") {
      await handleCustom();
    } else if (mode === "⚡️ Our Built-in Template") {
      await handleTemplate();
    } else if (mode === "🔩 Official Template( np* create-* )") {
      await handleOfficial();
    }
  } catch (error) {
    log.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
  return;
}

// Helper: run official commands
/**
 * Runs a command with arguments in a given directory.
 * @param {string} cmd - The command to run.
 * @param {string[]} args - The command arguments.
 * @param {string} cwd - The working directory to run the command in.
 * @returns {Promise<void>} - Resolves when the command completes successfully, rejects on error.
 */
function runCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", cwd, shell: true }); // need to research more on this
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} failed`))
    );
  });
}

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
        // "Express",
        "Fastify",
        "Nest.js",
      ],
    },
  ]);

  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter project name:",
      validate: (val) => (val ? true : "Project name is required"),
    },
  ]);

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
    }
    // else if (framework === "Express") {
    //   await runCommand("npx", ["express-generator", projectName], process.cwd());
    // }
    else if (framework === "Fastify") {
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
    log.custom(
      `🚀 Happy coding! To open in VS Code, type 'cd ${projectName} && code .'`,
      "rgb(194, 156, 247).bold"
    );
  } catch (err) {
    log.error(`❌ Failed to create ${framework} project: ${err.message}`);
    process.exit(1);
  }
  // log.info(`🚀 Happy coding! To open in VS Code, type 'cd ${projectName} && code .'`);
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

/**
 * Flow for built-in templates (refactored with categories).
 */
async function handleTemplate() {
  const answers = {};

  // Step 1: Choose Category
  const { category } = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: "Choose a project category:",
      choices: ["Frontend", "Backend", "Fullstack", "Utility"],
    },
  ]);
  answers.category = category;

  let questions = [];
  if (category === "Frontend") {
    questions = [
      {
        type: "list",
        name: "framework",
        message: "Choose a framework:",
        choices: ["React", "Next.js", "Vue"],
      },
    ];
  } else if (category === "Backend") {
    questions = [
      {
        type: "list",
        name: "framework",
        message: "Choose a framework:",
        choices: ["Express.js", "Fastify", "NestJS"],
      },
    ];
  } else if (category === "Fullstack") {
    log.warn("⚠️ Fullstack templates are coming soon!");
    return;
  } else if (category === "Utility") {
    log.warn("⚠️ Utility templates are coming soon!");
    return;
  } else {
    log.warn("⚠️ This category is not implemented yet. Coming soon!");
    return;
  }

  const frameworkAnswer = await inquirer.prompt(questions);
  Object.assign(answers, frameworkAnswer);

  if (answers.framework === "React") {
    const reactAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "variant",
        message: "Choose a React variant:",
        choices: ["Vite"],
      },
      {
        type: "list",
        name: "language",
        message: "Choose a language:",
        choices: ["JavaScript", "TypeScript"],
      },
    ]);
    Object.assign(answers, reactAnswers);
  } else if (answers.framework === "Next.js") {
    const nextAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Choose a language:",
        choices: ["JavaScript", "TypeScript"],
      },
      {
        type: "list",
        name: "router",
        message: "Choose a Next.js router:",
        choices: ["App Router", "Pages Router"],
      },
    ]);
    Object.assign(answers, nextAnswers);
  } else if (answers.framework === "Express.js") {
    const expressAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "variant",
        message:
          "Choose a variant (Beginner's to Moderate Devs please choose 'Simple'):",
        choices: ["Mongoose (Advanced/Pro Devs)", "Simple"],
      },
      {
        type: "list",
        name: "language",
        message: "Choose a language:",
        choices: ["JavaScript", "TypeScript"],
      },
    ]);
    Object.assign(answers, expressAnswers);
  } else if (answers.framework === "NestJS") {
    const nestAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Choose a language:",
        choices: ["TypeScript"],
      },
    ]);
    Object.assign(answers, nestAnswers);
  } else if (answers.framework === "Fastify") {
    const fastifyAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Choose a language:",
        choices: ["JavaScript", "TypeScript"],
      },
    ]);
    Object.assign(answers, fastifyAnswers);
  } else {
    log.warn(`⚠️ Template for ${answers.framework} is not implemented yet.`);
    return;
  }

  // Step 3: Ask for project name, output directory
  const { projectName, outputBase } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter project name:",
      validate: (val) => (val ? true : "Project name is required"),
    },
    {
      type: "input",
      name: "outputBase",
      message:
        "Enter output directory (leave empty to create a new folder with the project name):",
    },
  ]);
  answers.projectName = projectName;
  answers.outputBase = outputBase;

  const outDir = answers.outputBase.trim()
    ? cleanPath(answers.outputBase)
    : path.join(process.cwd(), answers.projectName);

  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    log.error(dirValidation.error);
    process.exit(1);
  }

  // Step 4: Construct the template key and get the boilerplate
  let templateKey = "";
  if (answers.framework === "React") {
    templateKey = `react-${answers.variant.toLowerCase()}-${
      answers.language.toLowerCase().startsWith("type") ? "ts" : "js"
    }`;
  } else if (answers.framework === "Next.js") {
    templateKey = `next-js-${answers.router.split(" ")[0].toLowerCase()}-${
      answers.language.toLowerCase().startsWith("type") ? "ts" : "js"
    }`;
  } else if (answers.framework === "Express.js") {
    templateKey = `express-${answers.variant.split(" ")[0].toLowerCase()}-${
      answers.language.toLowerCase().startsWith("type") ? "ts" : "js"
    }`;
  } else if (answers.framework === "NestJS") {
    templateKey = `nestjs-${
      answers.language.toLowerCase().startsWith("type") ? "ts" : "js"
    }`;
  } else if (answers.framework === "Fastify") {
    templateKey = `fastify-${
      answers.language.toLowerCase().startsWith("type") ? "ts" : "js"
    }`;
  }

  try {
    // Step 5: Create project
    instantiateTemplate(templateKey, outDir, { projectName: answers.projectName });
    log.success(`✅ Project created successfully at: ${outDir}`);

    const generatedPkgPath = path.join(outDir, "package.json");
    if (fs.existsSync(generatedPkgPath)) {
      await maybeInstallDependencies(outDir, fs.readFileSync(generatedPkgPath, "utf-8"));
    }
  } catch (error) {
    log.error(`❌ Error creating project: ${error.message}`);
    process.exit(1);
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
