import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { isClerkConfigured } from "../src/lib/auth/config.ts";

/**
 * Configuration detection. `isClerkConfigured()` is what stops a half-configured
 * deployment from being treated as protected, so both keys must be required.
 */

const KEYS = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] as const;
const saved = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of KEYS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    const value = saved.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Clerk configuration detection", () => {
  it("reports unconfigured when nothing is set", () => {
    assert.equal(isClerkConfigured(), false);
  });

  it("reports unconfigured with only the publishable key", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc";
    assert.equal(isClerkConfigured(), false);
  });

  it("reports unconfigured with only the secret key", () => {
    process.env.CLERK_SECRET_KEY = "sk_test_abc";
    assert.equal(isClerkConfigured(), false);
  });

  it("reports configured with both keys", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc";
    process.env.CLERK_SECRET_KEY = "sk_test_abc";
    assert.equal(isClerkConfigured(), true);
  });

  it("treats blank or whitespace values as missing", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "   ";
    process.env.CLERK_SECRET_KEY = "";
    assert.equal(isClerkConfigured(), false);
  });
});
