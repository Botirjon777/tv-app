import { describe, it, expect } from "vitest";
import {
  isOrderStatus,
  NEXT_STATUS,
  ACTIVE_STATUSES,
  ORDER_STATUSES,
} from "./orders";

describe("isOrderStatus", () => {
  it("accepts every known status", () => {
    for (const status of ORDER_STATUSES) {
      expect(isOrderStatus(status)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isOrderStatus("SHIPPED")).toBe(false);
    expect(isOrderStatus("")).toBe(false);
  });
});

describe("NEXT_STATUS workflow", () => {
  it("advances PENDING -> PREPARING -> READY -> DELIVERED", () => {
    expect(NEXT_STATUS.PENDING).toBe("PREPARING");
    expect(NEXT_STATUS.PREPARING).toBe("READY");
    expect(NEXT_STATUS.READY).toBe("DELIVERED");
  });

  it("has no forward transition out of terminal states", () => {
    expect(NEXT_STATUS.DELIVERED).toBeUndefined();
    expect(NEXT_STATUS.CANCELLED).toBeUndefined();
  });
});

describe("ACTIVE_STATUSES", () => {
  it("are the kitchen-actionable statuses, in order", () => {
    expect(ACTIVE_STATUSES).toEqual(["PENDING", "PREPARING", "READY"]);
  });
});
