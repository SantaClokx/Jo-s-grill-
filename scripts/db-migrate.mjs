/**
 * Applies committed Drizzle migrations to DATABASE_URL.
 *
 * Run with:  npm run db:migrate
 *
 * This is the deployment-time migration path. It is idempotent: Drizzle records
 * applied migrations in `drizzle.__drizzle_migrations` and skips them on rerun,
 * so running it on every deploy is safe.
 *
 * It uses a single connection (`max: 1`) because Drizzle's migrator takes an
 * advisory lock and should not run concurrently with itself.
 *
 * It prints neither the connection string nor any data. A failure exits non-zero
 * so a deployment pipeline stops rather than serving against an unmigrated
 * schema.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(
    "DATABASE_URL is not set. Nothing to migrate. Set it to your Neon connection string and retry.",
  );
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error("DATABASE_URL must be a postgresql:// connection string.");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

try {
  console.log("Applying migrations from ./drizzle …");
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
} catch (error) {
  // Print the message only - it may name the host but never the password.
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
