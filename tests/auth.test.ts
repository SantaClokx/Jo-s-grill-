import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { ADMIN_ROLE } from "../src/lib/auth/config.ts";
import { applyAdminAllowList, evaluateAdminAccess } from "../src/lib/auth/decide.ts";
import {
  extractRole,
  hasAdminRole,
  isAdmin,
  primaryEmail,
  toAuthContext,
  type AuthContext,
} from "../src/lib/auth/authorization.ts";

/**
 * These tests exercise the real allow/deny logic in `src/lib/auth`. Nothing is
 * mocked: `evaluateAdminAccess` is a pure function, so the security decisions
 * under test are the exact ones that run in production.
 *
 * What these tests do NOT prove: that a live Clerk instance returns the claims
 * we expect. That requires real Clerk keys and a signed-in session, and is
 * reported separately as NOT TESTED until credentials exist.
 */

const signedOut: AuthContext = {
  isAuthenticated: false,
  userId: null,
  publicMetadata: null,
  email: null,
};

function signedIn(publicMetadata: unknown, email: string | null = null): AuthContext {
  return { isAuthenticated: true, userId: "user_abc123", publicMetadata, email };
}

describe("administrator role extraction", () => {
  it("recognises the plain role shape", () => {
    assert.equal(extractRole({ role: ADMIN_ROLE }), "admin");
    assert.equal(hasAdminRole({ role: ADMIN_ROLE }), true);
  });

  it("recognises the roles array shape", () => {
    assert.equal(hasAdminRole({ roles: ["admin"] }), true);
    assert.equal(hasAdminRole({ roles: ["customer", "admin"] }), true);
  });

  it("trims surrounding whitespace", () => {
    assert.equal(hasAdminRole({ role: "  admin  " }), true);
  });

  it("denies an ordinary customer", () => {
    assert.equal(hasAdminRole({ role: "customer" }), false);
    assert.equal(extractRole({ role: "customer" }), "customer");
  });

  it("denies lookalike roles rather than matching substrings", () => {
    assert.equal(hasAdminRole({ role: "administrator" }), false);
    assert.equal(hasAdminRole({ role: "superadmin" }), false);
    assert.equal(hasAdminRole({ role: "ADMIN" }), false);
    assert.equal(hasAdminRole({ role: "admin.readonly" }), false);
  });

  it("denies malformed or missing metadata", () => {
    assert.equal(hasAdminRole(null), false);
    assert.equal(hasAdminRole(undefined), false);
    assert.equal(hasAdminRole({}), false);
    assert.equal(hasAdminRole("admin"), false);
    assert.equal(hasAdminRole(42), false);
    assert.equal(hasAdminRole([]), false);
    assert.equal(hasAdminRole({ role: 123 }), false);
    assert.equal(hasAdminRole({ roles: [] }), false);
    assert.equal(hasAdminRole({ roles: [123, null] }), false);
  });

  it("isAdmin requires both a session and the role", () => {
    assert.equal(isAdmin(signedIn({ role: "admin" })), true);
    assert.equal(isAdmin(signedIn({ role: "customer" })), false);
    assert.equal(isAdmin(signedOut), false);
  });
});

