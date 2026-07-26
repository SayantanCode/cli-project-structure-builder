import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import url from "node:url";
import { renderTemplate } from "../lib/templateEngine.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures", "templates");

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

test("renderTemplate substitutes {{projectName}} in text files", () => {
  const srcDir = path.join(FIXTURES_DIR, "fixture-basic", "files");
  const outDir = path.join(makeTmpDir(), "out");

  renderTemplate(srcDir, outDir, { projectName: "my-cool-app" });

  const pkg = JSON.parse(fs.readFileSync(path.join(outDir, "package.json"), "utf-8"));
  assert.equal(pkg.name, "my-cool-app");

  const readme = fs.readFileSync(path.join(outDir, "README.md"), "utf-8");
  assert.match(readme, /^# my-cool-app/);

  const indexJs = fs.readFileSync(path.join(outDir, "src", "index.js"), "utf-8");
  assert.equal(indexJs.trim(), 'console.log("my-cool-app");');

  assert.equal(walkFiles(outDir).length, 3);
});

test("renderTemplate copies binary files verbatim, without treating them as text", () => {
  const srcDir = path.join(FIXTURES_DIR, "fixture-with-binary", "files");
  const outDir = path.join(makeTmpDir(), "out");

  renderTemplate(srcDir, outDir, { projectName: "acme-app" });

  const srcBuf = fs.readFileSync(path.join(srcDir, "assets", "icon.ico"));
  const outBuf = fs.readFileSync(path.join(outDir, "assets", "icon.ico"));

  // Byte-for-byte identical — including the literal "{{projectName}}" bytes
  // embedded in the fixture, which must NOT be substituted since it's binary.
  assert.ok(srcBuf.equals(outBuf), "binary file should be copied byte-for-byte");
});

test("renderTemplate throws when the source directory doesn't exist", () => {
  const outDir = path.join(makeTmpDir(), "out");
  assert.throws(() =>
    renderTemplate(path.join(FIXTURES_DIR, "does-not-exist"), outDir, { projectName: "x" })
  );
});
