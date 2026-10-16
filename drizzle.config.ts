import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Migrations are generated into `drizzle/` and committed to the repository, so
 * schema changes are reviewable and replayable. `drizzle-kit generate` never
 * touches a database; it writes SQL from the schema diff.
 *
 * `dbCredentials` is only needed for `push`/`migrate`/`studio`. The URL is read
 * from `DATABASE_URL` at runtime and is never committed.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
