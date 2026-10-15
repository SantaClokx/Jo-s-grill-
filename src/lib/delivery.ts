import type { DeliveryZone, OrderPricing } from "@/types";

/** Canonical Rivers State label used by the restaurant. */
export const RIVERS_STATE = "Rivers";

export const DELIVERY_FEES: Record<DeliveryZone, number> = {
  rivers: 1_000,
  outside: 5_000,
};

/**
 * Nigerian states + FCT. Used to populate the checkout state selector and to
 * validate that a customer picked a real delivery destination.
 */
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

/** Normalise free-text state input for comparison (" rivers " -> "rivers"). */
export function normaliseState(state: string): string {
  return state.trim().toLowerCase();
}

export function isNigerianState(state: string): state is NigerianState {
  const normalised = normaliseState(state);
  return NIGERIAN_STATES.some((candidate) => normaliseState(candidate) === normalised);
}

/**
 * Determine the delivery zone from a state. Anything that is not Rivers State
 * is treated as "outside Rivers State" and attracts the higher fee.
 */
export function resolveDeliveryZone(state: string): DeliveryZone {
  return normaliseState(state) === normaliseState(RIVERS_STATE) ? "rivers" : "outside";
}

export function getDeliveryFee(state: string): number {
  return DELIVERY_FEES[resolveDeliveryZone(state)];
}

/**
 * Single source of truth for order totals. Kept pure so it can be reused by
 * the cart UI, the checkout summary, and the order API without drift.
 */
export function calculatePricing(subtotal: number, state: string): OrderPricing {
  const zone = resolveDeliveryZone(state);
  const deliveryFee = DELIVERY_FEES[zone];
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    zone,
  };
}
