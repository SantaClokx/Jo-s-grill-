import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import type { DeliveryDetails, Order, OrderStatus } from "@/types";

import { canTransition, isOrderStatus } from "../orders/status.ts";
import { getDb } from "./client.ts";
import { auditLog, orderItems, orders, type OrderItemRow } from "./schema/index.ts";

/**
 * Order data access.
 *
 * Everything here runs on the server. There is no client-safe entry point and
 * the connection string never leaves this module tree.
 *
 * Functions take already-validated, server-computed values. The API layer is
 * responsible for re-pricing from the catalogue before calling in; this layer
 * stores what it is given and enforces the database constraints on top.
 */



export interface PersistOrderInput {
  id: string;
  reference: string;
  customer: DeliveryDetails;
  lines: Array<{ itemId: string; name: string; unitPrice: number; quantity: number }>;
  pricing: { subtotal: number; deliveryFee: number; total: number; zone: "rivers" | "outside" };
  /** Verified Clerk user id, or null for a guest checkout. */
  clerkUserId: string | null;
  /** Optional idempotency key to make retries safe. */
  idempotencyKey?: string | null;
}

export interface PersistOrderResult {
  order: Order;
  /** false when an order with the same idempotency key already existed. */
  created: boolean;
}

/** A database read/write failure reduced to something safe to act on. */
export class OrderRepositoryError extends Error {
  readonly kind: "duplicate" | "not_found" | "unavailable";

  constructor(message: string, kind: "duplicate" | "not_found" | "unavailable") {
    super(message);
    this.name = "OrderRepositoryError";
    this.kind = kind;
  }
}

/**
 * postgres.js surfaces PostgreSQL error codes on the thrown value. 23505 is a
 * unique-constraint violation, which for us means a duplicate reference or a
 * replayed idempotency key rather than a genuine failure.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function toDomainOrder(row: {
  id: string;
  reference: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryNotes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isWithinRivers: boolean;
  createdAt: Date;
  items: OrderItemRow[];
}): Order {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: row.createdAt.toISOString(),
    // The column is constrained to the known set; narrow it for callers.
    status: isOrderStatus(row.status) ? row.status : "received",
    customer: {
      fullName: row.customerName,
      phone: row.customerPhone,
      address: row.deliveryAddress,
      city: row.deliveryCity,
      state: row.deliveryState,
      notes: row.deliveryNotes ?? undefined,
    },
    lines: row.items
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((item) => ({
        itemId: item.itemId,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    pricing: {
      subtotal: row.subtotal,
      deliveryFee: row.deliveryFee,
      total: row.total,
      zone: row.isWithinRivers ? "rivers" : "outside",
    },
  };
}

async function loadOrderRow(
  db: ReturnType<typeof getDb>,
  where: SQL,
): Promise<Order | null> {
  const [row] = await db.select().from(orders).where(where).limit(1);
  if (!row) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id));

  return toDomainOrder({ ...row, items });
}

/**
 * Persist an order and its lines atomically.
 *
 * The order row and its items are written in a single transaction: a half
 * written order (a row with missing lines) must never be observable.
 *
 * When `idempotencyKey` is supplied and already used, the existing order is
 * returned with `created: false` instead of inserting a duplicate. The unique
 * index on the column is what actually enforces this, so a race between two
 * simultaneous submissions is still safe.
 */
export async function createOrder(input: PersistOrderInput): Promise<PersistOrderResult> {
  const db = getDb();

  if (input.idempotencyKey) {
    const existing = await loadOrderRow(
      db,
      eq(orders.idempotencyKey, input.idempotencyKey),
    );
    if (existing) return { order: existing, created: false };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: input.id,
        reference: input.reference,
        status: "received",
        customerName: input.customer.fullName,
        customerPhone: input.customer.phone,
        deliveryAddress: input.customer.address,
        deliveryCity: input.customer.city,
        deliveryState: input.customer.state,
        deliveryNotes: input.customer.notes?.trim() ? input.customer.notes.trim() : null,
        subtotal: input.pricing.subtotal,
        deliveryFee: input.pricing.deliveryFee,
        total: input.pricing.total,
        isWithinRivers: input.pricing.zone === "rivers",
        clerkUserId: input.clerkUserId,
        idempotencyKey: input.idempotencyKey ?? null,
      });

      await tx.insert(orderItems).values(
        input.lines.map((line) => ({
          orderId: input.id,
          itemId: line.itemId,
          name: line.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      );
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Almost certainly a replayed idempotency key that raced the initial
      // lookup. Resolve to the existing order rather than reporting failure.
      if (input.idempotencyKey) {
        const existing = await loadOrderRow(
          db,
          eq(orders.idempotencyKey, input.idempotencyKey),
        );
        if (existing) return { order: existing, created: false };
      }
      throw new OrderRepositoryError("Order already exists.", "duplicate");
    }
    throw new OrderRepositoryError("Could not store the order.", "unavailable");
  }

  const stored = await getOrderByReference(input.reference);
  if (!stored) {
    throw new OrderRepositoryError("Order was written but could not be read back.", "unavailable");
  }
  return { order: stored, created: true };
}

