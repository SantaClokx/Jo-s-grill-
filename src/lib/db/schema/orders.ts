import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Order schema.
 *
 * Derived from the requirements in `docs/BACKEND-REQUIREMENTS.md` § 1 and the
 * existing `Order` type in `src/types`:
 *
 *   - `orders`      — one row per customer order, including the delivery
 *                     details and the server-computed totals.
 *   - `order_items` — one row per line, with the name and unit price *frozen*
 *                     at the time of the order.
 *   - `audit_log`   — administrator actions only (see below).
 *
 * Prices are copied onto the rows deliberately. The menu lives in code and can
 * change; an order must keep the price the customer actually agreed to. Re-
 * joining to a live catalogue would silently rewrite historical orders.
 *
 * Money is stored in whole naira as integers. The domain uses whole naira
 * (see `src/lib/currency.ts`), so integer columns avoid the rounding problems
 * of floating point and of `numeric`-as-string.
 */

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 64 }).primaryKey(),

    /** Human-readable reference shown to the customer, e.g. "JG-8F3K2Q". */
    reference: varchar("reference", { length: 32 }).notNull(),

    status: varchar("status", { length: 20 }).notNull().default("received"),

    // --- Customer / delivery details ---
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    deliveryAddress: varchar("delivery_address", { length: 300 }).notNull(),
    deliveryCity: varchar("delivery_city", { length: 80 }).notNull(),
    deliveryState: varchar("delivery_state", { length: 60 }).notNull(),
    deliveryNotes: varchar("delivery_notes", { length: 300 }),

    // --- Pricing (all whole naira, server-computed) ---
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    total: integer("total").notNull(),
    isWithinRivers: boolean("is_within_rivers").notNull(),

    /**
     * Clerk user id when the order came from a signed-in user, else null.
     * Public checkout does not require sign-in, so this is usually null. It is
     * written only from a verified server-side session, never from the request
     * body.
     */
    clerkUserId: text("clerk_user_id"),

    /**
     * Optional client-supplied idempotency key.
     *
     * Guards against a double-submitted checkout: if the same key arrives
     * again, the existing order is returned instead of a duplicate being
     * created. Nullable because not every caller supplies one.
     */
    idempotencyKey: varchar("idempotency_key", { length: 64 }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_reference_key").on(table.reference),
    uniqueIndex("orders_idempotency_key_key").on(table.idempotencyKey),
    index("orders_created_at_idx").on(table.createdAt.desc()),
    index("orders_status_idx").on(table.status),
    index("orders_clerk_user_id_idx").on(table.clerkUserId),
    check("orders_status_check", sql`${table.status} in ('received', 'confirmed', 'preparing', 'delivered', 'cancelled')`),
    check("orders_subtotal_non_negative", sql`${table.subtotal} >= 0`),
    check("orders_delivery_fee_non_negative", sql`${table.deliveryFee} >= 0`),
    check("orders_total_consistent", sql`${table.total} = ${table.subtotal} + ${table.deliveryFee}`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    /** Monotonic surrogate key; lines are always fetched by order. */
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),

    orderId: varchar("order_id", { length: 64 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    /**
     * Menu item id from the in-repo catalogue. Intentionally NOT a foreign key:
     * the catalogue is code, not a table, and a historical order must survive a
     * menu item being renamed or removed.
     */
    itemId: varchar("item_id", { length: 64 }).notNull(),

    /** Name and unit price frozen at order time. */
    name: varchar("name", { length: 120 }).notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_non_negative", sql`${table.unitPrice} >= 0`),
  ],
);

/**
 * Audit log for administrator actions.
 *
 * Only admin reads/writes of order data are recorded. The `actor_user_id` is a
 * verified Clerk user id taken from the server session. There is no foreign key
 * to a users table because Clerk owns user identity; we deliberately do not
 * mirror users into this database.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    actorUserId: text("actor_user_id").notNull(),
    action: varchar("action", { length: 60 }).notNull(),
    /** What was acted on, e.g. "order". */
    entity: varchar("entity", { length: 40 }).notNull(),
    /** Identifier within that entity, e.g. the order reference. */
    entityId: varchar("entity_id", { length: 64 }),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_log_created_at_idx").on(table.createdAt.desc())],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
