import { NextResponse } from "next/server";

import { calculatePricing } from "@/lib/delivery";
import { getMenuItem } from "@/lib/menu";
import { createOrderId, createOrderReference } from "@/lib/order-id";
import { persistValidatedOrder } from "@/lib/orders/persist";
import { isNonEmptyString } from "@/lib/sanitise";
import { validateCheckout } from "@/lib/validation";
import type { CartLine, DeliveryDetails, Order } from "@/types";

export interface CreateOrderResponse {
  order: Order;
  /**
   * Whether this order has been durably stored. `false` whenever the database
   * is not configured or the write failed - the client must not tell the
   * customer their order is saved unless this is `true`.
   */
  persisted: boolean;
  /** Whether the order was delivered to the restaurant's order channel. */
  deliveredToRestaurant: boolean;
  /** Customer-safe status message describing exactly what happened. */
  message: string;
}

/** An idempotency key is optional and only ever used as a string. */
function readIdempotencyKey(record: Record<string, unknown>): string | null {
  const value = record.idempotencyKey;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.slice(0, 64);
}

function parseBody(body: unknown): { customer: DeliveryDetails; lines: CartLine[] } | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  const rawCustomer = record.customer;
  if (typeof rawCustomer !== "object" || rawCustomer === null) return null;
  const c = rawCustomer as Record<string, unknown>;

  if (
    !isNonEmptyString(c.fullName) ||
    !isNonEmptyString(c.phone) ||
    !isNonEmptyString(c.address) ||
    !isNonEmptyString(c.city) ||
    !isNonEmptyString(c.state)
  ) {
    return null;
  }

  const customer: DeliveryDetails = {
    fullName: c.fullName.trim().slice(0, 120),
    phone: c.phone.trim().slice(0, 30),
    address: c.address.trim().slice(0, 300),
    city: c.city.trim().slice(0, 80),
    state: c.state.trim().slice(0, 60),
    notes: typeof c.notes === "string" ? c.notes.trim().slice(0, 300) : undefined,
  };

  if (!Array.isArray(record.lines)) return null;

  const lines: CartLine[] = [];
  for (const entry of record.lines) {
    if (typeof entry !== "object" || entry === null) return null;
    const line = entry as Record<string, unknown>;
    if (!isNonEmptyString(line.itemId)) return null;
    if (typeof line.quantity !== "number" || !Number.isFinite(line.quantity)) return null;
    const quantity = Math.floor(line.quantity);
    if (quantity < 1 || quantity > 20) return null;
    lines.push({ itemId: line.itemId, quantity });
  }

  if (lines.length === 0) return null;
  return { customer, lines };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid order payload. Check your details and cart and try again." },
      { status: 400 },
    );
  }

  const idempotencyKey = readIdempotencyKey(body as Record<string, unknown>);

  // Re-price on the server from the catalogue so a tampered client cannot
  // dictate prices. Unknown items are rejected rather than silently ignored.
  const lines: Order["lines"] = [];
  for (const line of parsed.lines) {
    const item = getMenuItem(line.itemId);
    if (!item) {
      return NextResponse.json(
        { error: `Unknown menu item: ${line.itemId}` },
        { status: 400 },
      );
    }
    if (!item.available) {
      return NextResponse.json(
        { error: `${item.name} is currently unavailable.` },
        { status: 409 },
      );
    }
    lines.push({
      itemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity: line.quantity,
    });
  }

  const errors = validateCheckout(parsed.customer, parsed.lines);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Invalid delivery details.", errors }, { status: 400 });
  }

  const subtotal = lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
  const pricing = calculatePricing(subtotal, parsed.customer.state);

  const reference = createOrderReference();
  const order: Order = {
    id: createOrderId(reference),
    reference,
    createdAt: new Date().toISOString(),
    status: "received",
    customer: parsed.customer,
    lines,
    pricing,
  };

  // Persist when a database is configured. `persistValidatedOrder` returns an
  // honest `persisted` flag: it is true only after the write actually commits.
  // If storage is unavailable the order is still valid and priced, and the
  // customer is directed to WhatsApp, so checkout never blocks on the database.
  const { order: finalOrder, persisted, notice } = await persistValidatedOrder(
    order,
    idempotencyKey,
  );

  const response: CreateOrderResponse = {
    order: finalOrder,
    persisted,
    deliveredToRestaurant: false,
    message:
      notice ??
      "Your order has been received and stored. Please send it on WhatsApp so the restaurant can start cooking.",
  };

  return NextResponse.json(response, { status: 201 });
}
