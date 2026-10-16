// The shared compact money formatter, and the feed's value estimate built on it.

import { describe, expect, it } from "vitest";
import { money, valueEstimate } from "./money";

describe("money", () => {
  it.each([
    [950, "$950"],
    [999.6, "$1K"],
    [1000, "$1K"],
    [250000, "$250K"],
    [225200, "$225.2K"],
    [1000000, "$1M"],
    [1500000, "$1.5M"],
    [4900000, "$4.9M"],
    [9999999, "$10M"],
    [999950, "$1M"],
    [999999999, "$1B"],
    [4000000000, "$4B"],
    [100000000000, "$100B"],
  ])("writes %d as %s", (n, text) => {
    expect(money(n)).toBe(text);
  });

  it("never writes a trailing .0", () => {
    expect(money(2000000)).toBe("$2M");
    expect(money(2000000)).not.toContain(".0");
  });
});

describe("valueEstimate", () => {
  it("writes both ends with an en dash", () => {
    expect(valueEstimate(5000000, 10000000)).toBe("$5M–$10M");
    expect(valueEstimate("250000", "1000000")).toBe("$250K–$1M");
  });

  it("writes one figure when both ends agree", () => {
    expect(valueEstimate(2000000, 2000000)).toBe("$2M");
  });

  it("writes a low end alone as a floor", () => {
    expect(valueEstimate(100000000, null)).toBe("$100M or more");
  });

  it("writes a high end alone as 'Up to'", () => {
    expect(valueEstimate(null, 5000000)).toBe("Up to $5M");
  });

  it("reads the $100B placeholder as no high end", () => {
    expect(valueEstimate(100000000, 100000000000)).toBe("$100M or more");
    expect(valueEstimate(null, "100000000000")).toBeNull();
  });

  it("reads a zero or blank end as no end", () => {
    expect(valueEstimate(0, 500000)).toBe("Up to $500K");
    expect(valueEstimate("0.00", "")).toBeNull();
    expect(valueEstimate(750000, 0)).toBe("$750K or more");
    expect(valueEstimate(null, undefined)).toBeNull();
  });
});
