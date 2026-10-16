import type { OrderStatus } from "@/types";

/**
 * Order status transitions.
 *
 * Pure data and pure functions only, so the rule can be unit tested directly and
 * shared by every caller. The admin API is the only place that applies it today,
 * but keeping it here means the rule cannot drift between callers.
 */

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "delivered",
  "cancelled",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * The statuses an order may move to from a given status.
 *
 * Terminal states have no onward transitions. Re-applying the current status is
 * treated as a no-op rather than a conflict, so a repeated request is harmless.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  received: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function allowedNextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from];
}

/**
 * Whether a transition is allowed.
 *
 * Allows a no-op (from === to) so an idempotent retry does not surface as an
 * error, and allows anything from the terminal set's empty lists otherwise.
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

/**
 * Describe why a transition is not allowed, for a customer-safe 409 message.
 *
 * Deliberately states the current status and the allowed next steps, never
 * internal state.
 */
export function describeTransitionError(from: OrderStatus, to: OrderStatus): string {
  const allowed = TRANSITIONS[from];
  if (allowed.length === 0) {
    return `An order that is already ${from} cannot be changed.`;
  }
  return `An order that is ${from} can only move to: ${allowed.join(", ")}. Not ${to}.`;
}
