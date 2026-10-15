import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { getMenuItem, MENU_ITEMS } from "../src/lib/menu.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The prices and names below are the six items confirmed in the original
 * JO'S Grill source material. If one of these changes, the change must come
 * from JO'S Grill, not from a guess.
 */
const VERIFIED_SOURCE_ITEMS = [
  { id: "classic-burger", name: "JO'S Classic Burger", price: 4_500 },
  { id: "fish-chips", name: "Fish & Chips", price: 5_500 },
  { id: "grilled-fish", name: "Grilled Fish", price: 6_500 },
  { id: "loaded-sausage-roll", name: "Loaded Sausage Roll", price: 2_500 },
  { id: "chicken-chips", name: "Chicken & Chips", price: 5_000 },
  { id: "soft-drink", name: "Chilled Soft Drink", price: 1_000 },
];

describe("menu catalogue", () => {
  it("keeps every source-verified item with its original name and price", () => {
    for (const expected of VERIFIED_SOURCE_ITEMS) {
      const item = getMenuItem(expected.id);
      assert.ok(item, `missing item: ${expected.id}`);
      assert.equal(item.name, expected.name, `name for ${expected.id}`);
      assert.equal(item.price, expected.price, `price for ${expected.id}`);
    }
  });

  it("gives every item a positive integer Naira price", () => {
    for (const item of MENU_ITEMS) {
      assert.ok(Number.isInteger(item.price), `${item.id} price must be an integer`);
      assert.ok(item.price > 0, `${item.id} price must be positive`);
    }
  });

  it("uses unique ids and image paths", () => {
    const ids = MENU_ITEMS.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate item id");

    const images = MENU_ITEMS.map((item) => item.image);
    assert.equal(new Set(images).size, images.length, "duplicate image path");
  });

  it("points every image at a file under /menu/", () => {
    for (const item of MENU_ITEMS) {
      assert.match(item.image, /^\/menu\/[a-z0-9-]+\.svg$/, `image for ${item.id}`);
    }
  });

  it("resolves every image path to a file that actually exists", () => {
    for (const item of MENU_ITEMS) {
      const filePath = path.join(projectRoot, "public", item.image);
      assert.ok(existsSync(filePath), `missing image file for ${item.id}: ${item.image}`);
    }
  });
});
