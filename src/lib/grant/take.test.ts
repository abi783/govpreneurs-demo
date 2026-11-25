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
  // The Camp Mackall field meals review has no blocking row, so the path alone decides.
  const base = GRANT_FIXTURES["SP4701-26-Q-0021"](OPPORTUNITIES.find((o) => o.noticeId === "SP4701-26-Q-0021") ?? bidOpp);

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

  it("counts every compliance-matrix row that reads a strength, and every read that scored strong", () => {
    const haveRows = analysis.complianceMatrix.filter((r) => r.status === "have").length;
    const strongReads = analysis.reads.filter((r) => r.status === "strong").length;
    expect(t.counts.strengths).toBe(haveRows + strongReads);
  });
});

describe("buildTake — the unanalyzed take degrades cleanly", () => {
  const analysis = unanalyzed(bidOpp);
  const t = take(analysis);

  it("never throws and reports zero strengths/blockers/risks", () => {
    expect(t.counts).toEqual({ strengths: 0, blockers: 0, risks: 0, questions: 0 });
    expect(t.strengths).toHaveLength(0);
    expect(t.limits).toHaveLength(0);
  });

  it("still carries a call word and a next move", () => {
    expect(t.callWord).toBe("Needs review");
    expect(t.next?.title).toBe("Back to your matches");
  });
});

describe("buildTake — open questions are listed, not counted", () => {
  const base = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);
  const q = (id: string, text: string) => ({
    id,
    question: [{ text }],
    payoff: [],
    verdictSwing: 0.6,
    input: { kind: "yesno" as const },
    status: "open" as const,
  });
  const withQuestions: GrantAnalysis = {
    ...base,
    verdict: {
      ...base.verdict,
      warnings: [{ kind: "proposal-weakness", summary: [{ text: "2 required items" }] }],
    },
    rail: { ...base.rail, openQuestions: [q("a", "License?"), q("b", "Dealer?")] },
  };

  it("names each question in the rail's order, replacing the bare count", () => {
    const t = take(withQuestions);
    expect(t.questions.map((x) => x.id)).toEqual(["a", "b"]);
    expect(t.counts.questions).toBe(2);
    expect(t.limits.some((l) => l.title === "Proposal weakness")).toBe(false);
  });

  it("keeps the count line when there is nothing to ask instead", () => {
    const t = take({ ...withQuestions, rail: { ...base.rail, openQuestions: [] } });
    expect(t.limits.some((l) => l.title === "Proposal weakness")).toBe(true);
  });
});

describe("buildTake — answered questions stay on the card", () => {
  const base = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);

  it("lists each answered question with the member's answer, in the rail's order", () => {
    const t = take({
      ...base,
      rail: {
        ...base.rail,
        answeredQuestions: [
          { id: "a", question: [{ text: "License?" }], value: "Yes" },
          {
            id: "b",
            question: [{ text: "Dealer?" }],
            display: [{ text: "Are you a dealer?" }],
            value: "No",
          },
        ],
      },
    });
    expect(t.answered).toEqual([
      { id: "a", text: [{ text: "License?" }], value: "Yes" },
      { id: "b", text: [{ text: "Are you a dealer?" }], value: "No" },
    ]);
  });

  it("is empty when nothing is answered", () => {
    expect(take(base).answered).toEqual([]);
  });
});

describe("buildTake — the thesis never repeats the summary", () => {
  const base = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);
  const SAME = [{ text: "This fits your work. " }, { text: "You must renew licenses." }];

  it("drops a thesis that says the same thing as the summary", () => {
    const t = take({ ...base, verdict: { ...base.verdict, gist: SAME, headline: [SAME] } });
    expect(t.summary).toEqual(SAME);
    expect(t.thesis).toEqual([]);
  });

  it("keeps a thesis that adds something", () => {
    const other = [{ text: "A different point." }];
    const t = take({ ...base, verdict: { ...base.verdict, gist: SAME, headline: [other] } });
    expect(t.thesis).toEqual([other]);
  });
});

