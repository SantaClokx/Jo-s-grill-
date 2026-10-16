import { auth } from "@clerk/nextjs/server";
import { connection } from "next/server";

import { toAuthContext, type AuthContext } from "./authorization.ts";
import { isClerkConfigured } from "./config.ts";
import { decideAdminAccess, type AdminGuardResult } from "./decide.ts";

export type { AdminGuardResult };

/**
 * Server-side administrator guard.
 *
 * Every admin page and admin API route must call `requireAdmin()` on the server
 * before touching privileged data. The check is never performed in the browser:
 * a client-side redirect only hides a screen, it does not protect the data.
 *
 * The allow/deny decision itself lives in `decide.ts` as a pure function so it
 * can be unit tested without mocking Clerk.
 */

/**
 * Read the current Clerk session into the reduced context the guard needs.
 *
 * `await connection()` is load-bearing. With `cacheComponents` enabled, Next.js
 * prerenders a static shell for anything that does not read a request-time API.
 * When Clerk is unconfigured this function returns early without reading
 * cookies, which would let the admin page prerender *including its privileged
 * content* into that shell - shipping admin markup to anonymous visitors. The
 * `connection()` call forces request-time rendering in every branch, so the
 * shell never contains admin content.
 */
export async function readAuthContext(): Promise<AuthContext> {
  await connection();

  if (!isClerkConfigured()) {
    return { isAuthenticated: false, userId: null, publicMetadata: null };
  }

  const session = await auth();
  return toAuthContext({
    userId: session.userId,
    sessionClaims: session.sessionClaims,
  });
}

/**
 * Require an authenticated administrator.
 *
 * Deny-by-default: an unverifiable role is refused, and a missing Clerk
 * configuration is reported as an explicit 503 rather than being treated as
 * "no protection needed".
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const context = await readAuthContext();
  return decideAdminAccess(context);
}
