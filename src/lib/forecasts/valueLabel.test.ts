// The forecast estimate band, built on the shared money formatter (lib/money.ts).

import { describe, expect, it } from "vitest";
import { valueLabel } from "./engine";

describe("valueLabel", () => {
  it("writes a band in compact figures", () => {
    expect(valueLabel(5000000, 10000000)).toBe("$5M to $10M");
    expect(valueLabel(250000, 1000000)).toBe("$250K to $1M");
  });

  it("writes a high end alone as 'Up to'", () => {
    expect(valueLabel(null, 5000000)).toBe("Up to $5M");
    expect(valueLabel(0, 5000000)).toBe("Up to $5M");
  });

  it("writes one figure once when both ends agree", () => {
    expect(valueLabel(2000000, 2000000)).toBe("$2M");
  });

  it("writes a low end alone as a floor, never as one exact figure", () => {
    expect(valueLabel(100000000, null)).toBe("$100M or more");
    expect(valueLabel(1000000000, null)).toBe("$1B or more");
  });

  it("reads the $100B placeholder as no maximum", () => {
    expect(valueLabel(100000000, 100000000000)).toBe("$100M or more");
    expect(valueLabel(null, 100000000000)).toBeNull();
  });

  it("writes nothing when the buyer gave no estimate", () => {
    expect(valueLabel(null, null)).toBeNull();
  });
});
