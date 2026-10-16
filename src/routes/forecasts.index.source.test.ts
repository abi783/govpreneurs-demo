// The list page renders the server's rows and counts (ledger feature 8). The browser
// no longer ranks, filters or counts the whole list, so the route imports none of the
// engine's or the drawer's whole-list functions, and not the whole-list hook.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTE = resolve(process.cwd(), "src/routes/forecasts.index.tsx");

/** Every name the file imports, from every import statement. */
function importedNames(source: string): string[] {
  const names: string[] = [];
  const statement = /import\s+(?:type\s+)?([\s\S]*?)\s+from\s+["'][^"']+["']/g;
  for (const match of source.matchAll(statement)) {
    const clause = match[1];
    const braces = clause.match(/\{([\s\S]*)\}/);
    const named = braces ? braces[1].split(",") : [];
    const bare = clause.replace(/\{[\s\S]*\}/, "").split(",");
    for (const part of [...named, ...bare]) {
      const name = part
        .replace(/^\s*type\s+/, "")
        .split(/\s+as\s+/)[0]
        .trim();
      if (name) names.push(name);
    }
  }
  return names;
}

const FORBIDDEN = [
  "forYouForecasts",
  "allForecasts",
  "statusCounts",
  "sortForecasts",
  "matchesFilters",
  "byBestFit",
  "optionCount",
  "useForecasts",
];

describe("the forecast list route", () => {
  const source = readFileSync(ROUTE, "utf8");
  const names = importedNames(source);

  it("reads the imports it scans (the scan itself works)", () => {
    expect(names).toContain("useForecastList");
    expect(names).toContain("readFilterSearch");
  });

  it.each(FORBIDDEN)("imports no %s: the server ranks, filters and counts", (name) => {
    expect(names).not.toContain(name);
  });

  it("scans every import statement, including a multi-line one", () => {
    const sample = `import {\n  a,\n  type B,\n  c as d,\n} from "x";\nimport e from "y";`;
    expect(importedNames(sample)).toEqual(["a", "B", "c", "e"]);
  });
});
