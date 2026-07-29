import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGitHubUrl } from "../lib/githubSource.js";

test("parseGitHubUrl parses a bare repo URL", () => {
  assert.deepEqual(parseGitHubUrl("https://github.com/octocat/Hello-World"), {
    owner: "octocat",
    repo: "Hello-World",
    branch: null,
    subpath: "",
  });
});

test("parseGitHubUrl accepts a trailing slash, .git suffix, no scheme, and www.", () => {
  const expected = {
    owner: "octocat",
    repo: "Hello-World",
    branch: null,
    subpath: "",
  };
  assert.deepEqual(parseGitHubUrl("https://github.com/octocat/Hello-World/"), expected);
  assert.deepEqual(parseGitHubUrl("https://github.com/octocat/Hello-World.git"), expected);
  assert.deepEqual(parseGitHubUrl("github.com/octocat/Hello-World"), expected);
  assert.deepEqual(parseGitHubUrl("http://www.github.com/octocat/Hello-World"), expected);
});

test("parseGitHubUrl parses a branch with no subpath", () => {
  assert.deepEqual(parseGitHubUrl("https://github.com/octocat/Hello-World/tree/master"), {
    owner: "octocat",
    repo: "Hello-World",
    branch: "master",
    subpath: "",
  });
});

test("parseGitHubUrl parses a branch with a nested subpath", () => {
  assert.deepEqual(
    parseGitHubUrl("https://github.com/facebook/react/tree/main/packages/react-dom"),
    {
      owner: "facebook",
      repo: "react",
      branch: "main",
      subpath: "packages/react-dom",
    }
  );
});

test("parseGitHubUrl returns null for non-GitHub or malformed URLs", () => {
  assert.equal(parseGitHubUrl("not a url at all"), null);
  assert.equal(parseGitHubUrl("https://gitlab.com/owner/repo"), null);
});