describe("admin access decisions", () => {
  it("grants access to a configured, signed-in administrator", () => {
    const result = evaluateAdminAccess({
      configured: true,
      context: signedIn({ role: "admin" }),
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.userId, "user_abc123");
  });

  it("denies with 503 when Clerk is not configured", () => {
    const result = evaluateAdminAccess({
      configured: false,
      context: signedIn({ role: "admin" }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "misconfigured");
      assert.equal(result.status, 503);
    }
  });

  it("never treats a missing configuration as a bypass", () => {
    // Even a perfect administrator context is refused when unconfigured.
    const asAdmin = evaluateAdminAccess({ configured: false, context: signedIn({ role: "admin" }) });
    const anonymous = evaluateAdminAccess({ configured: false, context: signedOut });
    assert.equal(asAdmin.ok, false);
    assert.equal(anonymous.ok, false);
  });

  it("denies with 401 when signed out", () => {
    const result = evaluateAdminAccess({ configured: true, context: signedOut });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "unauthenticated");
      assert.equal(result.status, 401);
    }
  });

  it("denies with 403 an authenticated non-administrator", () => {
    const result = evaluateAdminAccess({
      configured: true,
      context: signedIn({ role: "customer" }),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "forbidden");
      assert.equal(result.status, 403);
    }
  });

  it("denies an authenticated user with no role metadata at all", () => {
    const result = evaluateAdminAccess({ configured: true, context: signedIn({}) });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "forbidden");
  });

  it("denies an authenticated user with tampered metadata types", () => {
    for (const bad of [null, "admin", 1, [], { role: null }, { role: { nested: "admin" } }]) {
      const result = evaluateAdminAccess({ configured: true, context: signedIn(bad) });
      assert.equal(result.ok, false, `expected denial for metadata: ${JSON.stringify(bad)}`);
    }
  });

  it("denies when isAuthenticated is true but no user id is present", () => {
    const result = evaluateAdminAccess({
      configured: true,
      context: { isAuthenticated: true, userId: null, publicMetadata: { role: "admin" }, email: null },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "unauthenticated");
  });
});

/**
 * The mapping from Clerk's session shape into our decision input. This is the
 * seam where a live session would be misread, so it is covered directly here
 * even though the session itself is not mocked.
 */
describe("Clerk session to auth context", () => {
  it("treats a null userId as signed out", () => {
    assert.deepEqual(toAuthContext({ userId: null }), {
      isAuthenticated: false,
      userId: null,
      publicMetadata: null,
      email: null,
    });
  });

  it("treats an undefined userId as signed out", () => {
    assert.equal(toAuthContext({ userId: undefined }).isAuthenticated, false);
  });

  it("carries the user id and metadata for a signed-in user", () => {
    const context = toAuthContext({
      userId: "user_123",
      sessionClaims: { metadata: { role: "admin" } },
    });
    assert.deepEqual(context, {
      isAuthenticated: true,
      userId: "user_123",
      publicMetadata: { role: "admin" },
      email: null,
    });
  });

  it("carries the email when the token has the custom claim", () => {
    const context = toAuthContext({
      userId: "user_123",
      sessionClaims: { email: "owner@example.com" },
    });
    assert.equal(context.email, "owner@example.com");
  });

  it("defaults metadata and email to null when claims are absent", () => {
    const context = toAuthContext({ userId: "user_123" });
    assert.equal(context.publicMetadata, null);
    assert.equal(context.email, null);
    assert.equal(isAdmin(context), false);
  });

  /**
   * Regression: `metadata` and `email` are not Clerk *default* session claims.
   * A stock session token carries neither, so a decision made from the token
   * alone refused every signed-in account. `toAuthContext` must leave both null
   * in that case (the guard fills them from the backend API), and null must
   * deny - never be read as a grant.
   */
  it("regression: a stock session token carries no role and is denied", () => {
    const context = toAuthContext({
      userId: "user_123",
      // The real default claim set, verbatim from Clerk's session-token docs.
      sessionClaims: {
        azp: "https://jos-grill.vercel.app",
        exp: 1713158400,
        fva: [5, -1],
        iat: 1713154800,
        iss: "https://clerk.jos-grill.vercel.app",
        nbf: 1713154790,
        sid: "sess_abc",
        sub: "user_123",
        v: 2,
      },
    });

    assert.equal(context.publicMetadata, null);
    assert.equal(context.email, null);
    assert.equal(evaluateAdminAccess({ configured: true, context }).ok, false);
  });

  it("end to end: an admin session is granted, a customer session is not", () => {
    const admin = toAuthContext({
      userId: "user_admin",
      sessionClaims: { metadata: { role: "admin" } },
    });
    const customer = toAuthContext({
      userId: "user_cust",
      sessionClaims: { metadata: { role: "customer" } },
    });

    assert.equal(evaluateAdminAccess({ configured: true, context: admin }).ok, true);
    assert.equal(evaluateAdminAccess({ configured: true, context: customer }).ok, false);
  });

  it("end to end: an admin session is denied when Clerk is unconfigured", () => {
    const admin = toAuthContext({
      userId: "user_admin",
      sessionClaims: { metadata: { role: "admin" } },
    });
    const result = evaluateAdminAccess({ configured: false, context: admin });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "misconfigured");
  });
});

