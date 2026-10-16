/**
 * Database configuration.
 *
 * `DATABASE_URL` is server-only. It is never prefixed `NEXT_PUBLIC_`, so it
 * cannot reach the browser bundle. A missing value is not an error at import
 * time: the public site must keep working with no database, and the checkout
 * endpoint reports honestly that the order was not stored.
 */

/**
 * The Neon PostgreSQL connection string, or null when it is not configured.
 *
 * Expects a standard `postgresql://` URL. For Neon, use the **pooled** endpoint
 * (the host containing `-pooler`); serverless functions open many short-lived
 * connections, and the pooler absorbs them. See `docs/DATABASE.md`.
 */
export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : null;
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseUrl() !== null;
}

/**
 * Whether a URL looks like a PostgreSQL connection string.
 *
 * Used to fail fast with a clear message when someone sets `DATABASE_URL` to
 * the wrong kind of value, rather than surfacing a confusing driver error.
 */
export function isPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//.test(url);
}
