import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, "..", "cli.js");

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], { encoding: "utf-8" });
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "create-structure-test-"));
}

test("creates files/folders from a JSON structure via argv fast path", () => {
  const tmp = makeTmpDir();
  const structureFile = path.join(tmp, "structure.json");
  const outDir = path.join(tmp, "out");
  fs.writeFileSync(
    structureFile,
    JSON.stringify({
      "demo-project": {
        "src": { "index.js": "console.log('hi');\n" },
        "README.md": "# demo\n",
      },
    })
  );

  const result = runCli([structureFile, outDir]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    fs.readFileSync(path.join(outDir, "demo-project", "src", "index.js"), "utf-8"),
    "console.log('hi');\n"
  );
  assert.equal(fs.existsSync(path.join(outDir, "demo-project", "README.md")), true);
});

test("creates files/folders from a tree-style text structure", () => {
  const tmp = makeTmpDir();
  const structureFile = path.join(tmp, "structure.txt");
  const outDir = path.join(tmp, "out");
  fs.writeFileSync(
    structureFile,
    [
      "demo-project/",
      "├── src/",
      "│   └── index.js",
      "└── README.md",
    ].join("\n")
  );

  const result = runCli([structureFile, outDir]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(outDir, "demo-project", "src", "index.js")), true);
  assert.equal(fs.existsSync(path.join(outDir, "demo-project", "README.md")), true);
});

test("exits non-zero with a clear error when the structure file is missing", () => {
  const tmp = makeTmpDir();
  const missingFile = path.join(tmp, "does-not-exist.json");

  const result = runCli([missingFile, path.join(tmp, "out")]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /File not found/);
});
