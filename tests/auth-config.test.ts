import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { isClerkConfigured } from "../src/lib/auth/config.ts";
import { getSysAdminEmails, isSysAdminEmail } from "../src/lib/auth/config.ts";

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

/**
 * The server-side administrator allow-list (`ADMIN_EMAILS`).
 *
 * This is the mechanism that grants `santus4jah@gmail.com` administrator access
 * without writing a role into the account's metadata. It is only ever compared
 * against the email read from the verified Clerk session.
 */
describe("administrator email allow-list", () => {
  const KEY = "ADMIN_EMAILS";
  const previous = process.env[KEY];

  afterEach(() => {
    if (previous === undefined) delete process.env[KEY];
    else process.env[KEY] = previous;
  });

  it("denies when nothing is configured", () => {
    delete process.env[KEY];
    assert.deepEqual(getSysAdminEmails(), []);
    assert.equal(isSysAdminEmail("santus4jah@gmail.com"), false);
  });

  it("matches the configured owner once set", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    assert.equal(isSysAdminEmail("santus4jah@gmail.com"), true);
  });

  it("matches case-insensitively and tolerates surrounding whitespace", () => {
    process.env[KEY] = "  Santus4Jah@Gmail.com ";
    assert.equal(isSysAdminEmail("santus4jah@gmail.com"), true);
    assert.equal(isSysAdminEmail("SANTUS4JAH@GMAIL.COM"), true);
  });

  it("supports several comma-separated administrators", () => {
    process.env[KEY] = "a@example.com, santus4jah@gmail.com ,b@example.com";
    assert.deepEqual(getSysAdminEmails(), [
      "a@example.com",
      "santus4jah@gmail.com",
      "b@example.com",
    ]);
    assert.equal(isSysAdminEmail("b@example.com"), true);
  });

  it("does not match a different or partial address", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    assert.equal(isSysAdminEmail("attacker@example.com"), false);
    assert.equal(isSysAdminEmail("santus4jah@gmail.com.evil.com"), false);
    assert.equal(isSysAdminEmail("santus@jah@gmail.com"), false);
  });

  it("never treats a missing or non-string email as an administrator", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    assert.equal(isSysAdminEmail(null), false);
    assert.equal(isSysAdminEmail(undefined), false);
    assert.equal(isSysAdminEmail(""), false);
  });
});
