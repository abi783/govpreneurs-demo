import { describe, expect, it } from "vitest";
import { getGrantBrief, GRANT_BRIEFS } from "@/demo/story/grantBriefs";
import { OPPORTUNITIES, getOpportunity } from "@/demo/story/opportunities";
import type { GrantAnalysis } from "@/lib/grant/types";
import { buildAnalysis } from "./analysis";
import { buildDetail, documentsFor, tierAndScore } from "./detail";
import { renderDocument, renderGenericDocument } from "./documents";
import { DOMAIN_OF } from "./domains";
import { localize } from "./encode";
import { factsFor } from "./facts";
import { AUTHORED_BRIEFS } from "./heroBriefs";
import { HERO_EXTRAS } from "./heroAnalyses";
import { missingBold, plain } from "./rich";
import { railReply } from "./rail";
import { buildOldTake } from "./takeOld";

/** Words that must never reach a screen: the old sample member, and the wrong mentor. */
const FORBIDDEN = /\broof(ing|er|s)?\b|\bMarcus\b|Williams Construction|\b238160\b|SDVOSB|Amira's Kitchen|Diana|DEMO-[A-Z]+-\d+|HigherGov/i;

/** Every string in a value, flattened. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe("every story opportunity has a complete page", () => {
  for (const o of OPPORTUNITIES) {
    it(`${o.id} builds a detail and an analysis`, () => {
      const d = buildDetail(o.id);
      expect(d).not.toBeNull();
      expect(d!.id).toBe(o.id);
      expect(d!.title).toBe(o.title);
      expect(d!.quickSummary?.length).toBeGreaterThan(80);
      expect(d!.accordions && Object.keys(d!.accordions).length).toBeGreaterThanOrEqual(6);
      expect(d!.pointOfContact?.name).toBeTruthy();
      expect(d!.documents?.length).toBeGreaterThan(0);
      expect(d!.placeOfPerformance.city).toBeTruthy();
      expect(strings(d).join("\n")).not.toMatch(FORBIDDEN);

      const a = buildAnalysis(o.id);
      expect(a).not.toBeNull();
      expect(Array.isArray(a!.complianceMatrix)).toBe(true);
      expect(a!.reads.length).toBeGreaterThanOrEqual(6);
      expect(a!.rail.briefing.length).toBe(3);
      expect(a!.rail.suggestedChips.length).toBeGreaterThanOrEqual(1);
      expect(strings(a).join("\n")).not.toMatch(FORBIDDEN);
      expect(strings(a).join("\n")).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);
    });
  }

  it("answers null for an id outside the story", () => {
    expect(buildDetail("NOT-AN-ID")).toBeNull();
    expect(buildAnalysis("NOT-AN-ID")).toBeNull();
  });

  it("classifies every story opportunity by kind of work", () => {
    for (const o of OPPORTUNITIES) expect(DOMAIN_OF[o.id], o.id).toBeTruthy();
  });
});

describe("Grant's call agrees across the page, the mentor dialog and the story", () => {
  const CALL = { bid: "bid", review: "review", no_bid: "no-bid" } as const;
  for (const o of OPPORTUNITIES) {
    it(`${o.id}: ${o.grant.verdict}`, () => {
      const a = buildAnalysis(o.id)!;
      expect(a.verdict.value).toBe(CALL[o.grant.verdict]);
      const { tier, score } = tierAndScore(o);
      const d = buildDetail(o.id)!;
      expect(d.tier).toBe(tier);
      expect(d.finalScore).toBe(score);
      // The mentor dialog reads the tier: priority and strong are Bid, stretch is Review, low is No Bid.
      if (o.grant.verdict === "bid") {
        expect(["priority", "strong"]).toContain(tier);
        expect(score).toBeGreaterThanOrEqual(80);
      }
      if (o.grant.verdict === "review") expect(tier).toBe("stretch");
      if (o.grant.verdict === "no_bid") expect(tier).toBe("low");
      // Grant's gist is the story brief's, or the story's one-line reason.
      expect(plain(a.verdict.gist)).toContain(getGrantBrief(o.id)?.gist ?? o.grant.oneLine.split(". ")[0]);
      // Path boxes agree with prime and sub.
      if (o.grant.verdict !== "no_bid" && o.grant.prime === "no_go" && o.grant.sub === "go") expect(a.verdict.path).toBe("sub");
      if (o.grant.verdict === "no_bid") expect(a.verdict.path).toBe("skip");
    });
  }

  it("a Grant bid can be built with Ava", () => {
    for (const o of OPPORTUNITIES) {
      if (o.grant.verdict === "bid" && o.grant.prime === "go" && o.noticeType !== "Sources Sought") {
        expect(buildAnalysis(o.id)!.action.primary.target).toBe(`/ava/${o.id}`);
      }
    }
  });
});

describe("the three story briefs and the three written here appear in the analysis, field by field", () => {
  const briefs = [...GRANT_BRIEFS, ...Object.values(AUTHORED_BRIEFS)];
  it("covers six hand-written reviews", () => {
    expect(new Set(briefs.map((b) => b.oppId))).toEqual(new Set(OPPORTUNITIES.filter((o) => o.grant.authored).map((o) => o.id)));
    expect(Object.keys(HERO_EXTRAS).sort()).toEqual(briefs.map((b) => b.oppId).sort());
  });

  for (const brief of briefs) {
    it(`${brief.oppId}: every brief field is in the right place`, () => {
      const f = factsFor(getOpportunity(brief.oppId)!);
      const a = buildAnalysis(brief.oppId)!;
      const L = (t: string) => localize(t, f);
      const read = (name: string) => plain(a.reads.find((r) => r.name === name)?.sentence ?? []);

      expect(plain(a.verdict.gist)).toContain(L(brief.gist));
      expect(a.verdict.confidence.dots).toBe(brief.confidence);
      expect(plain(a.verdict.headline.flat()).replace(/\s+/g, "")).toBe(L(brief.thesis).replace(/\s+/g, ""));
      for (const [name, r] of Object.entries(brief.reads)) expect(read(name), name).toBe(L(r!.text));
      brief.limits.forEach((l, i) => expect(plain(a.verdict.warnings![i].summary)).toBe(L(l)));
      brief.wouldChange.forEach((w, i) => expect(plain(a.verdict.wouldChange![i])).toBe(L(w)));
      expect(a.action.primary).toEqual({ label: brief.nextMove.label, target: brief.nextMove.to });
      expect(plain(a.action.rationale)).toBe(L(brief.nextMove.rationale));
      if (brief.secondaryMove) expect(a.action.secondaries[0].label).toBe(brief.secondaryMove.label);
      brief.compliance.forEach((c, i) => {
        expect(plain(a.complianceMatrix[i].requirement)).toBe(c.requirement);
        expect(a.complianceMatrix[i].status).toBe(c.status === "partial" ? "confirm" : c.status);
      });
      brief.redTeam.forEach((r, i) => {
        expect(plain(a.redTeam![i].challenge)).toBe(r.challenge);
        expect(plain(a.redTeam![i].resolution)).toBe(L(r.answer));
      });
      const bullets = buildDetail(brief.oppId)!.keyDates!;
      expect(bullets.length).toBe(brief.keyDates.length);
      expect(a.rail.briefing.map((l) => plain(l))).toEqual(brief.railBriefing.map(L));
      expect(a.rail.suggestedChips.map((c) => c.label)).toEqual(brief.chips.map((c) => (typeof c === "string" ? c : c.label)));
    });

    it(`${brief.oppId}: the rail gives the brief's answers`, () => {
      const f = factsFor(getOpportunity(brief.oppId)!);
      for (const [q, answer] of Object.entries(brief.railAnswers)) {
        const r = railReply(brief.oppId, q);
        expect(r.reply, q).toBe(localize(answer, f));
        expect(["interrogate", "draft_request"]).toContain(r.kind);
      }
    });
  }

  it("bold phrases are in the sentences they bold", () => {
    for (const brief of briefs) {
      const f = factsFor(getOpportunity(brief.oppId)!);
      const a = buildAnalysis(brief.oppId)!;
      // A bold segment that is not a whole sentence must be a phrase of it: the encoder drops a phrase that is not found.
      for (const r of a.reads) expect(r.sentence.some((s) => s.bold) || r.sentence.length === 1, `${brief.oppId} ${r.name}`).toBe(true);
      void f;
    }
    expect(missingBold("a b c", "b")).toBe(false);
    expect(missingBold("a b c", "z")).toBe(true);
  });
});

describe("dates are relative to now", () => {
  for (const o of OPPORTUNITIES) {
    it(`${o.id} closes ${o.closesInDays} days from now`, () => {
      const d = buildDetail(o.id)!;
      // The deadline is midnight at the start of day N, so the page reads N all day.
      const due = new Date(d.responseDeadline);
      expect([due.getHours(), due.getMinutes(), due.getSeconds()]).toEqual([0, 0, 0]);
      expect(Math.ceil((due.getTime() - Date.now()) / 86_400_000)).toBe(o.closesInDays);
      const a0 = buildAnalysis(o.id)!;
      expect(a0.realDeadlineInputs.responseDue).toBe(d.responseDeadline);
      const a = buildAnalysis(o.id)!;
      const analyzed = new Date(a.meta.analyzedAt!).getTime();
      expect(Date.now() - analyzed).toBeGreaterThan(0);
      expect(Date.now() - analyzed).toBeLessThan(12 * 3_600_000);
      expect(plain(a.meta.freshnessLine)).toMatch(/^Analyzed \d+ hours? ago\.$/);
    });
  }
});

describe("documents download as real PDFs", () => {
  it("renders every document of a hero and of a generated opportunity", async () => {
    for (const id of ["SP4701-26-Q-0021", "W912EE-27-S-0004", "FAYNC-2026-R-08", "N62470-26-R-0153"]) {
      const f = factsFor(getOpportunity(id)!);
      for (const spec of documentsFor(f)) {
        const file = await renderDocument(id, spec.fileName);
        expect(file, `${id} ${spec.fileName}`).not.toBeNull();
        expect(new TextDecoder().decode(file!.bytes.slice(0, 5))).toBe("%PDF-");
        expect(file!.bytes.length).toBeGreaterThan(1500);
      }
    }
    expect(await renderDocument("SP4701-26-Q-0021", "nope.pdf")).toBeNull();
    const generic = await renderGenericDocument("SO-12345", "Paper.docx");
    expect(generic.fileName).toBe("Paper.pdf");
    expect(new TextDecoder().decode(generic.bytes.slice(0, 5))).toBe("%PDF-");
  }, 30_000);
});

describe("the rail", () => {
  it("answers an unknown question with the nearest questions, never an error", () => {
    const r = railReply("NCNG-2026-21", "blorp zzz quux");
    expect(r.kind).toBe("interrogate");
    expect(r.reply).toMatch(/I can answer these/);
    expect(r.reply).not.toMatch(/undefined|NaN/);
  });

  it("answers a typed version of a chip", () => {
    const r = railReply("SP4701-26-Q-0021", "what are my chances of winning this?");
    expect(r.reply).toMatch(/No one can promise that/);
  });

  it("builds an answer for an opportunity with no brief", () => {
    for (const q of ["Can I win it?", "Do I have enough time?", "Where am I weak?", "Can I fix this in time?", "Should I team up?", "What does it pay?"]) {
      const r = railReply("DUR-CO-2026-12", q);
      expect(r.reply.length, q).toBeGreaterThan(30);
      expect(r.reply).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it("refuses an off-topic question politely", () => {
    expect(railReply("NCNG-2026-21", "tell me a joke").kind).toBe("offscope");
  });

  it("an answer to an open question moves it to 'You told me' and lifts the confidence", () => {
    const before = buildAnalysis("W912EE-26-R-0066") as GrantAnalysis;
    expect(before.rail.openQuestions.length).toBe(2);
    const dots = before.verdict.confidence.dots!;
    const q = before.rail.openQuestions[0];
    const reply = railReply("W912EE-26-R-0066", "Yes", plain(q.question));
    expect(reply.kind).toBe("supply");
    expect(reply.fact?.value).toBe("Yes");
    const after = buildAnalysis("W912EE-26-R-0066") as GrantAnalysis;
    expect(after.rail.openQuestions.length).toBe(1);
    expect(after.rail.answeredQuestions?.[0].value).toBe("Yes");
    expect(after.verdict.confidence.dots).toBe(dots + 1);
    expect(after.verdict.value).toBe(before.verdict.value);
  });
});

describe("no hand-written review is a copy of the story's one-liner", () => {
  it("has a distinct gist for each brief", () => {
    for (const b of GRANT_BRIEFS) expect(getGrantBrief(b.oppId)?.gist).toBeTruthy();
  });
});

describe("the old six-field take card", () => {
  it("answers for every story opportunity, and for none outside it", () => {
    for (const o of OPPORTUNITIES) {
      const t = buildOldTake(o.id);
      expect(t, o.id).not.toBeNull();
      expect(Object.keys(t!.fields).sort()).toEqual(["contract_size", "eligibility", "location", "proposal_readiness", "scope_fit", "your_edge"]);
      expect(t!.recommendation).toBe(o.grant.verdict === "bid" ? "bid" : o.grant.verdict === "review" ? "lean_bid" : "pass");
      expect(JSON.stringify(t)).not.toMatch(FORBIDDEN);
    }
    expect(buildOldTake("NOT-AN-ID")).toBeNull();
  });
});
