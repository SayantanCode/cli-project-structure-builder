const RATE_LIMIT_URL = "https://api.github.com/rate_limit";

/**
 * Degit (and raw fetches against GitHub) surface a rate-limited request the
 * same way they'd surface a genuinely missing ref/commit — "could not find
 * commit hash for X" either way — so users can't tell "you typed the wrong
 * branch" from "you're rate-limited" from the error alone. This checks
 * GitHub's actual rate-limit status (checking it is itself exempt from the
 * limit) and, if that's really what happened, replaces the confusing
 * message with a clear one. Falls back to the original message for
 * everything else, including if this check itself fails.
 */
export async function describeGitHubFetchFailure(originalMessage) {
  try {
    const res = await fetch(RATE_LIMIT_URL);
    if (!res.ok) return originalMessage;

    const data = await res.json();
    const core = data.resources?.core;
    if (!core || core.remaining > 0) return originalMessage;

    const resetDate = new Date(core.reset * 1000);
    const waitMinutes = Math.max(1, Math.ceil((resetDate.getTime() - Date.now()) / 60000));
    return (
      `GitHub's unauthenticated API rate limit (60 requests/hour) was reached — resets in about ` +
      `${waitMinutes} minute(s), around ${resetDate.toLocaleTimeString()}. Wait and try again. (${originalMessage})`
    );
  } catch {
    return originalMessage;
  }
}