export async function getOrderByReference(reference: string): Promise<Order | null> {
  return loadOrderRow(getDb(), eq(orders.reference, reference));
}

export interface ListOrdersOptions {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
}

/**
 * List orders, newest first. Intended for the authenticated admin area only -
 * the calling route must have passed `requireAdmin()` first.
 */
export async function listOrders(options: ListOrdersOptions = {}): Promise<Order[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);

  const db = getDb();
  const where = options.status ? eq(orders.status, options.status) : undefined;

  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  if (rows.length === 0) return [];

  // Fetch all lines for the page in one query rather than N queries.
  const ids = rows.map((row) => row.id);
  const items = await db
    .select()
    .from(orderItems)
    .where(sql`${orderItems.orderId} in ${ids}`);

  return rows.map((row) =>
    toDomainOrder({ ...row, items: items.filter((item) => item.orderId === row.id) }),
  );
}

/**
 * Update an order's status unconditionally. Returns the updated order, or null
 * if no order has that reference.
 *
 * Kept for callers that need a raw write; the admin API uses
 * `transitionOrderStatus`, which additionally enforces the allowed transitions.
 */
export async function updateOrderStatus(
  reference: string,
  status: OrderStatus,
): Promise<Order | null> {
  if (!isOrderStatus(status)) {
    throw new OrderRepositoryError("Unknown order status.", "not_found");
  }

  const db = getDb();
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.reference, reference))
    .returning({ id: orders.id });

  if (!updated) return null;
  return getOrderByReference(reference);
}

/**
 * Apply a permitted status transition.
 *
 * The read and the write are made atomic by constraining the `update` on the
 * status the caller believed was current (`expectedFrom`). If another request
 * changed the status in between, the update matches no row and `conflict` is
 * returned, so two concurrent administrators cannot both apply a transition and
 * silently lose one of them.
 */
export type TransitionResult =
  | { outcome: "updated"; order: Order }
  | { outcome: "not_found" }
  | { outcome: "conflict" }
  | { outcome: "invalid_transition"; from: OrderStatus };

export async function transitionOrderStatus(
  reference: string,
  nextStatus: OrderStatus,
): Promise<TransitionResult> {
  if (!isOrderStatus(nextStatus)) {
    throw new OrderRepositoryError("Unknown order status.", "not_found");
  }

  const current = await getOrderByReference(reference);
  if (!current) return { outcome: "not_found" };

  if (!canTransition(current.status, nextStatus)) {
    return { outcome: "invalid_transition", from: current.status };
  }

  // A no-op is not worth a write or an audit entry.
  if (current.status === nextStatus) {
    return { outcome: "updated", order: current };
  }

  const db = getDb();
  const [updated] = await db
    .update(orders)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(orders.reference, reference), eq(orders.status, current.status)))
    .returning({ id: orders.id });

  if (!updated) {
    // The row exists but its status changed under us.
    return { outcome: "conflict" };
  }

  const reread = await getOrderByReference(reference);
  if (!reread) {
    throw new OrderRepositoryError("Order was updated but could not be read back.", "unavailable");
  }
  return { outcome: "updated", order: reread };
}

/**
 * Count orders, optionally by status. Intended for the authenticated admin area.
 */
export async function countOrders(status?: OrderStatus): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(orders)
    .where(status ? and(eq(orders.status, status)) : undefined);
  return row?.value ?? 0;
}

/**
 * Cheap connectivity probe. Deliberately free of any framework import so it can
 * be called from a seed/verification script as well as a route handler. The
 * route handler is responsible for keeping the call at request time.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

export interface AuditEntry {
  actorUserId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * Record an administrator action.
 *
 * Never pass secrets, session tokens or full personal records in `details` -
 * this table is durable and is meant to answer "who did what, when", not to
 * duplicate customer data.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const db = getDb();
  await db.insert(auditLog).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    details: entry.details ?? null,
  });
}
