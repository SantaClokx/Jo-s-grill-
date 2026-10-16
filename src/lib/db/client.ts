import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl, isPostgresUrl } from "./config.ts";
import * as schema from "./schema/index.ts";

/**
 * The database client.
 *
 * The `postgres` (postgres.js) driver is used rather than `@neondatabase/serverless`
 * for three reasons:
 *
 *   1. One driver serves both Neon and an ordinary PostgreSQL server, so the
 *      same code path can be verified against a real database locally and in CI.
 *   2. It supports interactive transactions (`db.transaction`), which the
 *      order write needs: an order and its lines must commit together.
 *   3. On Node.js (the runtime the order endpoint already uses) it speaks the
 *      normal wire protocol, which Neon's pooled endpoint serves.
 *
 * It is used with `prepare: false` so the connection is compatible with
 * transaction-mode poolers like Neon's, which do not support prepared
 * statements across pooled connections.
 */

const globalForDb = globalThis as unknown as { __josGrillDb?: ReturnType<typeof createDb> };

function createDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The database client cannot be created. Check isDatabaseConfigured() before calling this.",
    );
  }
  if (!isPostgresUrl(url)) {
    throw new Error("DATABASE_URL must be a postgresql:// connection string.");
  }

  const client = postgres(url, {
    // Neon's pooler does not support prepared statements across connections.
    prepare: false,
    // Keep the pool small: Vercel functions are short-lived and the pooler
    // multiplexes many of them onto few real connections.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

/**
 * Lazily create the client so importing this module never throws while the
 * database is unconfigured. The public site imports the same module tree and
 * must keep working with no database.
 */
export function getDb() {
  if (!globalForDb.__josGrillDb) {
    globalForDb.__josGrillDb = createDb();
  }
  return globalForDb.__josGrillDb;
}

export type Database = ReturnType<typeof getDb>;
export { schema };
