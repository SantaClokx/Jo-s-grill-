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
 * Clerk's Frontend API proxy path.
 *
 * Clerk's own auto-proxy uses `/__clerk` on `*.vercel.app` hosts, and the
 * browser bundle is referenced as `/__clerk/npm/...`. Keep the two in step.
 */
export const CLERK_PROXY_PATH = "/__clerk";

/**
 * Environment variable that pins the proxy path for the client bundle.
 *
 * The server derives its proxy URL from the request host, but the client has no
 * host to derive it from during a static prerender. Without this variable the
 * prerendered HTML carries no `data-clerk-proxy-url`, and the widget then falls
 * back to resolving the UI bundle against the publishable key's Frontend API
 * domain - which 404s.
 */
export const CLERK_PROXY_URL_ENV = "NEXT_PUBLIC_CLERK_PROXY_URL";

/** Whether a publishable key belongs to a production (live) Clerk instance. */
export function isProductionPublishableKey(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().startsWith("pk_live_");
}

/**
 * The proxy URL to hand to Clerk's client bundle.
 *
 * An explicit `NEXT_PUBLIC_CLERK_PROXY_URL` always wins, so an operator can
 * point the bundle elsewhere without a code change.
 *
 * Otherwise a live publishable key defaults to the same-origin proxy path. This
 * default is what makes the widget work: Clerk's own auto-proxy resolves its
 * path from `VERCEL_TARGET_ENV`, which is a server-only variable. During a
 * static prerender the server therefore emits `data-clerk-proxy-url="/__clerk"`
 * into the HTML, but the client hydration recomputes the value, finds no
 * `VERCEL_TARGET_ENV`, and falls back to the publishable key's Frontend API
 * domain. That domain (clerk.jos-grill.vercel.app) does not resolve, so the UI
 * bundle fails with `failed_to_load_clerk_ui` and the widget never mounts.
 *
 * Dev keys are left alone: they point at a reachable development instance, and
 * localhost is not a host Clerk will proxy for.
 */
export function resolveClerkProxyUrl(env: Record<string, string | undefined>): string | undefined {
  const configured = env[CLERK_PROXY_URL_ENV]?.trim();
  if (configured) {
    return configured;
  }
  return isProductionPublishableKey(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
    ? CLERK_PROXY_PATH
    : undefined;
}

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
