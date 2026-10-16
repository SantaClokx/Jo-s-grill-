/**
 * Authentication configuration for the admin area.
 *
 * Clerk is the only supported provider. There is deliberately no fallback to
 * another provider and no "auth disabled" switch: a missing configuration must
 * fail closed, never open.
 */

/**
 * The Clerk role that grants administrator access.
 *
 * This is stored in a user's `publicMetadata`, which only the Clerk server SDK
 * or the Clerk Dashboard can write. A client can never set it, so it is safe to
 * trust once read on the server.
 */
export const ADMIN_ROLE = "admin";

/**
 * Clerk is only "configured" when both keys are present.
 *
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is public by design. `CLERK_SECRET_KEY`
 * is server-only and must never reach the browser. A publishable key alone is
 * not enough to verify a session, so both are required.
 */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}
