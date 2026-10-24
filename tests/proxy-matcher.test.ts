import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  CLERK_PROXY_MATCHER_PATTERN,
  CLERK_PROXY_PATH,
  CLERK_PROXY_URL_ENV,
  matchesMatcher,
  resolveClerkProxyUrl,
  routesClerkProxyRequests,
} from "../src/lib/auth/proxy-matcher.ts";

/**
 * The deployed sign-in page rendered its heading but never mounted Clerk's
 * widget. Clerk's Frontend API proxy serves its browser bundles from
 * `/__clerk/npm/.../ *.js`, and the generic "skip static files" matcher pattern
 * excludes every `.js` path - so the bundle 404'd.
 *
 * These tests read the real `src/proxy.ts` and assert its declared matcher, so
 * the guard cannot silently drift from the production configuration.
 */
function readDeclaredMatcher(): string[] {
  const source = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
  // Anchor on the closing `],` at the array's indentation. The patterns contain
  // `]` themselves (e.g. `[^?]`), so a naive first-`]` match would truncate.
  const block = source.match(/matcher:\s*\[([\s\S]*?)\n\s*\],/);
  assert.ok(block, "expected src/proxy.ts to declare a config.matcher array");
  return [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
}

describe("proxy middleware matcher", () => {
  it("declares the Clerk proxy pattern explicitly", () => {
    assert.ok(
      readDeclaredMatcher().includes(CLERK_PROXY_MATCHER_PATTERN),
      "src/proxy.ts must include the Clerk proxy matcher entry",
    );
  });

  it("routes Clerk proxy bundle and API requests through the middleware", () => {
    assert.equal(routesClerkProxyRequests(readDeclaredMatcher()), true);
  });

  it("keeps hashed static assets out of the middleware", () => {
    const matcher = readDeclaredMatcher();
    assert.equal(matchesMatcher("/_next/static/chunks/main.js", matcher), false);
    assert.equal(matchesMatcher("/favicon.ico", matcher), false);
  });

  it("still covers application and API routes", () => {
    const matcher = readDeclaredMatcher();
    for (const path of ["/", "/menu", "/sign-in", "/admin", "/api/admin/orders"]) {
      assert.equal(matchesMatcher(path, matcher), true, `${path} should match`);
    }
  });
});

/**
 * A second, independent failure produced the same symptom as the matcher bug.
 *
 * Clerk's browser bundle was being fetched from the publishable key's Frontend
 * API domain (`https://clerk.jos-grill.vercel.app/npm/@clerk/ui@1/dist/ui.browser.js`)
 * instead of through this app's own proxy. That domain does not resolve, so the
 * widget failed with `failed_to_load_clerk_ui` even after the bundle proxy was
 * fixed. Pinning `NEXT_PUBLIC_CLERK_PROXY_URL` to a relative path keeps the
 * request same-origin.
 */
describe("Clerk proxy URL resolution", () => {
  const LIVE_KEY = "pk_live_Y2xlcmsuam9zLWdyaWxsLnZlcmNlbC5hcHAk";
  const DEV_KEY = "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk";

  it("returns an explicit root-relative proxy path unchanged", () => {
    assert.equal(
      resolveClerkProxyUrl({ [CLERK_PROXY_URL_ENV]: "/__clerk" }),
      "/__clerk",
    );
  });

  it("trims surrounding whitespace on an explicit value", () => {
    assert.equal(
      resolveClerkProxyUrl({ [CLERK_PROXY_URL_ENV]: "  /__clerk  " }),
      "/__clerk",
    );
  });

  it("prefers an explicit value over the default", () => {
    assert.equal(
      resolveClerkProxyUrl({
        [CLERK_PROXY_URL_ENV]: "/custom-proxy",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: LIVE_KEY,
      }),
      "/custom-proxy",
    );
  });

  it("defaults a live publishable key to the same-origin proxy path", () => {
    // This is the actual fix: Clerk's own auto-proxy needs the server-only
    // VERCEL_TARGET_ENV, which is absent during client hydration, so the client
    // fell back to the publishable key's Frontend API domain and the UI bundle
    // failed to load.
    assert.equal(
      resolveClerkProxyUrl({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: LIVE_KEY }),
      CLERK_PROXY_PATH,
    );
  });

  it("leaves a development publishable key alone", () => {
    assert.equal(
      resolveClerkProxyUrl({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: DEV_KEY }),
      undefined,
    );
  });

  it("returns undefined when no key and no explicit value are set", () => {
    assert.equal(resolveClerkProxyUrl({}), undefined);
    assert.equal(resolveClerkProxyUrl({ [CLERK_PROXY_URL_ENV]: "" }), undefined);
    assert.equal(resolveClerkProxyUrl({ [CLERK_PROXY_URL_ENV]: "   " }), undefined);
  });

  it("keeps the configured path in step with the middleware matcher", () => {
    const matcher = readDeclaredMatcher();
    assert.equal(
      matchesMatcher(`${CLERK_PROXY_PATH}/npm/@clerk/ui@1/dist/ui.browser.js`, matcher),
      true,
      "the proxy path the client is given must be routed through the middleware",
    );
  });
});
