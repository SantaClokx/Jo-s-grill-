import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculatePricing,
  DELIVERY_FEES,
  getDeliveryFee,
  isNigerianState,
  NIGERIAN_STATES,
  resolveDeliveryZone,
} from "../src/lib/delivery.ts";

describe("delivery fee rules", () => {
  it("charges ₦1,000 within Rivers State", () => {
    assert.equal(getDeliveryFee("Rivers"), 1_000);
    assert.equal(getDeliveryFee("rivers"), 1_000);
    assert.equal(getDeliveryFee("  Rivers  "), 1_000);
  });

  it("charges ₦5,000 outside Rivers State", () => {
    assert.equal(getDeliveryFee("Lagos"), 5_000);
    assert.equal(getDeliveryFee("Abuja"), 5_000);
    assert.equal(getDeliveryFee("FCT - Abuja"), 5_000);
    assert.equal(getDeliveryFee("Kano"), 5_000);
  });

  it("treats an unknown or empty state as outside Rivers State", () => {
    assert.equal(getDeliveryFee(""), 5_000);
    assert.equal(getDeliveryFee("Somewhere Else"), 5_000);
  });

  it("exposes the canonical fee table", () => {
    assert.equal(DELIVERY_FEES.rivers, 1_000);
    assert.equal(DELIVERY_FEES.outside, 5_000);
  });
});

describe("resolveDeliveryZone", () => {
  it("maps Rivers State to the rivers zone", () => {
    assert.equal(resolveDeliveryZone("Rivers"), "rivers");
  });

  it("maps every other Nigerian state to the outside zone", () => {
    for (const state of NIGERIAN_STATES) {
      const expected = state === "Rivers" ? "rivers" : "outside";
      assert.equal(resolveDeliveryZone(state), expected, `state: ${state}`);
    }
  });
});

describe("calculatePricing", () => {
  it("adds the Rivers delivery fee to the subtotal", () => {
    assert.deepEqual(calculatePricing(11_000, "Rivers"), {
      subtotal: 11_000,
      deliveryFee: 1_000,
      total: 12_000,
      zone: "rivers",
    });
  });

  it("adds the outside-Rivers fee to the subtotal", () => {
    assert.deepEqual(calculatePricing(11_000, "Lagos"), {
      subtotal: 11_000,
      deliveryFee: 5_000,
      total: 16_000,
      zone: "outside",
    });
  });

  it("is a pure function of subtotal and state", () => {
    const first = calculatePricing(4_500, "Rivers");
    const second = calculatePricing(4_500, "Rivers");
    assert.deepEqual(first, second);
  });
});

describe("isNigerianState", () => {
  it("accepts known states case-insensitively", () => {
    assert.equal(isNigerianState("rivers"), true);
    assert.equal(isNigerianState("LAGOS"), true);
  });

  it("rejects unknown states", () => {
    assert.equal(isNigerianState("Atlantis"), false);
    assert.equal(isNigerianState(""), false);
  });
});
