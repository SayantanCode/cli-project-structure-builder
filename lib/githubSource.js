import fs from "fs";
import path from "path";

const GITHUB_API = "https://api.github.com";

/**
 * Parses a GitHub repo URL into its parts. Accepts the repo root
 * (`github.com/owner/repo`) or a `/tree/<branch>/<subpath>` URL, with or
 * without a scheme/`www.`/`.git` suffix. Branch names containing `/` aren't
 * supported — the first path segment after `tree/` is always treated as the
 * branch, same simplification GitHub's own raw-content URLs make.
 */
export function parseGitHubUrl(input) {
  const cleaned = input.trim().replace(/\.git$/, "");
  const match = cleaned.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+)(?:\/(?:tree|blob)\/([^/\s]+)((?:\/[^\s]*)?))?\/?$/
  );
  if (!match) return null;
  const [, owner, repo, branch, subpathRaw] = match;
  const subpath = subpathRaw ? subpathRaw.replace(/^\/+/, "").replace(/\/+$/, "") : "";
  return { owner, repo, branch: branch || null, subpath };
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function githubError(res, ref, hasToken) {
  if (res.status === 401) {
    return new Error(
      `GitHub rejected the GITHUB_TOKEN/GH_TOKEN for ${ref} (HTTP 401) — it's invalid, expired, or revoked.`
    );
  }
  if (res.status === 404) {
    return new Error(
      hasToken
        ? `Could not find ${ref} on GitHub — check the URL and branch name, and that your token has access to this repo.`
        : `Could not find ${ref} on GitHub — check the URL, branch name, and that the repo is public. If it's private, set a GITHUB_TOKEN or GH_TOKEN environment variable.`
    );
  }
  if (res.status === 403 || res.status === 429) {
    return new Error(
      hasToken
        ? `GitHub API request for ${ref} was rejected (HTTP ${res.status}) even with a token set — check the token has access to this repo, or that its rate limit isn't exhausted.`
        : `GitHub API rate limit reached while fetching ${ref}. Unauthenticated requests are limited to 60/hour — set a GITHUB_TOKEN or GH_TOKEN environment variable to raise that to 5,000/hour, or wait a while and try again.`
    );
  }
  return new Error(`GitHub API request for ${ref} failed (HTTP ${res.status}).`);
}

async function resolveDefaultBranch(owner, repo, token) {
  let res;
  try {
    res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: authHeaders(token) });
  } catch (error) {
    throw new Error(`Could not reach GitHub — check your internet connection. (${error.message})`);
  }
  if (!res.ok) throw githubError(res, `${owner}/${repo}`, Boolean(token));
  const data = await res.json();
  return data.default_branch;
}

/**
 * Fetches the full recursive file/folder tree for a repo (or a subpath
 * within it) in a single API call. Entry paths are returned relative to
 * `subpath` (or the repo root, if none was given).
 */
export async function fetchGitHubTree({ owner, repo, branch, subpath, token }) {
  const resolvedBranch = branch || (await resolveDefaultBranch(owner, repo, token));

  let res;
  try {
    res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(resolvedBranch)}?recursive=1`,
      { headers: authHeaders(token) }
    );
  } catch (error) {
    throw new Error(`Could not reach GitHub — check your internet connection. (${error.message})`);
  }
  if (!res.ok) throw githubError(res, `${owner}/${repo}@${resolvedBranch}`, Boolean(token));
  const data = await res.json();

  let entries = data.tree.filter((item) => item.type === "blob" || item.type === "tree");

  if (subpath) {
    const prefix = `${subpath}/`;
    entries = entries
      .filter((item) => item.path === subpath || item.path.startsWith(prefix))
      .map((item) => ({
        ...item,
        path: item.path === subpath ? "" : item.path.slice(prefix.length),
      }))
      .filter((item) => item.path !== "");

    if (entries.length === 0) {
      throw new Error(`No files found under "${subpath}" in ${owner}/${repo}@${resolvedBranch}.`);
    }
  }

  return { branch: resolvedBranch, truncated: Boolean(data.truncated), entries };
}

/**
 * Writes a fetched tree to disk. In structure-only mode every blob becomes
 * an empty file; otherwise real content is fetched from
 * raw.githubusercontent.com (not the rate-limited REST API — that only
 * matters for the one tree-listing call above) with limited concurrency.
 * Files that fail to fetch fall back to empty rather than aborting the
 * whole run, so partial network trouble doesn't cost you the rest of the
 * structure.
 */
export async function writeGitHubStructure({
  owner,
  repo,
  branch,
  entries,
  outDir,
  includeContents,
  token,
}) {
  for (const entry of entries) {
    if (entry.type === "tree") {
      fs.mkdirSync(path.join(outDir, ...entry.path.split("/")), { recursive: true });
    }
  }

  const files = entries.filter((entry) => entry.type === "blob");

  if (!includeContents) {
    for (const entry of files) {
      const fullPath = path.join(outDir, ...entry.path.split("/"));
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, "");
    }
    return { fileCount: files.length, failures: 0 };
  }

  const CONCURRENCY = 8;
  let cursor = 0;
  let failures = 0;

  async function worker() {
    while (cursor < files.length) {
      const entry = files[cursor++];
      const fullPath = path.join(outDir, ...entry.path.split("/"));
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${entry.path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

      try {
        const res = await fetch(rawUrl, { headers: authHeaders(token) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fs.writeFileSync(fullPath, Buffer.from(await res.arrayBuffer()));
      } catch {
        failures++;
        fs.writeFileSync(fullPath, "");
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker));
  return { fileCount: files.length, failures };
}
