// The consultant's hero bid in Ava (fixture.ts): it starts where the story
// says, the three questions behave as the pack says (section 8), every claim
// carries its source, and the price sits inside the notice's range.
// DEMO: a pack test runs in every member's mode, so it is guarded.
//
//   DEMO_MEMBER=consulting bunx vitest run src/demo/members/consulting

import { describe, expect, test } from "vitest";
import { copyProblem } from "../../../../../qa/copyRules";
import { planDownload } from "../../../../components/Ava/downloads";
import { exactChecks, requirementStatus } from "../../../../lib/ava/checks";
import { nowIso } from "../../../../lib/ava/dates";
import { claimView, sectionParagraphs } from "../../../../lib/ava/derive";
import { getAvaBid } from "../../../../lib/ava/fixtures";
import { look, play, ready, reading, started, type Pick } from "../../../../lib/ava/play";
import { approvalTotal, periodTotals } from "../../../../lib/ava/price";
import { startingState } from "../../../../lib/ava/start";
import { emptyState, type BidState } from "../../../../lib/ava/store";
import { threadOf } from "../../../../lib/ava/thread";
import { contactFor } from "../../../grant/facts";
import { MEMBER } from "../../../member";
import { getGrantBrief } from "../../../story/grantBriefs";
import { getOpportunity } from "../../../story/opportunities";
import { OTHER_MEMBERS_WORDS } from "../../words";
import { consultingAnswers, consultingBid, HERO_NOTICE as ID, HERO_OPEN, REFERENCE_CONTACTS } from "./fixture";

/** Words the demo never shows. */
const BANNED = /\b(roof\w*|Marcus|Williams Construction|238160)\b/i;

const choosing =
  (askId: string, choiceId: string): Pick =>
  (q, s) =>
    q.key === `ask:${askId}`
      ? {
          ...s,
          answers: { ...s.answers, [askId]: { status: "done", at: nowIso(), choiceId } },
          trail: [...s.trail, q.key],
        }
      : null;

const atStart = (): BidState => ({ ...emptyState(), ...startingState(ID) });

type Bid = ReturnType<typeof look>["bid"];
const draft = (bid: Bid, s: BidState) =>
  bid.sections
    .flatMap((sec) => sectionParagraphs(s, sec).flat())
    .map((sp) => (sp.claim ? (claimView(bid, s, sp.claim).text ?? sp.text) : sp.text))
    .join("");

function chip(bid: Bid, s: BidState, claim: NonNullable<Parameters<typeof claimView>[2]>) {
  const v = claimView(bid, s, claim);
  if (v.tag === "unsupported") return "HOLE";
  if (v.tag === "commitment") return "Your promise";
  const k = v.proof!.kind;
  return k === "you-confirmed" ? "Your answer" : k === "profile" ? "Your profile" : k === "your-document" ? "Your file" : k === "sam" ? "SAM.gov" : "Your records";
}

