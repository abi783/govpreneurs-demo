// Every call that ENDPOINTS.md lists for the hunter area has a handler, and each
// handler answers with the shape the page reads. Nothing in the rail can hit a
// "Demo has no handler" error.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "../api/hunter";

function hunterCalls(): { method: string; path: string }[] {
  const md = fs.readFileSync(path.resolve(__dirname, "../api/ENDPOINTS.md"), "utf8");
  const start = md.indexOf("\n## hunter\n");
  const end = md.indexOf("\n## opportunity\n");
  const section = md.slice(start, end);
  return [...section.matchAll(/^### (GET|POST|PUT|PATCH|DELETE) (\S+)/gm)].map((m) => ({
    method: m[1],
    path: m[2],
  }));
}

describe("hunter area handlers", () => {
  it("covers every call in ENDPOINTS.md", () => {
    const calls = hunterCalls();
    expect(calls.length).toBeGreaterThan(30);
    const have = new Set(routes.map((r) => `${r.method} ${r.path}`));
    const missing = calls.filter((c) => !have.has(`${c.method} ${c.path}`));
    expect(missing).toEqual([]);
  });

  it("registers each method and path once", () => {
    const keys = routes.map((r) => `${r.method} ${r.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
