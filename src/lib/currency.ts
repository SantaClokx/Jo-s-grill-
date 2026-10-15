/**
 * Nigerian Naira (NGN) formatting helpers.
 * Prices are stored as whole naira (no kobo), which matches how the
 * restaurant quotes prices on its menu.
 */

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a whole-naira amount, e.g. 1000 -> "₦1,000". */
export function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError(`formatNaira expects a finite number, received: ${amount}`);
  }
  return nairaFormatter.format(amount);
}

/** Parse a user-entered price/quantity string into an integer, or null if invalid. */
export function parseNaira(value: string): number | null {
  const cleaned = value.replace(/[^\d]/g, "");
  if (cleaned === "") return null;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
