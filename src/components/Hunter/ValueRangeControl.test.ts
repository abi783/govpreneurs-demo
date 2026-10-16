import { describe, it, expect } from "vitest";
import { parseValueShorthand, bucketBounds, VALUE_BUCKET_IDS } from "./ValueRangeControl";

describe("parseValueShorthand", () => {
  it("parses 'k' shorthand", () => {
    expect(parseValueShorthand("250k")).toBe(250_000);
  });

  it("parses 'm' shorthand", () => {
    expect(parseValueShorthand("1.5m")).toBe(1_500_000);
  });

  it("parses a plain number", () => {
    expect(parseValueShorthand("1000")).toBe(1000);
  });

  it("parses decimals with 'k'", () => {
    expect(parseValueShorthand("2.5k")).toBe(2500);
  });

  it("strips $ and commas", () => {
    expect(parseValueShorthand("$250,000")).toBe(250_000);
  });

  it("returns null for empty string", () => {
    expect(parseValueShorthand("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseValueShorthand("   ")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseValueShorthand("abc")).toBeNull();
    expect(parseValueShorthand("$$$")).toBeNull();
    expect(parseValueShorthand("250x")).toBeNull();
  });

  it("returns null for negative input (not matched by the shorthand pattern)", () => {
    expect(parseValueShorthand("-250k")).toBeNull();
  });

  it("is case-insensitive for the k/m suffix", () => {
    expect(parseValueShorthand("250K")).toBe(250_000);
    expect(parseValueShorthand("1.5M")).toBe(1_500_000);
  });
});

describe("bucketBounds", () => {
  it("maps under_25k", () => {
    expect(bucketBounds("under_25k")).toEqual({ min: 0, max: 25_000 });
  });

  it("maps 25k_100k", () => {
    expect(bucketBounds("25k_100k")).toEqual({ min: 25_000, max: 100_000 });
  });

  it("maps 100k_500k", () => {
    expect(bucketBounds("100k_500k")).toEqual({ min: 100_000, max: 500_000 });
  });

  it("maps 500k_1m", () => {
    expect(bucketBounds("500k_1m")).toEqual({ min: 500_000, max: 1_000_000 });
  });

  it("maps 1m_5m", () => {
    expect(bucketBounds("1m_5m")).toEqual({ min: 1_000_000, max: 5_000_000 });
  });

  it("maps 5m_plus with max: null (no upper bound — consistent with valueRange's existing 'no max' representation)", () => {
    expect(bucketBounds("5m_plus")).toEqual({ min: 5_000_000, max: null });
  });

  it("covers exactly the 6 server-defined value buckets", () => {
    expect(VALUE_BUCKET_IDS).toEqual([
      "under_25k",
      "25k_100k",
      "100k_500k",
      "500k_1m",
      "1m_5m",
      "5m_plus",
    ]);
  });
});
