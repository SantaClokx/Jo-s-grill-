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
 * Every role that grants administrator access.
 *
 * A single list, referenced by the decision logic, so adding a role is a
 * deliberate one-line change rather than a new check scattered across modules.
 */
export const ADMIN_ROLES: readonly string[] = [ADMIN_ROLE];

/**
 * Accounts given administrator access by server-side configuration.
 *
 * `ADMIN_EMAILS` is a comma-separated allow-list set in the server environment
 * (never in the repository). An entry is only ever matched against the email in
 * the **server-verified Clerk session**, never against anything the browser
 * sends, so a forged email in a request body or header has no effect.
 *
 * Purpose: this lets the owner establish a first administrator without writing a
 * role into `publicMetadata` from a machine, while keeping the grant revocable —
 * removing the address from the environment revokes access. A role set in
 * `publicMetadata` remains the primary mechanism; this is a fallback.
 */
export function getSysAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== "");
}

/** Whether an email (already read from the verified session) is an administrator. */
export function isSysAdminEmail(email: string | null | undefined): boolean {
  if (typeof email !== "string") return false;
  const normalised = email.trim().toLowerCase();
  if (normalised === "") return false;
  return getSysAdminEmails().includes(normalised);
}

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
