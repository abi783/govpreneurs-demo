// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ALL_ROUTE_GROUPS } from "./index";

describe("demo API registry", () => {
  it("answers each method + path in exactly one place", () => {
    const seen = new Map<string, number>();
    for (const group of ALL_ROUTE_GROUPS) {
      for (const def of group) {
        const key = `${def.method} ${def.path.replace(/:[^/]+/g, ":param")}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
    }
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dupes).toEqual([]);
  });
});
