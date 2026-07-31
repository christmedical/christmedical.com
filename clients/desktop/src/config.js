"use strict";

/** Default production portal — same target as the iOS/Android WebView shells. */
const DEFAULT_PORTAL_URL = "https://login.christmedical.com/";

/**
 * Resolve the portal URL from (in order):
 * 1. CHRISTMEDICAL_PORTAL_URL env
 * 2. PORTAL_URL env (shorthand)
 * 3. Default production login URL
 *
 * No hub discovery here — override the env when pointing at a local hub later.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {string}
 */
function resolvePortalUrl(env = process.env) {
  const raw = (env.CHRISTMEDICAL_PORTAL_URL || env.PORTAL_URL || DEFAULT_PORTAL_URL).trim();
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error(`unsupported protocol: ${url.protocol}`);
    }
    return url.toString();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid portal URL "${raw}": ${reason}`);
  }
}

/**
 * Returns true when `url` may stay in the BrowserWindow.
 * Always allows `*.christmedical.com`. Also allows the configured portal host
 * so a local-hub override (e.g. http://127.0.0.1:3000) stays in-app.
 *
 * @param {string} urlString
 * @param {string} [portalUrlString] resolved portal URL (defaults to production)
 * @returns {boolean}
 */
function isAllowedNavigation(urlString, portalUrlString = DEFAULT_PORTAL_URL) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (host === "login.christmedical.com" || host.endsWith(".christmedical.com")) {
    return true;
  }

  try {
    const portal = new URL(portalUrlString);
    return host === portal.hostname.toLowerCase() && url.protocol === portal.protocol;
  } catch {
    return false;
  }
}

module.exports = {
  DEFAULT_PORTAL_URL,
  resolvePortalUrl,
  isAllowedNavigation,
};
