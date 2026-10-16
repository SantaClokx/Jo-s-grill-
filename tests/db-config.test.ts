import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  getDatabaseUrl,
  isDatabaseConfigured,
  isPostgresUrl,
} from "../src/lib/db/config.ts";

/**
 * Database configuration detection.
 *
 * The public site must keep working with no database, and the checkout endpoint
 * must report honestly when storage is unavailable. Both depend on these
 * functions being correct, so they are tested directly - no database required.
 */

const KEY = "DATABASE_URL";
let saved: string | undefined;

beforeEach(() => {
  saved = process.env[KEY];
  delete process.env[KEY];
});

afterEach(() => {
  if (saved === undefined) delete process.env[KEY];
  else process.env[KEY] = saved;
});

describe("database configuration", () => {
  it("reports not configured when DATABASE_URL is absent", () => {
    assert.equal(getDatabaseUrl(), null);
    assert.equal(isDatabaseConfigured(), false);
  });

  it("reports not configured when DATABASE_URL is empty or whitespace", () => {
    process.env[KEY] = "   ";
    assert.equal(getDatabaseUrl(), null);
    assert.equal(isDatabaseConfigured(), false);
  });

  it("reports configured when DATABASE_URL is set", () => {
    process.env[KEY] = "postgresql://user:pass@host/db?sslmode=require";
    assert.equal(isDatabaseConfigured(), true);
    assert.equal(getDatabaseUrl(), "postgresql://user:pass@host/db?sslmode=require");
  });

  it("accepts both postgres:// and postgresql:// schemes", () => {
    assert.equal(isPostgresUrl("postgres://user:pass@host/db"), true);
    assert.equal(isPostgresUrl("postgresql://user:pass@host/db"), true);
  });

  it("rejects non-postgres URLs so a wrong provider fails fast", () => {
    assert.equal(isPostgresUrl("mysql://user:pass@host/db"), false);
    assert.equal(isPostgresUrl("mongodb://host/db"), false);
    assert.equal(isPostgresUrl("https://example.com"), false);
    assert.equal(isPostgresUrl(""), false);
  });

  it("does not leak the value anywhere except the URL getter", () => {
    // isDatabaseConfigured is a boolean; it must never return the secret itself.
    process.env[KEY] = "postgresql://user:secret@host/db";
    assert.equal(typeof isDatabaseConfigured(), "boolean");
  });
});
