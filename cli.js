#!/usr/bin/env node
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import reactViteJsBoilerplate from "./templates/reactViteJsBoilerplate.js";
import reactViteTsBoilerplate from "./templates/reactViteTsBoilerplate.js";
import nextJsPagesRouterBoilerplate from "./templates/nextJsPageRouterBoilerplate.js";
import nextJsAppRouterBoilerplate from "./templates/nextJsAppRouterBoilerplate.js";
import nextJsTsPageRouterBoilerplate from "./templates/nextJsTsPageRouter.js";
import nextJsTsAppRouterBoilerplate from "./templates/nextJsTsAppRouterBoilerplate.js";
import expressMongooseJsBoilerplate from "./templates/expressMongooseJsBoilerplate.js";
import expressMongooseTsBoilerplate from "./templates/expressMongooseTsBoilerplate.js";
// import expressJsBoilerplate from "./templates/expressJsBoilerplate.js";
// import fastifyBoilerplate from "./templates/fastifyBoilerplate.js";
// import nestJsBoilerplate from "./templates/nestJsBoilerplate.js";

/**
 * Maping template keys to their corresponding boilerplate functions.
 * New templates can be added here as needed.
 */
const TEMPLATES_MAP = {
  "react-vite-js": reactViteJsBoilerplate,
  "react-vite-ts": reactViteTsBoilerplate,
  "next-js-app-ts": nextJsTsAppRouterBoilerplate,
  "next-js-app-js": nextJsAppRouterBoilerplate,
  "next-js-pages-ts": nextJsTsPageRouterBoilerplate,
  "next-js-pages-js": nextJsPagesRouterBoilerplate,
  "express-mongoose-js": expressMongooseJsBoilerplate,
  "express-mongoose-ts": expressMongooseTsBoilerplate,
  // "express-js": expressJsBoilerplate,
  // "fastify-js": fastifyBoilerplate,
  // "nestjs-ts": nestJsBoilerplate,
};

/**
 * Returns the boilerplate object for a given template key and project name.
 */
function getBoilerplate(templateKey, projectName) {
  const boilerplateFunc = TEMPLATES_MAP[templateKey];
  if (!boilerplateFunc) {
    throw new Error(`Template not found for key: ${templateKey}`);
  }
  return boilerplateFunc(projectName);
}

/**
 * Cleans a file path by removing surrounding quotes and resolving it to an absolute path.
 */
function cleanPath(inputPath) {
  let cleanedPath = inputPath.trim().replace(/^["']|["']$/g, "");
  return path.isAbsolute(cleanedPath) ?
    cleanedPath :
    path.resolve(process.cwd(), cleanedPath);
}

/**
 * Validates a file path.
 */
function validateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: `❌ File not found: ${filePath}`
      };
    }
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return {
        valid: false,
        error: `❌ Path is not a file: ${filePath}`
      };
    }
    return {
      valid: true
    };
  } catch (error) {
    return {
      valid: false,
      error: `❌ Error accessing file: ${error.message}`
    };
  }
}

/**
 * Validates a directory path.
 */
function validateDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`📂 Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, {
        recursive: true
      });
      return {
        valid: true
      };
    }
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        error: `❌ Path is not a directory: ${dirPath}`
      };
    }
    fs.accessSync(dirPath, fs.constants.W_OK);
    return {
      valid: true
    };
  } catch (error) {
    return {
      valid: false,
      error: `❌ Cannot write to directory: ${error.message}`
    };
  }
}

/**
 * Main entry point with Inquirer flow.
 */
async function main() {
  try {
    const {
      mode
    } = await inquirer.prompt([{
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: ["📂 Custom Structure", "⚡ Built-in Template"],
    }, ]);

    if (mode === "📂 Custom Structure") {
      await handleCustom();
    } else {
      await handleTemplate();
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

/**
 * Flow for custom structure (your current logic).
 */
async function handleCustom() {
  const {
    inputFilePath
  } = await inquirer.prompt([{
    type: "input",
    name: "inputFilePath",
    message: "Enter path (with extension) of your tree structure file:",
  }, ]);

  const filePath = cleanPath(inputFilePath);
  const fileValidation = validateFile(filePath);

  if (!fileValidation.valid) {
    console.error(fileValidation.error);
    process.exit(1);
  }

  const {
    outputBase
  } = await inquirer.prompt([{
    type: "input",
    name: "outputBase",
    message: "Enter output directory (leave empty for current directory):",
  }, ]);

  const outDir = outputBase.trim() ? cleanPath(outputBase) : process.cwd();
  const dirValidation = validateDirectory(outDir);

  if (!dirValidation.valid) {
    console.error(dirValidation.error);
    process.exit(1);
  }

  await processStructure(filePath, outDir);
  console.log("✅ Structure created successfully at:", outDir);
}

/**
 * Flow for built-in templates (refactored with categories).
 */
async function handleTemplate() {
  const answers = {};

  // Step 1: Choose Category
  const {
    category
  } = await inquirer.prompt([{
    type: "list",
    name: "category",
    message: "Choose a project category:",
    choices: ["Frontend", "Backend", "Fullstack", "Utility"],
  }, ]);
  answers.category = category;

  let questions = [];

  if (category === "Frontend") {
    questions = [{
      type: "list",
      name: "framework",
      message: "Choose a framework:",
      choices: ["React", "Next.js", "Vue"],
    }, ];
  } else if (category === "Backend") {
    questions = [{
      type: "list",
      name: "framework",
      message: "Choose a framework:",
      choices: ["Express.js", "Fastify", "NestJS"],
    }, ];
  } else if (category === "Fullstack") {
    console.log("⚠️ Fullstack templates are coming soon!");
    return;
  } else if (category === "Utility") {
    console.log("⚠️ Utility templates are coming soon!");
    return;
  } else {
    console.log("⚠️ This category is not implemented yet. Coming soon!");
    return;
  }

  const frameworkAnswer = await inquirer.prompt(questions);
  Object.assign(answers, frameworkAnswer);

  if (answers.framework === "React") {
    const reactAnswers = await inquirer.prompt([{
      type: "list",
      name: "variant",
      message: "Choose a React variant:",
      choices: ["Vite"],
    }, {
      type: "list",
      name: "language",
      message: "Choose a language:",
      choices: ["JavaScript", "TypeScript"],
    }, ]);
    Object.assign(answers, reactAnswers);
  } else if (answers.framework === "Next.js") {
    const nextAnswers = await inquirer.prompt([{
      type: "list",
      name: "language",
      message: "Choose a language:",
      choices: ["JavaScript", "TypeScript"],
    }, {
      type: "list",
      name: "router",
      message: "Choose a Next.js router:",
      choices: ["App Router", "Pages Router"],
    }, ]);
    Object.assign(answers, nextAnswers);
  } else if (answers.framework === "Express.js") {
    const expressAnswers = await inquirer.prompt([{
      type: "list",
      name: "variant",
      message: "Choose a variant (Beginner's to Moderate Devs please choose 'Simple'):",
      choices: ["Mongoose (Advanced/Pro Devs)", "Simple"],
    }, {
      type: "list",
      name: "language",
      message: "Choose a language:",
      choices: ["JavaScript", "TypeScript"],
    }, ]);
    Object.assign(answers, expressAnswers);
  } else if (answers.framework === "NestJS") {
    const nestAnswers = await inquirer.prompt([{
      type: "list",
      name: "language",
      message: "Choose a language:",
      choices: ["TypeScript"],
    }, ]);
    Object.assign(answers, nestAnswers);
  } else if (answers.framework === "Fastify") {
    const fastifyAnswers = await inquirer.prompt([{
      type: "list",
      name: "language",
      message: "Choose a language:",
      choices: ["JavaScript", "TypeScript"],
    }, ]);
    Object.assign(answers, fastifyAnswers);
  } else {
    console.log(`⚠️ Template for ${answers.framework} is not implemented yet.`);
    return;
  }

  // Step 3: Ask for project metadata
  const {
    projectName,
    outputBase
  } = await inquirer.prompt([{
    type: "input",
    name: "projectName",
    message: "Enter project name:",
    validate: (val) => (val ? true : "Project name is required"),
  }, {
    type: "input",
    name: "outputBase",
    message: "Enter output directory (leave empty to create a new folder with the project name):",
  }, ]);
  answers.projectName = projectName;
  answers.outputBase = outputBase;

  const outDir = answers.outputBase.trim() ?
    cleanPath(answers.outputBase) :
    path.join(process.cwd(), answers.projectName);

  const dirValidation = validateDirectory(outDir);
  if (!dirValidation.valid) {
    console.error(dirValidation.error);
    process.exit(1);
  }

  // Step 4: Construct the template key and get the boilerplate
  let templateKey = "";
  if (answers.framework === "React") {
    templateKey = `react-${answers.variant.toLowerCase()}-${answers.language.toLowerCase().startsWith("Type") ? "ts" : "js"}`;
  } else if (answers.framework === "Next.js") {
    templateKey = `next-js-${answers.router.split(" ")[0].toLowerCase()}-${answers.language.toLowerCase().startsWith("Type") ? "ts" : "js"}`;
  } else if (answers.framework === "Express.js") {
    templateKey = `express-${answers.variant.split(" ")[0].toLowerCase()}-${answers.language.toLowerCase().startsWith("Type") ? "ts" : "js"}`;
    console.log(templateKey);
  } else if (answers.framework === "NestJS") {
    templateKey = `nestjs-${answers.language.toLowerCase().startsWith("Type") ? "ts" : "js"}`;
  } else if (answers.framework === "Fastify") {
    templateKey = `fastify-${answers.language.toLowerCase().startsWith("Type") ? "ts" : "js"}`;
  }

  try {
    const boilerplate = getBoilerplate(templateKey, answers.projectName);
    // Step 5: Create project
    createFromJson(boilerplate, outDir);
    console.log("✅ Project created successfully at:", outDir);
  } catch (error) {
    console.error("❌ Error creating project:", error.message);
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
      console.error("❌ File is empty:", filePath);
      process.exit(1);
    }

    if (filePath.endsWith(".json") || content.startsWith("{")) {
      try {
        const jsonData = JSON.parse(content);
        createFromJson(jsonData, outputBase);
      } catch (error) {
        console.error("❌ Invalid JSON format:", error.message);
        process.exit(1);
      }
    } else {
      createFromText(content.split("\n"), outputBase);
    }
  } catch (error) {
    console.error("❌ Error processing structure:", error.message);
    process.exit(1);
  }
}

/**
 * Create files/folders from JSON.
 */
function createFromJson(structure, basePath) {
  for (const name in structure) {
    try {
      const fullPath = path.join(basePath, name);
      if (typeof structure[name] === "string") {
        fs.mkdirSync(path.dirname(fullPath), {
          recursive: true
        });
        fs.writeFileSync(fullPath, structure[name]);
      } else {
        fs.mkdirSync(fullPath, {
          recursive: true
        });
        createFromJson(structure[name], fullPath);
      }
    } catch (error) {
      console.error(`❌ Error creating ${name}:`, error.message);
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
      console.error("❌ No valid content found in the structure file");
      process.exit(1);
    }

    let stack = [{
      depth: -1,
      dir: basePath
    }];
    const firstLine = lines[0].trim();

    if (firstLine.endsWith("/")) {
      const rootFolderName = firstLine.replace(/[├└│─ ]/g, "").replace(/\/$/, "");
      const rootPath = path.join(basePath, rootFolderName);
      fs.mkdirSync(rootPath, {
        recursive: true
      });
      stack = [{
        depth: -1,
        dir: rootPath
      }];
      lines = lines.slice(1);
    }

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try {
        const cleanedLine = line.replace(/[├└│]/g, "");
        const depth = cleanedLine.search(/\S/);
        const name = cleanedLine.trim().replace(/─ /, "");

        if (!name) {
          console.warn(`⚠️ Warning: Empty name at line ${index + 1}, skipping`);
          return;
        }

        const isDir = name.endsWith("/");

        while (stack.length && stack[stack.length - 1].depth >= depth) {
          stack.pop();
        }

        if (stack.length === 0) {
          console.error(`❌ Invalid structure at line ${index + 1}: No parent directory`);
          process.exit(1);
        }

        const parentDir = stack[stack.length - 1].dir;
        const targetPath = path.join(parentDir, name.replace(/\/$/, ""));

        if (isDir) {
          fs.mkdirSync(targetPath, {
            recursive: true
          });
          stack.push({
            depth,
            dir: targetPath
          });
        } else {
          fs.mkdirSync(path.dirname(targetPath), {
            recursive: true
          });
          fs.writeFileSync(targetPath, "");
        }
      } catch (error) {
        console.error(`❌ Error processing line ${index + 1}: "${line}":`, error.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Error creating text structure:", error.message);
    process.exit(1);
  }
}

// Start the application
main();