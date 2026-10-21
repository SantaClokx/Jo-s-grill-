/**
 * Guards the middleware matcher declared in `src/proxy.ts`.
 *
 * Next.js requires `config.matcher` to be a statically analysable array literal,
 * so it cannot be imported from here. These helpers let a test load the real
 * `proxy.ts` module and assert its patterns directly, which keeps the test and
 * the production matcher from drifting apart.
 *
 * Why this matters: Clerk's Frontend API proxy serves Clerk's browser bundles
 * from `/__clerk/npm/.../ *.js`. The generic "skip static files" matcher pattern
 * excludes every `.js` path, so without an explicit `/__clerk/(.*)` entry the
 * proxy never sees those requests, the bundle 404s, and the sign-in widget
 * silently fails to mount - the page renders its heading and nothing else.
 */
export const CLERK_PROXY_MATCHER_PATTERN = "/__clerk/(.*)";

/**
 * Test helper mirroring how Next.js applies `config.matcher` entries as regexes.
 */
export function matchesMatcher(pathname: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => new RegExp(`^${pattern}$`).test(pathname));
}

/**
 * Assert the matcher keeps Clerk's proxied bundles and API reachable. Clerk's
 * bundle URL carries a `.js` extension, so this is exactly the case the generic
 * static-file exclusion would otherwise drop.
 */
export function routesClerkProxyRequests(patterns: readonly string[]): boolean {
  return (
    matchesMatcher("/__clerk/npm/@clerk/clerk-js@6/dist/clerk.browser.js", patterns) &&
    matchesMatcher("/__clerk/npm/@clerk/ui@1/dist/ui.browser.js", patterns) &&
    matchesMatcher("/__clerk/v1/environment", patterns)
  );
}
