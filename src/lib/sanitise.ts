/** Safely parse a JSON value stored in localStorage, falling back on corruption. */
export function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Coerce an unknown value into a clean CartLine array. Guards against
 * hand-edited or stale localStorage payloads.
 */
export function sanitiseCartLines(value: unknown): Array<{ itemId: string; quantity: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const itemId = record.itemId;
    const quantity = record.quantity;
    if (typeof itemId !== "string" || itemId.trim() === "") return [];
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 1) return [];
    return [{ itemId, quantity: Math.min(Math.floor(quantity), 20) }];
  });
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
