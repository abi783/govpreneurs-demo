// Every invented person must have one role. A contracting officer who is also
// a mentor on another page would make a sales call look careless.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });
}

describe("invented people", () => {
  it("each full name appears in only one demo area", () => {
    const areas = new Map<string, Set<string>>();
    for (const f of files("src/demo")) {
      // The Government Buyers page (explore) and the buyer contacts on the opportunity pages (grant) name the
      // same buyer staff on purpose, so those two count as one area.
      const folder = f.split("/").slice(0, 3).join("/");
      const area = folder === "src/demo/grant" || folder === "src/demo/explore" ? "buyer staff" : folder;
      const text = readFileSync(f, "utf8");
      // `name: "First Last"` and the buyer-page helpers `sblo("id", "First Last", ...)`. A rank in front of the name is allowed.
      const shapes = /(?:name: "|\b(?:sblo|co|spec|fpm)\("[^"]+", ")(?:(?:Maj|Capt|Lt|SFC|SSgt|MSgt|TSgt|Sgt|LCDR|LtCol|CW3|Dr)\.? )*([A-Z][a-z]+ [A-Z][a-z]+)"/g;
      for (const m of text.matchAll(shapes)) {
        if (!areas.has(m[1])) areas.set(m[1], new Set());
        areas.get(m[1])!.add(area);
      }
    }
    const shared = [...areas.entries()].filter(([, a]) => a.size > 1).map(([n, a]) => `${n}: ${[...a].join(", ")}`);
    expect(shared).toEqual([]);
  });
});
