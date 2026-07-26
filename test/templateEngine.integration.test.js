// Hits the live create-structure-templates GitHub repo over the network.
// Skipped by default so `npm test` stays fast/offline-safe; run explicitly
// with `RUN_NETWORK_TESTS=1 npm test` to exercise the real registry.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fetchTemplateIndex, instantiateTemplate } from "../lib/templateEngine.js";

const skip = process.env.RUN_NETWORK_TESTS !== "1";

test("fetchTemplateIndex returns the live registry", { skip }, async () => {
  const index = await fetchTemplateIndex();
  assert.ok(Array.isArray(index));
  assert.ok(index.length > 0);
  for (const manifest of index) {
    for (const field of ["key", "name", "description", "category", "framework", "language"]) {
      assert.ok(manifest[field], `manifest missing "${field}": ${JSON.stringify(manifest)}`);
    }
  }
});

test("instantiateTemplate fetches and renders a real template end-to-end", { skip }, async () => {
  const outDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "template-integration-")), "out");
  await instantiateTemplate("react-vite-js", outDir, { projectName: "integration-test-app" });

  const pkg = JSON.parse(fs.readFileSync(path.join(outDir, "package.json"), "utf-8"));
  assert.equal(pkg.name, "integration-test-app");
});

test("instantiateTemplate throws a clear error for an unknown template key", { skip }, async () => {
  const outDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "template-integration-")), "out");
  await assert.rejects(() =>
    instantiateTemplate("does-not-exist", outDir, { projectName: "x" })
  );
});
