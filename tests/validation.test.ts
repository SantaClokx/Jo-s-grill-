import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sanitiseCartLines, safeParseJson } from "../src/lib/sanitise.ts";
import {
  hasErrors,
  isValidNigerianPhone,
  normalisePhone,
  validateCheckout,
} from "../src/lib/validation.ts";
import type { CartLine, DeliveryDetails } from "../src/types/index.ts";

const VALID_CUSTOMER: DeliveryDetails = {
  fullName: "Chinedu Okafor",
  phone: "0803 123 4567",
  address: "12 Old Refinery Road, near the market",
  city: "Elelenwo",
  state: "Rivers",
};

const VALID_LINES: CartLine[] = [{ itemId: "classic-burger", quantity: 2 }];

describe("validateCheckout", () => {
  it("accepts complete, valid details", () => {
    const errors = validateCheckout(VALID_CUSTOMER, VALID_LINES);
    assert.equal(hasErrors(errors), false);
  });

  it("requires a full name", () => {
    const errors = validateCheckout({ ...VALID_CUSTOMER, fullName: "A" }, VALID_LINES);
    assert.ok(errors.fullName);
  });

  it("requires a phone number", () => {
    const errors = validateCheckout({ ...VALID_CUSTOMER, phone: "" }, VALID_LINES);
    assert.ok(errors.phone);
  });

  it("rejects an invalid phone number", () => {
    const errors = validateCheckout({ ...VALID_CUSTOMER, phone: "12345" }, VALID_LINES);
    assert.ok(errors.phone);
  });

  it("requires an address, city and state", () => {
    const errors = validateCheckout(
      { ...VALID_CUSTOMER, address: "", city: "", state: "" },
      VALID_LINES,
    );
    assert.ok(errors.address);
    assert.ok(errors.city);
    assert.ok(errors.state);
  });

  it("rejects a state that is not a Nigerian state", () => {
    const errors = validateCheckout({ ...VALID_CUSTOMER, state: "Atlantis" }, VALID_LINES);
    assert.ok(errors.state);
  });

  it("rejects an empty cart", () => {
    const errors = validateCheckout(VALID_CUSTOMER, []);
    assert.ok(errors.lines);
  });
});

describe("Nigerian phone validation", () => {
  it("accepts common local and international formats", () => {
    for (const phone of [
      "08031234567",
      "0803 123 4567",
      "0803-123-4567",
      "+2348031234567",
      "2348031234567",
      "+234 803 123 4567",
    ]) {
      assert.equal(isValidNigerianPhone(phone), true, phone);
    }
  });

  it("rejects malformed numbers", () => {
    for (const phone of ["", "12345", "0803123456", "080312345678", "abcdefghijk"]) {
      assert.equal(isValidNigerianPhone(phone), false, phone);
    }
  });

  it("strips separators when normalising", () => {
    assert.equal(normalisePhone("+234 (803) 123-4567"), "+2348031234567");
  });
});

describe("sanitiseCartLines", () => {
  it("keeps valid entries and clamps quantity", () => {
    const result = sanitiseCartLines([
      { itemId: "chips", quantity: 2 },
      { itemId: "chips", quantity: 99 },
    ]);
    assert.deepEqual(result, [
      { itemId: "chips", quantity: 2 },
      { itemId: "chips", quantity: 20 },
    ]);
  });

  it("discards malformed entries", () => {
    const result = sanitiseCartLines([
      null,
      "nope",
      { itemId: "", quantity: 1 },
      { itemId: "ok", quantity: 0 },
      { itemId: "ok", quantity: -3 },
      { itemId: "good", quantity: 1 },
    ]);
    assert.deepEqual(result, [{ itemId: "good", quantity: 1 }]);
  });

  it("returns an empty array for non-array input", () => {
    assert.deepEqual(sanitiseCartLines("not-an-array"), []);
    assert.deepEqual(sanitiseCartLines(null), []);
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    assert.deepEqual(safeParseJson('[{"a":1}]', []), [{ a: 1 }]);
  });

  it("falls back on invalid JSON instead of throwing", () => {
    assert.deepEqual(safeParseJson("{broken", ["fallback"]), ["fallback"]);
    assert.deepEqual(safeParseJson(null, "fallback"), "fallback");
  });
});
