import type { CartLine, CartLineView, MenuItem } from "@/types";

const MAX_QUANTITY_PER_LINE = 20;

/** Add an item, or increase its quantity if it is already in the cart. */
export function addLine(lines: CartLine[], itemId: string, quantity = 1): CartLine[] {
  if (quantity <= 0) return lines;
  const existing = lines.find((line) => line.itemId === itemId);
  if (!existing) {
    return [...lines, { itemId, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) }];
  }
  return lines.map((line) =>
    line.itemId === itemId
      ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY_PER_LINE) }
      : line,
  );
}

/** Set an exact quantity. A quantity of zero (or less) removes the line. */
export function setQuantity(lines: CartLine[], itemId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return removeLine(lines, itemId);
  return lines.map((line) =>
    line.itemId === itemId
      ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) }
      : line,
  );
}

export function removeLine(lines: CartLine[], itemId: string): CartLine[] {
  return lines.filter((line) => line.itemId !== itemId);
}

/**
 * Join cart lines to the menu catalogue. Lines whose item no longer exists in
 * the catalogue are dropped so the UI never renders a dangling product.
 */
export function viewCart(lines: CartLine[], catalogue: MenuItem[]): CartLineView[] {
  return lines.flatMap((line) => {
    const item = catalogue.find((candidate) => candidate.id === line.itemId);
    if (!item) return [];
    return [{ item, quantity: line.quantity, lineTotal: item.price * line.quantity }];
  });
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function subtotal(lines: CartLine[], catalogue: MenuItem[]): number {
  return viewCart(lines, catalogue).reduce((total, line) => total + line.lineTotal, 0);
}