describe("primary email resolution", () => {
  it("prefers the address Clerk marks as primary", () => {
    assert.equal(
      primaryEmail({
        primaryEmailAddress: { emailAddress: "primary@example.com" },
        emailAddresses: [{ emailAddress: "other@example.com", verification: { status: "verified" } }],
      }),
      "primary@example.com",
    );
  });

  it("falls back to the first verified address when none is primary", () => {
    assert.equal(
      primaryEmail({
        primaryEmailAddress: null,
        emailAddresses: [
          { emailAddress: "unverified@example.com", verification: { status: "unverified" } },
          { emailAddress: "verified@example.com", verification: { status: "verified" } },
        ],
      }),
      "verified@example.com",
    );
  });

  it("returns null when no email can be established", () => {
    assert.equal(primaryEmail({}), null);
    assert.equal(primaryEmail({ primaryEmailAddress: null, emailAddresses: [] }), null);
    assert.equal(
      primaryEmail({
        emailAddresses: [{ emailAddress: "unverified@example.com", verification: { status: "unverified" } }],
      }),
      null,
    );
  });

  it("ignores an empty or whitespace-only primary address", () => {
    assert.equal(primaryEmail({ primaryEmailAddress: { emailAddress: "   " } }), null);
    assert.equal(primaryEmail({ primaryEmailAddress: { emailAddress: "" } }), null);
  });

  it("never treats an unresolved email as an allow-list match", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    const elevated = applyAdminAllowList(signedIn(null), primaryEmail({}));
    assert.equal(evaluateAdminAccess({ configured: true, context: elevated }).ok, false);
    delete process.env.ADMIN_EMAILS;
  });
});

/**
 * The administrator allow-list, applied to the verified session.
 *
 * This proves the elevation rule end to end at the decision layer: an allow-listed
 * email becomes an administrator, and nothing else does. The email always comes
 * from the caller's session, so a request body can never influence it.
 */
describe("administrator allow-list elevation", () => {
  const KEY = "ADMIN_EMAILS";
  const previous = process.env[KEY];

  afterEach(() => {
    if (previous === undefined) delete process.env[KEY];
    else process.env[KEY] = previous;
  });

  const signedInNoRole: AuthContext = {
    isAuthenticated: true,
    userId: "user_owner",
    publicMetadata: null,
    email: "santus4jah@gmail.com",
  };

  it("grants access to the allow-listed email", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    const elevated = applyAdminAllowList(signedInNoRole, "santus4jah@gmail.com");
    const result = evaluateAdminAccess({ configured: true, context: elevated });
    assert.equal(result.ok, true);
  });

  it("denies an unrelated verified email", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    const elevated = applyAdminAllowList(signedInNoRole, "someone@example.com");
    const result = evaluateAdminAccess({ configured: true, context: elevated });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "forbidden");
  });

  it("grants nothing when the allow-list is unset", () => {
    delete process.env[KEY];
    const elevated = applyAdminAllowList(signedInNoRole, "santus4jah@gmail.com");
    assert.equal(evaluateAdminAccess({ configured: true, context: elevated }).ok, false);
  });

  it("does not elevate a signed-out context", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    const elevated = applyAdminAllowList(signedOut, "santus4jah@gmail.com");
    assert.equal(elevated.isAuthenticated, false);
    assert.equal(hasAdminRole(elevated.publicMetadata), false);
  });

  it("does not elevate when the session carries no email", () => {
    process.env[KEY] = "santus4jah@gmail.com";
    assert.equal(hasAdminRole(applyAdminAllowList(signedInNoRole, null).publicMetadata), false);
    assert.equal(hasAdminRole(applyAdminAllowList(signedInNoRole, undefined).publicMetadata), false);
  });

  it("leaves an existing metadata role untouched", () => {
    process.env[KEY] = "someone-else@example.com";
    const alreadyAdmin = signedIn({ role: "admin" });
    const result = applyAdminAllowList(alreadyAdmin, "not-on-the-list@example.com");
    assert.equal(hasAdminRole(result.publicMetadata), true);
  });
});
