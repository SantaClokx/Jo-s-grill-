import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ORDER_STATUSES,
  allowedNextStatuses,
  canTransition,
  describeTransitionError,
  isOrderStatus,
} from "../src/lib/orders/status.ts";

/**
 * Order status transitions. Pure logic, so these exercise the exact rules the
 * admin API applies - no mocks and no database.
 */

describe("order status validation", () => {
  it("accepts every known status", () => {
    for (const status of ORDER_STATUSES) assert.equal(isOrderStatus(status), true);
  });

  it("rejects anything else", () => {
    for (const bad of ["", "shipped", "RECEIVED", " received", 1, null, undefined, {}]) {
      assert.equal(isOrderStatus(bad), false, `should reject ${JSON.stringify(bad)}`);
    }
  });
});

describe("allowed transitions", () => {
  it("walks the order forward one step at a time", () => {
    assert.equal(canTransition("received", "confirmed"), true);
    assert.equal(canTransition("confirmed", "preparing"), true);
    assert.equal(canTransition("preparing", "delivered"), true);
  });

  it("allows cancellation from any non-terminal state", () => {
    assert.equal(canTransition("received", "cancelled"), true);
    assert.equal(canTransition("confirmed", "cancelled"), true);
    assert.equal(canTransition("preparing", "cancelled"), true);
  });

  it("refuses to skip ahead", () => {
    assert.equal(canTransition("received", "delivered"), false);
    assert.equal(canTransition("received", "preparing"), false);
    assert.equal(canTransition("confirmed", "delivered"), false);
  });

  it("treats a re-applied status as a harmless no-op", () => {
    for (const status of ORDER_STATUSES) assert.equal(canTransition(status, status), true);
  });

  it("treats delivered and cancelled as terminal", () => {
    for (const terminal of ["delivered", "cancelled"] as const) {
      assert.deepEqual(allowedNextStatuses(terminal), []);
      // The only permitted "transition" from a terminal state is the no-op.
      for (const target of ORDER_STATUSES) {
        assert.equal(
          canTransition(terminal, target),
          target === terminal,
          `${terminal} -> ${target}`,
        );
      }
    }
  });
});

describe("transition error messages", () => {
  it("names the allowed next steps without leaking internals", () => {
    const message = describeTransitionError("received", "delivered");
    assert.match(message, /received/);
    assert.match(message, /confirmed/);
    assert.equal(/Error|stack|undefined|null/.test(message), false);
  });

  it("explains a terminal state without dangling grammar", () => {
    const message = describeTransitionError("delivered", "confirmed");
    assert.match(message, /cannot be changed/);
  });
});
