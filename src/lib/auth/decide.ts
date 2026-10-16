import { hasAdminRole, type AuthContext } from "./authorization.ts";
import { isClerkConfigured } from "./config.ts";

/**
 * The administrator access decision, as a pure function.
 *
 * Isolating this from Clerk is deliberate: it keeps the security decision unit
 * testable without mocking the SDK, and it leaves exactly one place where the
 * "allow or deny" logic lives. `requireAdmin()` supplies the inputs and turns
 * the result into an HTTP response.
 */

export type AdminGuardResult =
  | { ok: true; userId: string; publicMetadata: unknown }
  | { ok: false; reason: "misconfigured"; status: 503; message: string }
  | { ok: false; reason: "unauthenticated"; status: 401; message: string }
  | { ok: false; reason: "forbidden"; status: 403; message: string };

/**
 * Decide whether access is granted.
 *
 * Order matters: configuration is checked first, so a missing key can never be
 * silently treated as "no protection needed". Every branch other than a
 * confirmed administrator denies.
 */
export function evaluateAdminAccess(input: {
  configured: boolean;
  context: AuthContext;
}): AdminGuardResult {
  const { configured, context } = input;

  if (!configured) {
    return {
      ok: false,
      reason: "misconfigured",
      status: 503,
      message:
        "Admin authentication is not configured on this server. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. Access is denied until then.",
    };
  }

  if (!context.isAuthenticated || !context.userId) {
    return {
      ok: false,
      reason: "unauthenticated",
      status: 401,
      message: "You must be signed in to access this resource.",
    };
  }

  if (!hasAdminRole(context.publicMetadata)) {
    return {
      ok: false,
      reason: "forbidden",
      status: 403,
      message: "This account does not have administrator access.",
    };
  }

  return { ok: true, userId: context.userId, publicMetadata: context.publicMetadata };
}

/** Convenience wrapper reading configuration from the environment. */
export function decideAdminAccess(context: AuthContext): AdminGuardResult {
  return evaluateAdminAccess({ configured: isClerkConfigured(), context });
}
