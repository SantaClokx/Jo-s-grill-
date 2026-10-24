import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse, connection } from "next/server";

import {
  hasAdminRole,
  primaryEmail,
  resolveMetadataPreference,
  toAuthContext,
  type AuthContext,
} from "./authorization.ts";
import { isClerkConfigured } from "./config.ts";
import { applyAdminAllowList, decideAdminAccess, type AdminGuardResult } from "./decide.ts";

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
 * Fill in the account's metadata and email from Clerk's backend API.
 *
 * Both are needed to decide access and neither is a Clerk *default* session
 * claim: a stock session token contains only `azp, exp, fva, iat, iss, nbf, sid,
 * sub, v, o, pla, fea, sts, act`. Reading them from `sessionClaims` alone
 * therefore always came back empty, which refused every signed-in account with
 * a 403 and made the `ADMIN_EMAILS` allow-list unreachable.
 *
 * A token *can* carry a `metadata` custom claim if a project adds one via a JWT
 * template. That value is a snapshot taken when the session was minted, so it
 * goes stale the moment an administrator changes a role in the Dashboard: the
 * old token keeps its old metadata until it is refreshed, and the account is
 * refused with a 403 even though the role is now correct. The backend API is
 * always authoritative and needs no Dashboard claim configuration, so it is
 * consulted whenever it might change the outcome - specifically when the token
 * does not already grant access. An unreachable backend fails closed.
 */
async function resolveAccount(context: AuthContext): Promise<AuthContext> {
  if (!context.isAuthenticated || !context.userId) return context;

  // Fast path: the token already carries a usable answer, so no round trip is
  // needed. `hasAdminRole` is the only decision that matters, and the email is
  // only consulted by the allow-list, which cannot apply to an existing admin.
  if (hasAdminRole(context.publicMetadata) && context.email !== null) return context;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(context.userId);

    const fromBackend = user.publicMetadata ?? null;

    return {
      ...context,
      // See `resolveMetadataPreference`: the freshly fetched metadata wins
      // whenever it grants access, so a stale token snapshot cannot keep a
      // legitimately promoted account out.
      publicMetadata: resolveMetadataPreference({
        tokenMetadata: context.publicMetadata,
        backendMetadata: fromBackend,
      }),
      email: context.email ?? primaryEmail(user),
    };
  } catch {
    // Fail closed. An unreachable Clerk backend must never be read as "this
    // account is probably fine" - the account simply stays unprivileged and the
    // caller receives the ordinary 403.
    return context;
  }
}

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
    return { isAuthenticated: false, userId: null, publicMetadata: null, email: null };
  }

  const session = await auth();
  const context = await resolveAccount(
    toAuthContext({
      userId: session.userId,
      sessionClaims: session.sessionClaims,
    }),
  );

  // The allow-list is applied against the account's own email, which came from
  // the server-verified session or Clerk's backend API. It is never taken from
  // anything the browser sends.
  return applyAdminAllowList(context, context.email);
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

/**
 * Turn a failed guard result into an HTTP response.
 *
 * One implementation shared by every admin API route so the status codes and the
 * error body stay consistent and no route is tempted to improvise its own.
 *
 * The body carries the guard's already customer-safe message and nothing else:
 * no stack trace, no user id, no internal state. In particular a `403` does not
 * reveal whether the account exists or which role it lacks.
 */
export function guardFailureResponse(result: Extract<AdminGuardResult, { ok: false }>) {
  return NextResponse.json({ error: result.message }, { status: result.status });
}
