// Every kind of source shows up on My Business, and no part is only "You told us",
// for the member on stage. Run it once per member:
//   for m in caterer agency construction consulting it trucking janitorial; do DEMO_MEMBER=$m bunx vitest run src/demo/sc/business/sources.test.ts; done
import { describe, expect, it } from "vitest";
import { BEFORE_FIRST_CALL, catalogFor } from "@sc/lib/businessProfile/catalog";
import { buildSeed } from "./seed";

const seed = buildSeed();
const rows = seed.rows.map((r) => ({
  part: catalogFor(r.fieldKey)?.part ?? "?",
  field: r.fieldKey,
  state: r.state,
  origin: r.origin,
  source: r.provenance?.sourceLabel ?? "",
  status: r.state === "needs_review" ? "needs_review" : r.originKey === "member.confirmed" ? "approved" : "",
}));
const cards = seed.proposals.map((p) => ({
  part: catalogFor(p.fieldKey)?.part ?? "?",
  field: p.fieldKey,
  state: "proposal",
  origin: p.origin,
  source: p.provenance?.sourceLabel ?? "",
  status: "waiting",
}));
const all = [...rows, ...cards];
const has = (pred: (r: (typeof all)[number]) => boolean) => all.some(pred);

describe("My Business sources", () => {
  it("prints the seed table", () => {
    const line = (r: (typeof all)[number]) => [r.part, r.field, r.state, r.origin, r.source, r.status].join(" | ");
    process.stdout.write(`${all.map(line).join("\n")}\n`);
  });

  it("covers every case", () => {
    expect(has((r) => r.status === "waiting" && r.origin === "You told Sarah on your call" && r.source === "Your call with Sarah")).toBe(true);
    expect(has((r) => r.status === "approved" && r.source === "Your call with Sarah")).toBe(true);
    expect(has((r) => r.status === "waiting" && r.origin === "From what Hunter learned" && r.source === "Your chat with Hunter")).toBe(true);
    expect(has((r) => r.status === "approved" && r.source === "Your chat with Hunter")).toBe(true);
    expect(has((r) => r.status === "waiting" && r.origin === "From your capability statement")).toBe(true);
    expect(has((r) => r.status === "approved" && r.source === "Your capability statement")).toBe(true);
    expect(has((r) => r.status === "waiting" && r.origin === "You told Hunter")).toBe(true);
    expect(has((r) => r.state === "verified" && r.origin === "From SAM.gov")).toBe(true);
    expect(has((r) => r.state === "needs_review" && r.origin === "From SAM.gov")).toBe(true);
    expect(has((r) => r.source === "Your LLC paperwork")).toBe(true);
    expect(has((r) => r.origin === "From your GovPreneurs contact")).toBe(true);
    expect(has((r) => r.origin === "From your enrollment intake")).toBe(true);
    expect(has((r) => r.origin === "You told us" && !r.source)).toBe(true);
  });

  it("sells it on Basic Info", () => {
    const basic = all.filter((r) => BEFORE_FIRST_CALL.includes(r.field));
    for (const source of ["Your call with Sarah", "Your chat with Hunter", "Your capability statement", "SAM.gov registration"]) {
      expect(basic.some((r) => r.source === source), source).toBe(true);
    }
    expect(basic.some((r) => r.origin === "You told us")).toBe(true);
  });

  it("no catalog part is only 'You told us'", () => {
    for (const part of ["business", "sell", "capacity", "jobs", "papers"]) {
      const inPart = all.filter((r) => r.part === part);
      expect(inPart.some((r) => r.origin !== "You told us"), part).toBe(true);
    }
  });
});
