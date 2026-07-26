import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.join(__dirname, "..", "templates");

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
 * Reads a template's manifest (template.json). Returns null if the template
 * doesn't exist or has no manifest.
 */
export function getTemplateManifest(templateKey) {
  const manifestPath = path.join(TEMPLATES_ROOT, templateKey, "template.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

/**
 * Lists all available template keys (directories under templates/ that have
 * a files/ subdirectory).
 */
export function listTemplateKeys() {
  return fs
    .readdirSync(TEMPLATES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((key) => fs.existsSync(path.join(TEMPLATES_ROOT, key, "files")));
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
 * Instantiates a built-in template into outDir, substituting `{{key}}`
 * placeholders in text files with the given vars (binary files are copied
 * verbatim). Throws if the template key doesn't exist.
 */
export function instantiateTemplate(templateKey, outDir, vars) {
  const filesDir = path.join(TEMPLATES_ROOT, templateKey, "files");
  if (!fs.existsSync(filesDir)) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  copyDir(filesDir, outDir, vars);
}