// g45-items: the panel limits come from the ranked open items.
describe("buildTake — open items (g45-items)", () => {
  const base = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);
  const pin = { label: "RFP", provenance: { type: "solicitation" as const, ref: "Solicitation" } };
  const item = (
    kind: NonNullable<GrantAnalysis["openItems"]>[number]["kind"],
    weight: NonNullable<GrantAnalysis["openItems"]>[number]["weight"],
    sentence: string,
  ) => ({ kind, weight, sentence, questions: [], evidence: pin });
  const items = [
    item("license", "decides-call", "Confirm you hold this license: Florida CAC."),
    item("place", "decides-call", "Confirm you can work on site in Mount Ida, AR."),
    item("scope", "risk", "Confirm this is work you do."),
    item("time", "risk", "Plan your time: the notice closes in 4 days."),
  ];
  const plainBody = (l: { body: { text: string }[] }) => l.body.map((s) => s.text).join("");

  it("shows the top three items in weight order, with the deciding item first", () => {
    const t = take({ ...base, openItems: items });
    const fromItems = t.limits.filter((l) =>
      ["License to confirm", "Place of work", "Kind of work", "Time"].includes(l.title),
    );
    expect(fromItems.map(plainBody)).toEqual([
      "Confirm you hold this license: Florida CAC.",
      "Confirm you can work on site in Mount Ida, AR.",
      "Confirm this is work you do.",
    ]);
    const firstNonGate = t.limits.find((l) => l.title !== "Hard blocker" && l.title !== "No runway left");
    expect(firstNonGate?.title).toBe("License to confirm");
  });

  it("drops the matrix's missing rows, because the items carry them", () => {
    const withMissing = GRANT_FIXTURES["SP4701-26-R-0078"](noBidOpp);
    expect(take(withMissing).limits.some((l) => l.title === "Capacity constraint")).toBe(true);
    const t = take({ ...withMissing, openItems: [] });
    expect(t.limits.some((l) => l.title === "Capacity constraint")).toBe(false);
  });

  it("an open field is never both a strength and a limit", () => {
    const winStrong = base.reads.map((r) => (r.id === 1 ? { ...r, status: "strong" as const } : r));
    const analysis: GrantAnalysis = {
      ...base,
      reads: winStrong,
      verdict: { ...base.verdict, competitiveRisk: [{ text: "No clear incumbent, but a competitive field." }] },
    };
    const off = take(analysis);
    expect(off.limits.some((l) => l.title === "Competitive weakness")).toBe(true);
    const on = take({ ...analysis, openItems: items });
    expect(on.strengths.some((s) => s.title === itemTitleOf(winStrong))).toBe(true);
    expect(on.limits.some((l) => l.title === "Competitive weakness")).toBe(false);
  });

  it("without open items, the limits are unchanged", () => {
    expect(take({ ...base }).limits).toEqual(take(base).limits);
    expect("openItems" in base).toBe(false);
  });
});

function itemTitleOf(reads: GrantAnalysis["reads"]): string {
  return reads.find((r) => r.id === 1)!.name.replace(/[?.]$/, "");
}

// g-reason-first (backend): the reason for a No-bid is the first limit.
describe("buildTake — the reason for a No-bid first (g-reason-first)", () => {
  const base = GRANT_FIXTURES["W912EE-26-R-0066"](bidOpp);
  const pin = { label: "RFP", provenance: { type: "solicitation" as const, ref: "Solicitation" } };
  const license = { kind: "license" as const, weight: "decides-call" as const, sentence: "Confirm you hold this license: Florida CAC.", questions: [], evidence: pin };
  const docs = { kind: "documents" as const, weight: "decides-call" as const, sentence: "Get the full solicitation documents.", questions: [], evidence: pin };
  const qual = { kind: "qualification" as const, weight: "decides-call" as const, sentence: "Confirm the plan.", questions: [], evidence: pin };
  const reason = {
    kind: "scope" as const,
    weight: "blocker" as const,
    sentence: "This is not your kind of work: the RFP asks for janitorial work.",
    questions: [],
    evidence: pin,
    callReason: true,
  };
  const body = (l: { body: { text: string }[] }) => l.body.map((s) => s.text).join("");

  it("puts the reason before every other limit, and keeps three item slots in all", () => {
    const t = take({ ...base, openItems: [docs, license, qual, reason] });
    expect(body(t.limits[0])).toBe(reason.sentence);
    const fromItems = t.limits.filter((l) => ["Kind of work", "Missing documents", "License to confirm", "Qualification to confirm"].includes(l.title));
    expect(fromItems).toHaveLength(3);
  });

  it("leaves the order as before without a reason item", () => {
    const t = take({ ...base, openItems: [docs, license] });
    expect(t.limits.some((l) => body(l) === reason.sentence)).toBe(false);
  });
});
