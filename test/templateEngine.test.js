import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import url from "node:url";
import {
  instantiateTemplate,
  listTemplateKeys,
  getTemplateManifest,
} from "../lib/templateEngine.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "template-engine-test-"));
}

function walkFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(full));
    else results.push(full);
  }
  return results;
}

const EXPECTED_KEYS = [
  "react-vite-js",
  "react-vite-ts",
  "next-js-app-js",
  "next-js-app-ts",
  "next-js-pages-js",
  "next-js-pages-ts",
  "express-mongoose-js",
  "express-mongoose-ts",
];

test("listTemplateKeys finds all 8 built-in templates", () => {
  const keys = listTemplateKeys().sort();
  assert.deepEqual(keys, [...EXPECTED_KEYS].sort());
});

test("every built-in template has a manifest with required fields", () => {
  for (const key of EXPECTED_KEYS) {
    const manifest = getTemplateManifest(key);
    assert.ok(manifest, `missing template.json for ${key}`);
    for (const field of ["name", "description", "category", "framework", "language"]) {
      assert.ok(manifest[field], `${key} manifest missing "${field}"`);
    }
  }
});

for (const key of EXPECTED_KEYS) {
  test(`instantiateTemplate("${key}") substitutes projectName and writes real files`, () => {
    const outDir = path.join(makeTmpDir(), "out");
    instantiateTemplate(key, outDir, { projectName: "my-cool-app" });

    const files = walkFiles(outDir);
    assert.ok(files.length > 0, "no files were written");

    const pkgPath = path.join(outDir, "package.json");
    assert.ok(fs.existsSync(pkgPath), "package.json missing");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert.equal(pkg.name, "my-cool-app");

    for (const file of files) {
      assert.notEqual(path.basename(file), "package-lock.json", `stale lockfile leaked into ${key}`);
    }
  });
}

test("no template leaks the raw {{projectName}} placeholder or [binary placeholder] text", () => {
  const BINARY_EXTENSIONS = new Set([".ico", ".png", ".jpg", ".jpeg", ".gif"]);
  for (const key of EXPECTED_KEYS) {
    const outDir = path.join(makeTmpDir(), "out");
    instantiateTemplate(key, outDir, { projectName: "acme-app" });

    for (const file of walkFiles(outDir)) {
      if (BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
      const content = fs.readFileSync(file, "utf-8");
      assert.doesNotMatch(content, /\{\{projectName\}\}/, `unsubstituted placeholder in ${file}`);
      assert.doesNotMatch(content, /\[binary placeholder\]/, `placeholder text leaked into ${file}`);
    }
  }
});

test("next-js templates' favicon.ico is written as a real binary file, not placeholder text", () => {
  for (const key of ["next-js-app-js", "next-js-app-ts", "next-js-pages-js"]) {
    const outDir = path.join(makeTmpDir(), "out");
    instantiateTemplate(key, outDir, { projectName: "acme-app" });

    const favicon = walkFiles(outDir).find((f) => path.basename(f) === "favicon.ico");
    assert.ok(favicon, `${key} should ship a favicon.ico`);

    const buf = fs.readFileSync(favicon);
    assert.ok(buf.length > 1000, `${key}'s favicon.ico looks like a placeholder (${buf.length} bytes)`);
    assert.notEqual(buf.toString("utf-8", 0, 20), "[binary placeholder]");
  }
});

test("instantiateTemplate throws a clear error for an unknown template key", () => {
  const outDir = path.join(makeTmpDir(), "out");
  assert.throws(
    () => instantiateTemplate("does-not-exist", outDir, { projectName: "x" }),
    /Template not found: does-not-exist/
  );
});
