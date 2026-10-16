// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hasMetGrant, markMetGrant } from "./metGrant";

/** A small in-memory Storage, for runtimes whose own `localStorage` global hides jsdom's. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k: string) => data.get(k) ?? null,
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
  };
}

describe("metGrant — per (member, opportunity) persistence", () => {
  beforeEach(() => {
    if (!window.localStorage) {
      Object.defineProperty(window, "localStorage", { value: memoryStorage(), configurable: true });
    }
    window.localStorage.clear();
  });

  it("starts unmet for a fresh opportunity", () => {
    expect(hasMetGrant("loc-1", "opp-a")).toBe(false);
  });

  it("marking one opportunity met doesn't carry over to another for the same member", () => {
    markMetGrant("loc-1", "opp-a");
    expect(hasMetGrant("loc-1", "opp-a")).toBe(true);
    expect(hasMetGrant("loc-1", "opp-b")).toBe(false);
  });

  it("marking met for one member doesn't carry over to another member on the same opportunity", () => {
    markMetGrant("loc-1", "opp-a");
    expect(hasMetGrant("loc-2", "opp-a")).toBe(false);
  });

  it("is a no-op without both a locationId and an oppKey", () => {
    markMetGrant(null, "opp-a");
    markMetGrant("loc-1", null);
    expect(hasMetGrant("loc-1", "opp-a")).toBe(false);
    expect(hasMetGrant(null, "opp-a")).toBe(false);
  });
});
