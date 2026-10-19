// The janitorial firm's hero bid in Ava (fixture.ts): it starts where the
// story says, the three questions behave as the pack says (section 8), every
// claim carries its source, and the price sits at the wage floor, inside the
// notice's value range and near what Grant and Hunter say.
// DEMO: a pack test runs in every member's mode, so it is guarded.
//
//   DEMO_MEMBER=janitorial bunx vitest run src/demo/members/janitorial

import { describe, expect, test } from "vitest";
import { copyProblem } from "../../../../../qa/copyRules";
import { planDownload } from "../../../../components/Ava/downloads";
import { exactChecks, requirementStatus } from "../../../../lib/ava/checks";
import { nowIso } from "../../../../lib/ava/dates";
import { claimView, sectionParagraphs } from "../../../../lib/ava/derive";
import { getAvaBid } from "../../../../lib/ava/fixtures";
import { look, ready, reading, started, type Pick } from "../../../../lib/ava/play";
import { approvalTotal, linePrices, periodTotals, roleCost } from "../../../../lib/ava/price";
import { startingState } from "../../../../lib/ava/start";
import { emptyState, type BidState } from "../../../../lib/ava/store";
import { threadOf } from "../../../../lib/ava/thread";
import { contactFor } from "../../../grant/facts";
import { MEMBER } from "../../../member";
import { getGrantBrief } from "../../../story/grantBriefs";
import { getOpportunity } from "../../../story/opportunities";
import { OTHER_MEMBERS_WORDS } from "../../words";
import { HERO_NOTICE as ID, HERO_OPEN, janitorialAnswers, janitorialBid, REFERENCE_CONTACTS } from "./fixture";

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
type ClaimRef = NonNullable<Parameters<typeof claimView>[2]>;

const draft = (bid: Bid, s: BidState) =>
  sectionParagraphs(s, bid.sections[0])
    .flat()
    .map((sp) => (sp.claim ? (claimView(bid, s, sp.claim).text ?? sp.text) : sp.text))
    .join("");

function chip(bid: Bid, s: BidState, claim: ClaimRef) {
  const v = claimView(bid, s, claim);
  if (v.tag === "unsupported") return "HOLE";
  if (v.tag === "commitment") return "Your promise";
  const k = v.proof!.kind;
  return k === "you-confirmed" ? "Your answer" : k === "profile" ? "Your profile" : k === "your-document" ? "Your file" : k === "sam" ? "SAM.gov" : "Your records";
}