describe.runIf(MEMBER === "consulting")("the consultant's Fayetteville VA leadership quote", () => {
  test("it is the story's hero: title, buyer, kind and due time", () => {
    const o = getOpportunity(ID)!;
    const bid = getAvaBid(ID)!;
    expect(bid.officialTitle).toBe(o.title);
    expect(bid.buyer).toBe(o.agency);
    expect(bid.kind).toBe(o.ava!.kind);
    expect(bid.award.method).toBe("best-value");
    expect(bid.deadline.dueDaysFromNow).toBe(o.closesInDays);
    expect(`${bid.deadline.time} ${bid.deadline.zone}`).toBe("2:00 PM Eastern Time");
    expect(o.dueTime).toBe("2:00 PM Eastern");
    expect(bid.deadline.questionsDueDaysFromNow).toBe(
      getGrantBrief(ID)!.keyDates.find((k) => k.label === "Q&A closes")!.inDays,
    );
  });

  test("it starts at answer my questions, with the pack's three questions in order", () => {
    const { flow, s } = look(ID, atStart());
    expect(s.started).toBe(true);
    expect(flow.stage).toBe("answer");
    expect(flow.queue.map((q) => q.key)).toEqual(HERO_OPEN);
    expect(s.priceApproval?.total).toBe(approvalTotal(look(ID, s).bid, s));
  });

  test("each question offers the pack's three choices", () => {
    const labels = (askId: string) => {
      const a = consultingBid.asks.find((x) => x.id === askId)!.answer;
      return a.type === "answer" ? a.choices.map((c) => c.label) : [];
    };
    expect(labels("cv-ask-leads")).toEqual([
      "Me as Program Manager, Yvette Brannock as Lead Facilitator",
      "Yvette Brannock as Program Manager, me as Lead Facilitator",
      "Hire them on award",
    ]);
    expect(labels("cv-ask-teach")).toEqual([
      "All W-2 staff",
      "Two W-2 and two 1099 facilitators",
      "Move one facilitator to payroll first",
    ]);
    expect(labels("cv-ask-coach")).toEqual([
      "Hire a PCC coach on payroll",
      "PCC plus two ACC, with VA's Q&A answer",
      "Take exception to the PCC line",
    ]);
  });

  test("answered, it checks clean and is ready to read, with a source tag on every claim", () => {
    const { bid, s, flow } = look(ID, ready(ID, atStart()));
    expect(flow.stage).toBe("ready");
    expect(flow.holds).toEqual([]);
    expect(exactChecks(bid, s).findings.filter((f) => f.severity !== "minor")).toEqual([]);
    const chips = new Set<string>();
    for (const sec of bid.sections)
      for (const para of sectionParagraphs(s, sec))
        for (const sp of para) if (sp.claim) chips.add(chip(bid, s, sp.claim));
    expect(chips.has("HOLE")).toBe(false);
    for (const c of ["SAM.gov", "Your profile", "Your file", "Your promise"]) expect(chips).toContain(c);
    const text = draft(bid, s);
    expect(text).toContain("Simone Strayhorn, the company's founder and principal consultant, is the Program Manager");
    expect(text).toContain("Terrell Haywood, a contract facilitator today, joins the payroll");
  });

  test("two 1099 cohort leads goes through, flagged for the 50% rule", () => {
    const s = ready(ID, atStart(), choosing("cv-ask-teach", "teach-mix"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const v = requirementStatus(bid, s, bid.hardRequirements.find((r) => r.id === "cv-r-limits")!);
    expect(v.status).toBe("confirm");
    expect(v.evidence).toMatch(/^A risk/);
    const said = threadOf({ bid, s, flow, now: Date.now(), memberName: "Simone Strayhorn", grant: null, mentor: null });
    const ack = said.find((t) => t.key === "ack:ask:cv-ask-teach");
    expect(ack?.kind === "ava" && ack.lines[0]).toMatch(/^That puts the 50% rule at risk/);
  });

  test("hiring the leads on award goes through, flagged as a risk", () => {
    const s = ready(ID, atStart(), choosing("cv-ask-leads", "lead-hire"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    expect(draft(bid, s)).toContain("will hire a Program Manager and a Lead Facilitator after award");
  });

  test("taking exception to the coach line stops the quote", () => {
    const s = play(ID, atStart(), (f) => f.stage === "ready", choosing("cv-ask-coach", "coach-exception"));
    expect(look(ID, s).flow.stage).not.toBe("ready");
  });

  test("the price: inside the notice's $170K–$230K a year, about Grant's $200K", () => {
    const o = getOpportunity(ID)!;
    const { bid, s } = look(ID, ready(ID, atStart()));
    const years = periodTotals(bid, s).map((p) => p.total!);
    expect(years).toHaveLength(3);
    expect(years[0]).toBeGreaterThanOrEqual(o.valueLow!);
    expect(years[0]).toBeLessThanOrEqual(o.valueHigh!);
    expect(Math.abs(years[0] - 200_000)).toBeLessThan(15_000);
    expect(years[1]).toBeGreaterThan(years[0]);
    for (const y of years) expect(y).toBeLessThanOrEqual(o.valueHigh!);
  });

  test("the presenter's jump plays her own answers", () => {
    const s = reading(ready(ID));
    expect(s.answers["cv-ask-leads"]?.choiceId).toBe("lead-simone");
    expect(s.answers["cv-ask-teach"]?.choiceId).toBe("teach-payroll");
    expect(s.answers["cv-ask-pay"]?.values).toEqual(consultingAnswers["cv-ask-pay"].values);
    expect(look(ID, s).flow.stage).toBe("read");
    expect(look(ID, ready(ID, started())).flow.stage).toBe("ready");
  });

  test("the files: her name on each, one per volume", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const { files } = planDownload({ id: ID, bid, s }, null, "pdf");
    expect(files.map((f) => f.name)).toEqual([
      "Volume_I_Technical_Approach_Coppervale_Advisory.pdf",
      "Volume_II_Past_Performance_Coppervale_Advisory.pdf",
      "Volume_III_Price_Schedule_Coppervale_Advisory.xlsx",
      "Signed_Forms_Coppervale_Advisory.pdf",
    ]);
  });

  test("the people: the page's contracting officer, and one phone and email per reference", () => {
    const bid = getAvaBid(ID)!;
    const page = contactFor(getOpportunity(ID)!);
    expect(bid.overview?.contact?.name).toBe(page.name);
    expect(bid.overview?.contact?.email).toBe(page.email);
    const v = consultingAnswers["cv-ask-refcontacts"].values!;
    expect(v["cv-fld-ref1-email"]).toBe(REFERENCE_CONTACTS.lenaAbernathy.email);
    expect(v["cv-fld-ref2-phone"]).toBe(REFERENCE_CONTACTS.keishaMonroe.phone);
    for (const c of Object.values(REFERENCE_CONTACTS)) expect(c.email).toMatch(/\.example$/);
  });

  test("no other member's word, no banned word, no copy-rule mistake", () => {
    const words: string[] = [];
    const walk = (n: unknown) => {
      if (typeof n === "string") words.push(n);
      else if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === "object") Object.values(n).forEach(walk);
    };
    walk(getAvaBid(ID));
    walk(consultingAnswers);
    expect(words.filter((w) => BANNED.test(w) || OTHER_MEMBERS_WORDS.test(w))).toEqual([]);
    expect(words.map((w) => copyProblem(w)).filter(Boolean)).toEqual([]);
  });
});
