import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatNaira, parseNaira } from "../src/lib/currency.ts";

describe("formatNaira", () => {
  it("formats whole naira with the Naira sign and thousands separators", () => {
    assert.equal(formatNaira(1000).replace(/\u00a0/g, " "), "₦1,000");
    assert.equal(formatNaira(4500).replace(/\u00a0/g, " "), "₦4,500");
    assert.equal(formatNaira(5000).replace(/\u00a0/g, " "), "₦5,000");
    assert.equal(formatNaira(0).replace(/\u00a0/g, " "), "₦0");
    assert.equal(formatNaira(1234567).replace(/\u00a0/g, " "), "₦1,234,567");
  });

  it("never renders decimal kobo for whole-naira prices", () => {
    assert.ok(!formatNaira(2500).includes(".00"));
  });

  it("throws on non-finite input rather than rendering NaN", () => {
    assert.throws(() => formatNaira(Number.NaN));
    assert.throws(() => formatNaira(Number.POSITIVE_INFINITY));
  });
});

describe("parseNaira", () => {
  it("parses digits from formatted currency strings", () => {
    assert.equal(parseNaira("₦1,000"), 1000);
    assert.equal(parseNaira("5000"), 5000);
  });

  it("returns null when there are no digits", () => {
    assert.equal(parseNaira(""), null);
    assert.equal(parseNaira("abc"), null);
  });
});
