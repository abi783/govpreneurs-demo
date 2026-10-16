import { describe, it, expect } from "vitest";
import { buildTake } from "./take";
import { GRANT_FIXTURES } from "./fixtures";
import { OPPORTUNITIES } from "../mock/opportunities";
import { computeGates } from "./computeGates";
import { computeRealDeadline } from "./computeRealDeadline";
import { unanalyzed } from "./index";
import type { GrantAnalysis } from "./types";

function take(analysis: GrantAnalysis) {
  const deadline = computeRealDeadline(analysis.realDeadlineInputs);
  const gates = computeGates(analysis.complianceMatrix, deadline, analysis.meta.noticeType);
  return buildTake(analysis, gates, deadline);
}

const bidOpp = OPPORTUNITIES.find((o) => o.noticeId === "W912EE-26-R-0066")!;
const noBidOpp = OPPORTUNITIES.find((o) => o.noticeId === "SP4701-26-R-0078")!;

describe("buildTake — bid verdict (fortBragg fixture)", () => {
  const analysis = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);
  const t = take(analysis);

  it("carries the bid call word and ok tone", () => {
    expect(t.callWord).toBe("Bid");
    expect(t.tone).toBe("ok");
  });

  it("derives a next move from action.primary", () => {
    expect(t.next?.title).toBe(analysis.action.primary.label);
  });

  it('path "sub": prime is no-go, sub is go — matches the fixture\'s own narrative (bond blocks prime, sub is fine)', () => {
    expect(analysis.verdict.path).toBe("sub");
    expect(t.paths).toEqual([
      { label: "Prime path", state: "no-go" },
      { label: "Subcontract path", state: "go" },
    ]);
  });
});

describe("buildTake — capture-path go/no-go across every verdict.path value", () => {
  const base = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);

  it('path "prime": both prime and sub are go — prime is a strictly higher bar, so clearing it clears sub too', () => {
    const analysis = { ...base, verdict: { ...base.verdict, path: "prime" as const } };
    const t = take(analysis);
    expect(t.paths).toEqual([
      { label: "Prime path", state: "go" },
      { label: "Subcontract path", state: "go" },
    ]);
  });

  it('path "shape-watch": both read "not yet" — not enough signal to commit to a path', () => {
    const analysis = { ...base, verdict: { ...base.verdict, path: "shape-watch" as const } };
    const t = take(analysis);
    expect(t.paths).toEqual([
      { label: "Prime path", state: "unknown" },
      { label: "Subcontract path", state: "unknown" },
    ]);
  });

  it('verdict.value "no-bid" forces both paths no-go regardless of the recommended path', () => {
    const analysis = {
      ...base,
      verdict: { ...base.verdict, value: "no-bid" as const, path: "prime" as const },
    };
    const t = take(analysis);
    expect(t.paths).toEqual([
      { label: "Prime path", state: "no-go" },
      { label: "Subcontract path", state: "no-go" },
    ]);
  });

  it("a blocked legal gate forces prime no-go even when verdict.path says prime", () => {
    // campMackall's clearance row is `missing` + `closableInWindow: false`, so
    // its legal gate is genuinely blocked — reuse it, but override path to
    // "prime" to isolate the gate's effect from the path itself.
    const noBid = GRANT_FIXTURES["SP4701-26-R-0078"](noBidOpp);
    const deadline = computeRealDeadline(noBid.realDeadlineInputs);
    const gates = computeGates(noBid.complianceMatrix, deadline, noBid.meta.noticeType);
    expect(gates.legal.tone).toBe("blocked");
    const analysis = {
      ...noBid,
      verdict: { ...noBid.verdict, value: "review" as const, path: "prime" as const },
    };
    const t = buildTake(analysis, gates, deadline);
    expect(t.paths.find((p) => p.label === "Prime path")?.state).toBe("no-go");
  });

  it("a real deadline that has since run out (blocked) forces both paths no-go, even for a path=prime verdict frozen before it lapsed", () => {
    const analysis = { ...base, verdict: { ...base.verdict, path: "prime" as const } };
    // Fixture close dates are all within a couple months of "now" — a `now` in
    // 2030 is safely past every one of them, forcing deadline.status "blocked".
    const farFuture = new Date("2030-01-01T00:00:00Z");
    const deadline = computeRealDeadline(analysis.realDeadlineInputs, farFuture);
    expect(deadline.status).toBe("blocked");
    const gates = computeGates(analysis.complianceMatrix, deadline, analysis.meta.noticeType);
    const t = buildTake(analysis, gates, deadline);
    expect(t.paths).toEqual([
      { label: "Prime path", state: "no-go" },
      { label: "Subcontract path", state: "no-go" },
    ]);
    // The change-line wording should say so too — a lapsed runway is just as
    // unrecoverable within this solicitation as an unclosable legal gate, so
    // it takes the same "Locked" wording rather than the softer "Currently".
    const prime = t.changes.find((c) => c.path === "Prime recommendation")!;
    expect(prime.headline).toBe("Locked at no-go for this solicitation");
  });
});

describe("buildTake — no-bid verdict with an unclosable blocker (campMackall fixture)", () => {
  const analysis = GRANT_FIXTURES["SP4701-26-R-0078"](noBidOpp);
  const t = take(analysis);

  it("carries the no-bid call word and blocked tone", () => {
    expect(t.callWord).toBe("No-bid");
    expect(t.tone).toBe("blocked");
  });

  it("surfaces the hard blocker from the gate", () => {
    const blocker = t.limits.find((l) => l.title === "Hard blocker");
    expect(blocker).toBeTruthy();
    expect(blocker?.tone).toBe("blocked");
  });

  it("also surfaces the same missing row as a capacity constraint, with required-vs-held pairs", () => {
    const constraint = t.limits.find((l) => l.title === "Capacity constraint");
    expect(constraint).toBeTruthy();
    expect(constraint?.pairs?.length).toBeGreaterThan(0);
  });

  it("locks both capture paths to no-go given the unclosable blocker", () => {
    const prime = t.changes.find((c) => c.path === "Prime recommendation")!;
    expect(prime.state).toBe("no-go");
    expect(prime.headline).toBe("Locked at no-go for this solicitation");
  });

  it("counts every compliance-matrix row that reads a strength", () => {
    const haveRows = analysis.complianceMatrix.filter((r) => r.status === "have").length;
    expect(t.counts.strengths).toBe(haveRows);
  });
});

describe("buildTake — the unanalyzed take degrades cleanly", () => {
  const analysis = unanalyzed(bidOpp);
  const t = take(analysis);

  it("never throws and reports zero strengths/blockers/risks", () => {
    expect(t.counts).toEqual({ strengths: 0, blockers: 0, risks: 0 });
    expect(t.strengths).toHaveLength(0);
    expect(t.limits).toHaveLength(0);
  });

  it("still carries a call word and a next move", () => {
    expect(t.callWord).toBe("Needs review");
    expect(t.next?.title).toBe("Back to your matches");
  });
});
