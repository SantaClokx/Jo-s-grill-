# Database — Neon PostgreSQL

The application stores orders in **Neon PostgreSQL** (https://neon.tech) through
**Drizzle ORM**. Authentication stays with **Clerk** — the database is not an auth
provider and there is no second auth system.

> **Not yet connected to a Neon database.** The code, schema and migrations are
> complete and were verified against a real PostgreSQL 16 instance. No Neon
> project has been provisioned and no production credential exists yet. See
> [Remaining setup](#7-remaining-setup) before taking real orders.

---

## 1. Why Neon, and why these libraries

| Choice | Reason |
| --- | --- |
| Neon PostgreSQL | Serverless Postgres with a connection pooler, which suits short-lived Vercel functions. Standard Postgres, so no proprietary lock-in. |
| Drizzle ORM | TypeScript-first, typed schema, generates plain SQL migrations that are reviewable and committed. No runtime magic, no code generation to keep in sync. |
| `postgres` (postgres.js) driver | One driver works against both Neon and an ordinary PostgreSQL server, so the same code path is verified locally and in CI. It also supports interactive transactions, which the order write needs. |
| Pooled connection string | Neon's pooler (host contains `-pooler`) multiplexes many serverless connections onto few real ones. |

`prepare: false` is set on the connection because Neon's transaction-mode pooler
does not support prepared statements across pooled connections.

## 2. Environment variable

One variable, server-only:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require"
```

Rules:

- **Never** prefix it with `NEXT_PUBLIC_`. That prefix embeds a value in the
  browser bundle.
- Never commit a real value. `.env*` is git-ignored; only `.env.example` with a
  placeholder is committed.
- Set it in Vercel under **Settings → Environment Variables** (see
  [`DEPLOYMENT.md`](DEPLOYMENT.md)).

When it is unset the site still works: `/api/orders` validates and prices the
order and returns `persisted: false`, and the admin order API returns 503.

## 3. Schema

Derived from the requirements in [`BACKEND-REQUIREMENTS.md`](BACKEND-REQUIREMENTS.md)
§ 1. Three tables, no more.

### `orders`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | varchar(64) PK | Internal id, e.g. `jg-8f3k2q-abc123`. |
| `reference` | varchar(32) | Customer-facing reference, e.g. `JG-8F3K2Q`. Unique. |
| `status` | varchar(20) | `received` / `confirmed` / `preparing` / `delivered` / `cancelled`. |
| `customer_name`, `customer_phone` | varchar | Delivery details. |
| `delivery_address`, `delivery_city`, `delivery_state`, `delivery_notes` | varchar | Delivery destination. |
| `subtotal`, `delivery_fee`, `total` | integer | Whole naira, server-computed. |
| `is_within_rivers` | boolean | Which delivery zone applied. |
| `clerk_user_id` | text | Verified Clerk user id, or NULL for a guest order. |
| `idempotency_key` | varchar(64) | Optional; unique. Prevents duplicate orders. |
| `created_at`, `updated_at` | timestamptz | |

Constraints and indexes:

- `orders_total_consistent`: `total = subtotal + delivery_fee` — a mis-priced row
  cannot be written.
- `orders_status_check`: status must be one of the known values.
- Non-negative checks on `subtotal` and `delivery_fee`.
- Unique index on `reference` and on `idempotency_key`.
- Indexes on `created_at DESC` (listing), `status`, `clerk_user_id`.

### `order_items`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint PK | Surrogate key. |
| `order_id` | varchar(64) FK → `orders.id` | `ON DELETE CASCADE`. |
| `item_id` | varchar(64) | Catalogue id. **Not** a foreign key — the menu is code. |
| `name`, `unit_price` | varchar / integer | **Frozen at order time.** |
| `quantity` | integer | `CHECK (quantity > 0)`. |

Name and price are copied onto the row deliberately: the menu lives in code and
can change, but an order must keep the price the customer agreed to.

### `audit_log`

Records administrator actions only: `actor_user_id` (verified Clerk id),
`action`, `entity`, `entity_id`, `details` (jsonb), `created_at`. No secrets or
full personal records are ever written here.

**No `users` table.** Clerk owns user identity, so users are not mirrored into
the database. Orders reference a Clerk user id directly.

## 4. Migrations

Migrations live in `drizzle/` and are committed.

```bash
npm run db:generate     # write a new migration from a schema change (no DB needed)
npm run db:migrate      # apply pending migrations to DATABASE_URL (idempotent)
```

`db:migrate` is safe to run on every deploy: Drizzle records applied migrations
and skips them on rerun. It prints neither the connection string nor any data,
and exits non-zero on failure so a pipeline stops rather than serving against an
unmigrated schema.

## 5. Clerk and Neon — how they fit together

Clerk and Neon are independent services with one connection between them: the
**Clerk user id** stored in `orders.clerk_user_id`.

| Concern | Owner |
| --- | --- |
| Who the user is (identity, sessions, sign-in) | **Clerk** |
| What the user may do (authorization) | Clerk role in `publicMetadata`, enforced server-side by `requireAdmin()` |
| Application data (orders, audit log) | **Neon PostgreSQL** |
| Passwords | Neither — Clerk handles credentials; no password column exists |

Key points:

- **No second auth provider.** No Supabase Auth, no Firebase Auth. Neon is
  database-only and issues no identity.
- **`clerk_user_id` is not a foreign key.** Clerk owns that identity; the id is
  stored as a value. There is no `users` table and no sync job to keep in step.
  A user deleted in Clerk leaves the order row intact, which is correct — an
  order is a business record, not a profile.
- **The browser never supplies an identity.** `clerk_user_id` is written from
  `auth()` on the server, never from the request body. A value in the body is
  ignored.
- **The admin API requires Clerk.** Reads of customer data start with
  `requireAdmin()`; without a valid admin session the request is refused before
  it reaches Neon. Two independent 503s are possible and both are correct:
  Clerk unconfigured (identity cannot be verified) and Neon unconfigured (no
  data to read).
- **Guest checkout is fine.** Sign-in is not required to place an order, so
  `clerk_user_id` is usually NULL on the public site. This is intentional, not a
  gap.
- **Compatibility caveat.** `sessionClaims` is only trusted because it is
  produced by the Clerk server SDK on a request that already passed through
  `clerkMiddleware()`. If Clerk keys are added or rotated, verify admin access
  still denies an anonymous request before relying on it.

## 6. Security properties

- The connection string is read from the environment at runtime, server-side
  only. It is never bundled into client code (verified by scanning the build).
- Orders are **written** only by the server. The client cannot reach the database.
- Prices and delivery fees are recomputed on the server from the catalogue before
  the write, so a tampered client cannot dictate totals.
- Reads of customer data are behind `requireAdmin()`, which verifies the Clerk
  session and the admin role on the server. Deny-by-default.
- All queries go through Drizzle's parameterised builder; no string concatenation.
- Order and lines are written in one transaction — a half-written order is not
  observable.
- Errors are caught and reduced to customer-safe messages. Connection strings and
  driver errors are never returned to the client or logged.

## 7. Testing

```bash
npm run check        # unit tests, no database required (integration tests skip)
npm run db:verify    # integration tests, requires DATABASE_URL
```

`tests/db/integration.test.ts` exercises the real repository code against a real
PostgreSQL server: create/read/update/list/count, idempotency, the check
constraints, and the foreign-key cascade. It cleans up the rows it creates.

## 8. Remaining setup

1. Create a Neon project at https://neon.tech and copy the **pooled** connection
   string.
2. Put it in `.env.local` locally and in Vercel **Settings → Environment
   Variables** for production.
3. Apply migrations: `DATABASE_URL=... npm run db:migrate`.
4. (Optional) verify: `DATABASE_URL=... npm run db:verify`.
5. Before taking real orders, complete the security checklist in
   [`BACKEND-REQUIREMENTS.md`](BACKEND-REQUIREMENTS.md) § 5 — in particular a
   rate limit on `POST /api/orders` and a data-retention decision for customer
   name, phone and address.
