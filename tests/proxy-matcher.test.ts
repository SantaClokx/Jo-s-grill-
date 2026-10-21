import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  CLERK_PROXY_MATCHER_PATTERN,
  matchesMatcher,
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
