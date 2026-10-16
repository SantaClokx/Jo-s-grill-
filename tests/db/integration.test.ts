import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { sql } from "drizzle-orm";

import { getDb, schema } from "../../src/lib/db/client.ts";
import {
  countOrders,
  createOrder,
  getOrderByReference,
  listOrders,
  OrderRepositoryError,
  pingDatabase,
  recordAudit,
  updateOrderStatus,
} from "../../src/lib/db/orders.ts";
import { createOrderId, createOrderReference } from "../../src/lib/order-id.ts";
import type { DeliveryDetails } from "../../src/types/index.ts";

/**
 * Integration tests against a real PostgreSQL database.
 *
 * These are skipped unless DATABASE_URL is set, so the default `npm test` run
 * stays database-free. Run them explicitly with `npm run db:verify`:
 *
 *   DATABASE_URL=postgresql://... npm run db:verify
 *
 * They exercise the real repository functions - real SQL, real constraints,
 * real transactions. Every row created here is removed afterwards.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
const suite = hasDatabase ? describe : describe.skip;

const CUSTOMER: DeliveryDetails = {
  fullName: "Chinedu Okafor",
  phone: "0803 123 4567",
  address: "12 Old Refinery Road, near the market",
  city: "Elelenwo",
  state: "Rivers",
  notes: "Blue gate",
};

function orderInput(overrides: Partial<Parameters<typeof createOrder>[0]> = {}) {
  const reference = createOrderReference();
  return {
    id: createOrderId(reference),
    reference,
    customer: CUSTOMER,
    lines: [
      { itemId: "classic-burger", name: "JO'S Classic Burger", unitPrice: 4_500, quantity: 2 },
      { itemId: "chips", name: "Chips", unitPrice: 2_000, quantity: 1 },
    ],
    pricing: { subtotal: 11_000, deliveryFee: 1_000, total: 12_000, zone: "rivers" as const },
    clerkUserId: null,
    idempotencyKey: null,
    ...overrides,
  };
}

const createdReferences: string[] = [];

async function trackedCreate(input = orderInput()) {
  const result = await createOrder(input);
  createdReferences.push(result.order.reference);
  return result;
}

suite("database integration", () => {
  let db: ReturnType<typeof getDb>;

  before(async () => {
    db = getDb();
    assert.equal(await pingDatabase(), true, "database should be reachable");
  });

  after(async () => {
    // Clean up only the rows this suite created.
    for (const reference of createdReferences) {
      await db.execute(sql`delete from orders where reference = ${reference}`);
    }
  });

  it("is reachable (ping)", async () => {
    assert.equal(await pingDatabase(), true);
  });

  it("CREATE: stores an order and its lines together", async () => {
    const { order, created } = await trackedCreate();

    assert.equal(created, true);
    assert.equal(order.lines.length, 2);
    assert.equal(order.pricing.total, 12_000);
    assert.equal(order.pricing.zone, "rivers");
    assert.equal(order.status, "received");
    assert.equal(order.customer.fullName, CUSTOMER.fullName);

    // The lines come back with the frozen names and prices.
    const burger = order.lines.find((line) => line.itemId === "classic-burger");
    assert.ok(burger);
    assert.equal(burger.unitPrice, 4_500);
    assert.equal(burger.quantity, 2);
  });

  it("READ: fetches an order by reference with its lines", async () => {
    const { order } = await trackedCreate();
    const found = await getOrderByReference(order.reference);

    assert.ok(found);
    assert.equal(found.reference, order.reference);
    assert.equal(found.lines.length, 2);
  });

  it("READ: returns null for an unknown reference", async () => {
    assert.equal(await getOrderByReference("JG-NOPE00"), null);
  });

  it("UPDATE: changes an order status and persists it", async () => {
    const { order } = await trackedCreate();
    const updated = await updateOrderStatus(order.reference, "preparing");

    assert.ok(updated);
    assert.equal(updated.status, "preparing");

    const reread = await getOrderByReference(order.reference);
    assert.equal(reread?.status, "preparing");
  });

  it("UPDATE: returns null when the order does not exist", async () => {
    assert.equal(await updateOrderStatus("JG-MISSING", "delivered"), null);
  });

  it("LIST: returns orders newest first and respects the status filter", async () => {
    const { order } = await trackedCreate();
    await updateOrderStatus(order.reference, "confirmed");

    const confirmed = await listOrders({ status: "confirmed", limit: 50 });
    assert.ok(confirmed.some((entry) => entry.reference === order.reference));
    assert.ok(confirmed.every((entry) => entry.status === "confirmed"));
  });

  it("COUNT: counts orders, optionally by status", async () => {
    const before = await countOrders();
    await trackedCreate();
    const after = await countOrders();
    assert.equal(after, before + 1);
  });

  it("IDEMPOTENCY: a repeated key returns the same order, not a duplicate", async () => {
    const key = `test-${createOrderReference()}`;
    const first = await createOrder(orderInput({ idempotencyKey: key }));
    createdReferences.push(first.order.reference);

    const countBefore = await countOrders();

    const second = await createOrder(
      orderInput({ idempotencyKey: key, id: "different-id", reference: "JG-OTHER1" }),
    );
    createdReferences.push(second.order.reference);

    assert.equal(second.created, false);
    assert.equal(second.order.reference, first.order.reference);
    assert.equal(await countOrders(), countBefore, "no duplicate row should be created");
  });

  it("CONSTRAINT: rejects an order whose total does not equal subtotal + fee", async () => {
    await assert.rejects(
      () =>
        createOrder(
          orderInput({ pricing: { subtotal: 1_000, deliveryFee: 1_000, total: 99_999, zone: "rivers" } }),
        ),
      (error: unknown) => error instanceof OrderRepositoryError,
    );
  });

  it("CONSTRAINT: rejects an order line with a non-positive quantity", async () => {
    await assert.rejects(
      () =>
        createOrder(
          orderInput({
            lines: [{ itemId: "chips", name: "Chips", unitPrice: 2_000, quantity: 0 }],
          }),
        ),
      (error: unknown) => error instanceof OrderRepositoryError,
    );
  });

  it("REFERENTIAL INTEGRITY: deleting an order removes its lines (cascade)", async () => {
    const { order } = await trackedCreate();

    const lineCountBefore = await db.execute(
      sql`select count(*)::int as value from order_items where order_id = ${order.id}`,
    );
    assert.equal((lineCountBefore[0] as { value: number }).value, 2);

    await db.execute(sql`delete from orders where id = ${order.id}`);

    const lineCountAfter = await db.execute(
      sql`select count(*)::int as value from order_items where order_id = ${order.id}`,
    );
    assert.equal((lineCountAfter[0] as { value: number }).value, 0);
  });

  it("AUDIT: records an administrator action", async () => {
    await recordAudit({
      actorUserId: "user_test_123",
      action: "list",
      entity: "order",
      entityId: null,
      details: { note: "integration test" },
    });

    const rows = await db.execute(
      sql`select count(*)::int as value from ${schema.auditLog} where actor_user_id = 'user_test_123'`,
    );
    assert.ok((rows[0] as { value: number }).value >= 1);

    await db.execute(sql`delete from audit_log where actor_user_id = 'user_test_123'`);
  });
});
