import { ADMIN_ROLES } from "./config.ts";

/**
 * Reading an administrator role out of Clerk metadata.
 *
 * Kept as pure functions with no Clerk import so the decision logic can be unit
 * tested directly. The security-critical property is that the role is read from
 * a metadata object that only the Clerk server SDK or Dashboard can write - it
 * is never read from a request body, query string, header or localStorage.
 */

/** Clerk's public metadata is an arbitrary JSON object. Narrow it safely. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Every role claim present, as strings.
 *
 * Supports both the plain `{ role: "admin" }` shape and Clerk's `{ roles: [] }`
 * array shape. Anything unrecognised yields an empty list, which denies access.
 */
export function extractRoles(publicMetadata: unknown): string[] {
  if (!isRecord(publicMetadata)) return [];

  const roles: string[] = [];

  const { role } = publicMetadata;
  if (typeof role === "string" && role.trim() !== "") roles.push(role.trim());

  const { roles: list } = publicMetadata;
  if (Array.isArray(list)) {
    for (const entry of list) {
      if (typeof entry === "string" && entry.trim() !== "") roles.push(entry.trim());
    }
  }

  return roles;
}

/**
 * The first role claim, for display. Prefer `extractRoles` for decisions.
 */
export function extractRole(publicMetadata: unknown): string | null {
  return extractRoles(publicMetadata)[0] ?? null;
}

/**
 * Whether the metadata grants administrator access.
 *
 * Denies by default: missing metadata, an unexpected type, or no recognised
 * role all return false. Roles must match exactly, so `administrator` or
 * `superadmin` do not count unless they are listed in `ADMIN_ROLES`.
 */
export function hasAdminRole(publicMetadata: unknown): boolean {
  const roles = extractRoles(publicMetadata);
  return roles.some((role) => ADMIN_ROLES.includes(role));
}

/** The authentication state we act on, reduced to what the guards need. */
export interface AuthContext {
  isAuthenticated: boolean;
  /** Clerk user id, or null when signed out. */
  userId: string | null;
  /** Server-written metadata, or null when signed out. */
  publicMetadata: unknown;
}

/** Signed in *and* carrying the administrator role. */
export function isAdmin(context: AuthContext): boolean {
  return context.isAuthenticated && hasAdminRole(context.publicMetadata);
}

/**
 * Map a Clerk session to the reduced context the guard needs.
 *
 * Pure and free of Clerk imports, so the mapping from Clerk's claim shape to
 * our decision input is unit tested directly rather than only being exercised
 * against a live instance. `sessionClaims.metadata` is the server-controlled
 * public metadata snapshot; clients cannot write it, so a role found there is
 * trustworthy.
 *
 * `sessionClaims` is typed loosely because Clerk's JWT payload type varies with
 * the custom claims configured on a project, and only the `metadata` field is
 * relevant here.
 */
export function toAuthContext(session: {
  userId: string | null | undefined;
  sessionClaims?: unknown;
}): AuthContext {
  if (!session.userId) {
    return { isAuthenticated: false, userId: null, publicMetadata: null };
  }

  const claims = session.sessionClaims;
  const metadata =
    typeof claims === "object" && claims !== null
      ? (claims as { metadata?: unknown }).metadata
      : undefined;

  return {
    isAuthenticated: true,
    userId: session.userId,
    publicMetadata: metadata ?? null,
  };
}
