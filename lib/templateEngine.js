import fs from "fs";
import os from "os";
import path from "path";
import degit from "degit";
import { describeGitHubFetchFailure } from "./githubDiagnostics.js";

const TEMPLATES_REPO = "SayantanCode/create-structure-templates";
const INDEX_URL = `https://raw.githubusercontent.com/${TEMPLATES_REPO}/main/index.json`;

const BINARY_EXTENSIONS = new Set([
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".bmp",
]);

/**
 * Fetches the template registry index (one manifest per built-in template)
 * from the create-structure-templates repo. Throws a clear error if the
 * registry can't be reached.
 */
export async function fetchTemplateIndex() {
  let response;
  try {
    response = await fetch(INDEX_URL);
  } catch (error) {
    throw new Error(
      `Could not reach the template registry — check your internet connection. (${error.message})`
    );
  }
  if (!response.ok) {
    throw new Error(
      `Could not reach the template registry (HTTP ${response.status}).`
    );
  }
  return response.json();
}

/**
 * Downloads a single template's files/ tree from the templates repo into a
 * fresh temp directory and returns its path. Caller is responsible for
 * cleaning it up.
 */
export async function fetchTemplateSource(templateKey) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `create-structure-${templateKey}-`)
  );
  const emitter = degit(`${TEMPLATES_REPO}/templates/${templateKey}/files`, {
    cache: false,
    force: true,
  });

  try {
    await emitter.clone(tempDir);
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(
      `Template not found: ${templateKey} (${await describeGitHubFetchFailure(error.message)})`
    );
  }

  return tempDir;
}

function applyPlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

function copyDir(srcDir, destDir, vars) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, vars);
    } else if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      fs.copyFileSync(srcPath, destPath);
    } else {
      const content = fs.readFileSync(srcPath, "utf-8");
      fs.writeFileSync(destPath, applyPlaceholders(content, vars), "utf-8");
    }
  }
}

/**
 * Renders an already-downloaded template source tree into outDir,
 * substituting `{{key}}` placeholders in text files with the given vars
 * (binary files are copied verbatim). Pure/offline — no network involved.
 */
export function renderTemplate(srcDir, outDir, vars) {
  copyDir(srcDir, outDir, vars);
}

/**
 * Fetches and instantiates a built-in template into outDir in one step.
 * Throws if the template key doesn't exist in the registry.
 */
export async function instantiateTemplate(templateKey, outDir, vars) {
  const srcDir = await fetchTemplateSource(templateKey);
  try {
    renderTemplate(srcDir, outDir, vars);
  } finally {
    fs.rmSync(srcDir, { recursive: true, force: true });
  }
}
