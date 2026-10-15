import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { addLine, countItems, removeLine, setQuantity, viewCart } from "../src/lib/cart.ts";
import { MENU_ITEMS } from "../src/lib/menu.ts";
import type { CartLine } from "../src/types/index.ts";

const burger = MENU_ITEMS.find((item) => item.id === "classic-burger")!;
const chips = MENU_ITEMS.find((item) => item.id === "chips")!;

describe("cart operations", () => {
  it("adds a new line", () => {
    const lines = addLine([], burger.id);
    assert.deepEqual(lines, [{ itemId: burger.id, quantity: 1 }]);
  });

  it("increments an existing line instead of duplicating it", () => {
    const lines = addLine(addLine([], burger.id), burger.id, 2);
    assert.deepEqual(lines, [{ itemId: burger.id, quantity: 3 }]);
  });

  it("ignores non-positive additions", () => {
    assert.deepEqual(addLine([], burger.id, 0), []);
    assert.deepEqual(addLine([], burger.id, -1), []);
  });

  it("caps a single line at 20", () => {
    const lines = addLine([], burger.id, 50);
    assert.equal(lines[0].quantity, 20);
  });

  it("sets an exact quantity", () => {
    const lines = setQuantity([{ itemId: burger.id, quantity: 1 }], burger.id, 5);
    assert.equal(lines[0].quantity, 5);
  });

  it("removes a line when quantity drops to zero or below", () => {
    const lines = setQuantity([{ itemId: burger.id, quantity: 2 }], burger.id, 0);
    assert.deepEqual(lines, []);
  });

  it("removes a line explicitly", () => {
    assert.deepEqual(removeLine([{ itemId: burger.id, quantity: 2 }], burger.id), []);
  });
});

describe("cart views and totals", () => {
  it("joins lines to the catalogue and computes line totals", () => {
    const lines: CartLine[] = [
      { itemId: burger.id, quantity: 2 },
      { itemId: chips.id, quantity: 1 },
    ];
    const view = viewCart(lines, MENU_ITEMS);
    assert.equal(view.length, 2);
    assert.equal(view[0].lineTotal, burger.price * 2);
    assert.equal(view[1].lineTotal, chips.price);
  });

  it("drops lines whose item is not in the catalogue", () => {
    const view = viewCart([{ itemId: "does-not-exist", quantity: 3 }], MENU_ITEMS);
    assert.deepEqual(view, []);
  });

  it("counts total item quantity across lines", () => {
    const lines: CartLine[] = [
      { itemId: burger.id, quantity: 2 },
      { itemId: chips.id, quantity: 3 },
    ];
    assert.equal(countItems(lines), 5);
  });

  it("computes the subtotal from catalogue prices, not client-supplied values", () => {
    const lines: CartLine[] = [{ itemId: burger.id, quantity: 2 }];
    const subtotal = viewCart(lines, MENU_ITEMS).reduce((sum, line) => sum + line.lineTotal, 0);
    assert.equal(subtotal, burger.price * 2);
  });
});