describe.runIf(MEMBER === "janitorial")("the janitorial firm's Fort Bragg washing quote", () => {
  test("it is the story's hero: title, buyer, kind and due time", () => {
    const o = getOpportunity(ID)!;
    const bid = getAvaBid(ID)!;
    expect(bid.officialTitle).toBe(o.title);
    expect(bid.buyer).toBe(o.agency);
    expect(bid.kind).toBe(o.ava!.kind);
    expect(bid.award.method).toBe("lowest-price-acceptable");
    expect(bid.deadline.dueDaysFromNow).toBe(o.closesInDays);
    expect(`${bid.deadline.time} ${bid.deadline.zone}`).toBe("10:00 AM Eastern Time");
    expect(o.dueTime).toBe("10:00 AM Eastern");
    expect(bid.deadline.questionsDueDaysFromNow).toBe(
      getGrantBrief(ID)!.keyDates.find((k) => k.label === "Questions due")!.inDays,
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
      const a = janitorialBid.asks.find((x) => x.id === askId)!.answer;
      return a.type === "answer" ? a.choices.map((c) => c.label) : [];
    };
    expect(labels("go-ask-pm")).toEqual([
      "I am the PM. Keisha Lassiter, our operations manager, is the QC manager",
      "Keisha Lassiter is the PM. I am the QC manager",
      "We hire a QC manager after award",
    ]);
    expect(labels("go-ask-blast")).toEqual([
      "A local blasting sub at a signed rate",
      "Rent a blaster and train two techs",
      "Leave sandblasting out",
    ]);
    expect(labels("go-ask-backup")).toEqual([
      "Keep rig 2 on post on weekdays",
      "Buy a third rig on award",
      "Pull a rig off grocery work",
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
    expect(text).toContain("Reggie Tyndall, owner and president, is the Project Manager");
    expect(text).toContain("a local blasting subcontractor does it at a signed rate");
    expect(text).toContain("one of the company's two hot-water trailers stays on post");
  });

  test("hiring a QC manager after award goes through, flagged as a risk", () => {
    const s = ready(ID, atStart(), choosing("go-ask-pm", "pm-hire"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const v = requirementStatus(bid, s, bid.hardRequirements.find((r) => r.id === "go-r-people")!);
    expect(v.status).toBe("confirm");
    expect(v.evidence).toMatch(/^A risk/);
    expect(draft(bid, s)).toContain("will hire a Quality Control Manager after award");
  });

  test("leaving sandblasting out fails the gate; pulling a rig off grocery work is flagged", () => {
    const blast = janitorialBid.asks.find((a) => a.id === "go-ask-blast")!.answer;
    expect(blast.type === "answer" && blast.choices.find((c) => c.id === "blast-none")?.failsGate).toMatch(/non-compliant/);
    const s = ready(ID, atStart(), choosing("go-ask-backup", "backup-pull"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const v = requirementStatus(bid, s, bid.hardRequirements.find((r) => r.id === "go-r-backup")!);
    expect(v.status).toBe("confirm");
    const said = threadOf({ bid, s, flow, now: Date.now(), memberName: "Reggie Tyndall", grant: null, mentor: null });
    const ack = said.find((t) => t.key === "ack:ask:go-ask-backup");
    expect(ack?.kind === "ava" && ack.lines.join(" ")).toMatch(/requires backup equipment/);
  });

  test("the price: at the wage floor, inside the notice's range, near Grant and Hunter", () => {
    const o = getOpportunity(ID)!;
    const { bid, s } = look(ID, ready(ID, atStart()));
    // Every tech at the General Maintenance Worker floor, $21.41, not under it.
    const tech = roleCost(bid, s, bid.price!.roles.find((r) => r.id === "go-role-techs")!);
    expect(tech.pay).toBe(21.41);
    expect(tech.belowFloor).toBeNull();
    expect(tech.lines.find((l) => l.id === "go-b-hw")?.perHour).toBe(5.92);
    const years = periodTotals(bid, s).map((p) => p.total!);
    expect(years).toHaveLength(5);
    // Every year inside the $150K–$190K a year the notice states.
    for (const y of years) {
      expect(y).toBeGreaterThanOrEqual(o.valueLow!);
      expect(y).toBeLessThanOrEqual(o.valueHigh!);
    }
    // Year one near Hunter's "about $170K", and the square-foot price near
    // Grant's 41 cents for the last award, a little over it on the newer wages.
    expect(years[0]).toBeGreaterThan(160_000);
    expect(years[0]).toBeLessThan(175_000);
    const perSqFt = linePrices(bid, s)[0].unitPrice!;
    expect(perSqFt).toBeGreaterThanOrEqual(0.41);
    expect(perSqFt).toBeLessThanOrEqual(0.46);
    expect(years[4]).toBeGreaterThan(years[0]);
  });

  test("the presenter's jump plays his own answers", () => {
    const s = reading(ready(ID));
    expect(s.answers["go-ask-pm"]?.choiceId).toBe("pm-owner");
    expect(s.answers["go-ask-blast"]?.choiceId).toBe("blast-sub");
    expect(s.answers["go-ask-pay"]?.values).toEqual(janitorialAnswers["go-ask-pay"].values);
    expect(look(ID, s).flow.stage).toBe("read");
    expect(look(ID, ready(ID, started())).flow.stage).toBe("ready");
  });

  test("the files: his name on each", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const { files } = planDownload({ id: ID, bid, s }, null, "pdf");
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(f.name).toMatch(/Gray_Owl/);
  });

  test("the people: the page's contracting officer, and one phone and email per contact", () => {
    const bid = getAvaBid(ID)!;
    const page = contactFor(getOpportunity(ID)!);
    expect(bid.overview?.contact?.name).toBe(page.name);
    expect(bid.overview?.contact?.email).toBe(page.email);
    const v = janitorialAnswers["go-ask-refcontacts"].values!;
    expect(v["go-fld-ref1-email"]).toBe(REFERENCE_CONTACTS.tamikaRaynor.email);
    expect(v["go-fld-ref2-phone"]).toBe(REFERENCE_CONTACTS.janelleHardee.phone);
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
    walk(janitorialAnswers);
    expect(words.filter((w) => BANNED.test(w) || OTHER_MEMBERS_WORDS.test(w))).toEqual([]);
    expect(words.map((w) => copyProblem(w)).filter(Boolean)).toEqual([]);
  });
});
