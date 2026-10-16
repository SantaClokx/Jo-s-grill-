import { auth } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/auth/config.ts";
import { isDatabaseConfigured } from "@/lib/db/config.ts";
import { createOrder, OrderRepositoryError } from "@/lib/db/orders.ts";
import type { Order } from "@/types";

/**
 * Persisting a validated order.
 *
 * This is the only place the order API talks to the database. It ties together
 * three things that must not be confused with one another:
 *
 *   1. The order payload, already validated and re-priced by the API layer from
 *      the server-side catalogue.
 *   2. The database, which may or may not be configured.
 *   3. Clerk, which may or may not be configured.
 *
 * The result is always honest. `persisted` is true only after a successful
 * write, and `notice` explains any degradation so the customer is never told an
 * order was saved when it was not.
 */

export interface PersistResult {
  /** The order as it now stands - from the database if written, else as given. */
  order: Order;
  /** True only when the order is durably stored. */
  persisted: boolean;
  /** A customer-safe explanation when `persisted` is false. */
  notice?: string;
}

/**
 * Resolve the signed-in Clerk user id, server-side.
 *
 * The browser never supplies an identity: any user id in the request body is
 * ignored. If Clerk is unconfigured, or the request is anonymous, the result is
 * null. Public checkout does not require sign-in, so a null identity is normal
 * and simply means the order is not linked to an account.
 */
async function resolveClerkUserId(): Promise<string | null> {
  if (!isClerkConfigured()) return null;
  try {
    const session = await auth();
    return session.userId ?? null;
  } catch {
    // A session that cannot be read is treated as anonymous, never as an error
    // that blocks checkout.
    return null;
  }
}

export async function persistValidatedOrder(
  order: Order,
  idempotencyKey?: string | null,
): Promise<PersistResult> {
  if (!isDatabaseConfigured()) {
    return {
      order,
      persisted: false,
      notice:
        "Order validated and priced. It has not been stored on a server yet - complete your order using the WhatsApp button.",
    };
  }

  const clerkUserId = await resolveClerkUserId();

  try {
    const { order: stored, created } = await createOrder({
      id: order.id,
      reference: order.reference,
      customer: order.customer,
      lines: order.lines,
      pricing: order.pricing,
      clerkUserId,
      idempotencyKey: idempotencyKey ?? null,
    });

    return {
      order: stored,
      persisted: true,
      notice: created
        ? undefined
        : "This order was already recorded - we have not created a duplicate.",
    };
  } catch (error) {
    const unavailable = error instanceof OrderRepositoryError && error.kind === "unavailable";

    // The order is still valid and correctly priced; only storage failed. The
    // customer can still complete it on WhatsApp, so this is not a hard error.
    return {
      order,
      persisted: false,
      notice: unavailable
        ? "We could not reach the order database just now. Your order has not been stored - please send it on WhatsApp so the restaurant receives it."
        : "Your order has not been stored on a server - please send it on WhatsApp so the restaurant receives it.",
    };
  }
}
