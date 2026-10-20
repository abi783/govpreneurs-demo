// The trucking company's hero bid in Ava (fixture.ts): it starts where the
// story says, the three questions behave as the pack says (section 8), every
// claim carries its source, and the bid reaches the files she sends.
// DEMO: a pack test runs in every member's mode, so it is guarded.
//
//   DEMO_MEMBER=trucking bunx vitest run src/demo/members/trucking

import { describe, expect, test } from "vitest";
import { copyProblem } from "../../../../../qa/copyRules";
import { planDownload } from "../../../../components/Ava/downloads";
import { exactChecks, requirementStatus } from "../../../../lib/ava/checks";
import { nowIso } from "../../../../lib/ava/dates";
import { claimView, sectionParagraphs } from "../../../../lib/ava/derive";
import { getAvaBid } from "../../../../lib/ava/fixtures";
import { look, ready, reading, started, type Pick } from "../../../../lib/ava/play";
import { approvalTotal, periodTotals } from "../../../../lib/ava/price";
import { startingState } from "../../../../lib/ava/start";
import { emptyState, type BidState } from "../../../../lib/ava/store";
import { threadOf } from "../../../../lib/ava/thread";
import { contactFor } from "../../../grant/facts";
import { MEMBER } from "../../../member";
import { getGrantBrief } from "../../../story/grantBriefs";
import { getOpportunity } from "../../../story/opportunities";
import { OWN_WORDS as AGENCY_WORDS } from "../../agency/words";
import { OWN_WORDS as CONSTRUCTION_WORDS } from "../../construction/words";
import { HERO_NOTICE as ID, HERO_OPEN, REFERENCE_CONTACTS, truckingAnswers, truckingBid } from "./fixture";

/** Words no other member's story may leave here, and the words the demo never shows. */
const FOREIGN =
  /\b(cater\w*|meals?|kitchen|cooks?|menus?|Haddad|Amira|722310|Camp Mackall|Marcus|Williams Construction|roof\w*|238160)\b/i;

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

describe.runIf(MEMBER === "trucking")("the trucking company's VA routes quote", () => {
  test("it is the story's hero: title, buyer, kind and due time", () => {
    const o = getOpportunity(ID)!;
    const bid = getAvaBid(ID)!;
    expect(bid.officialTitle).toBe(o.title);
    expect(bid.buyer).toBe(o.agency);
    expect(bid.kind).toBe(o.ava!.kind);
    expect(bid.award.method).toBe("best-value");
    expect(bid.deadline.dueDaysFromNow).toBe(o.closesInDays);
    expect(`${bid.deadline.time} ${bid.deadline.zone}`).toBe("10:00 AM Eastern Time");
    expect(o.dueTime).toBe("10:00 AM Eastern");
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
    expect(s.clarifications["rr-clar-fuel"]?.sentAt).toBeTruthy();
  });

  test("each question offers the pack's three choices", () => {
    const labels = (askId: string) => {
      const a = truckingBid.asks.find((x) => x.id === askId)!.answer;
      return a.type === "answer" ? a.choices.map((c) => c.label) : [];
    };
    expect(labels("rr-ask-pm")).toEqual([
      "I am the PM. Keisha Rowland, our dispatcher, is the Alternate",
      "Keisha Rowland is the PM. I am the Alternate",
      "We hire a PM after award",
    ]);
    expect(labels("rr-ask-trucks")).toEqual([
      "Two of our box trucks, and the third as the spare",
      "Two of our box trucks. We rent a spare on breakdowns",
      "We lease two new trucks on award",
    ]);
    expect(labels("rr-ask-license")).toEqual([
      "State our licenses and bond, and ask in Q&A",
      "Wait for VA's answer in Q&A",
      "Take an exception to the license line",
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
    for (const c of ["SAM.gov", "Your profile", "Your file", "Your answer", "Your promise"]) expect(chips).toContain(c);
    const text = draft(bid, s);
    expect(text).toContain("Tanya Merritt, owner and president, is the Project Manager");
    expect(text).toContain("its third box truck stands by at the yard as the backup");
    expect(text).toContain("Route prices assume diesel at $3.85 a gallon");
  });

  test("hiring a PM after award goes through, flagged as a risk", () => {
    const s = ready(ID, atStart(), choosing("rr-ask-pm", "pm-hire"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const v = requirementStatus(bid, s, bid.hardRequirements.find((r) => r.id === "rr-r-pm")!);
    expect(v.status).toBe("confirm");
    expect(v.evidence).toMatch(/^A risk/);
    expect(draft(bid, s)).toContain("will hire a Project Manager after award");
  });

  test("leasing two trucks: Ava flags the cost", () => {
    const s = ready(ID, atStart(), choosing("rr-ask-trucks", "trucks-lease"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    expect(draft(bid, s)).toContain("will lease two new 26-foot box trucks");
    const said = threadOf({ bid, s, flow, now: Date.now(), memberName: "Tanya Merritt", grant: null, mentor: null });
    const ack = said.find((t) => t.key === "ack:ask:rr-ask-trucks");
    expect(ack?.kind === "ava" && ack.lines.join(" ")).toMatch(/adds cost/);
  });

  test("waiting for VA's answer goes through and says she asked; an exception fails the gate", () => {
    const s = ready(ID, atStart(), choosing("rr-ask-license", "lic-wait"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    expect(draft(bid, s)).toContain("will complete that line as VA's answer directs");
    const lic = truckingBid.asks.find((a) => a.id === "rr-ask-license")!.answer;
    expect(lic.type === "answer" && lic.choices.find((c) => c.id === "lic-exception")?.failsGate).toMatch(/non-compliant/);
  });

  test("the price: five years, the first near Grant's $235K", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const years = periodTotals(bid, s).map((p) => p.total!);
    expect(years).toHaveLength(5);
    expect(years[0]).toBeGreaterThan(210_000);
    expect(years[0]).toBeLessThan(260_000);
    expect(years[4]).toBeGreaterThan(years[0]);
  });

  test("the presenter's jump plays her own answers", () => {
    const s = reading(ready(ID));
    expect(s.answers["rr-ask-pm"]?.choiceId).toBe("pm-owner");
    expect(s.answers["rr-ask-license"]?.choiceId).toBe("lic-state");
    expect(s.answers["rr-ask-fuel"]?.values).toEqual(truckingAnswers["rr-ask-fuel"].values);
    expect(look(ID, s).flow.stage).toBe("read");
    expect(look(ID, ready(ID, started())).flow.stage).toBe("ready");
  });

  test("the files: her name on each", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const { files } = planDownload({ id: ID, bid, s }, null, "pdf");
    for (const f of files) expect(f.name).toMatch(/Rockfish_Run_Freight/);
    expect(files.length).toBeGreaterThan(0);
  });

  test("the people: the page's contracting officer, and one phone and email per contact", () => {
    const bid = getAvaBid(ID)!;
    const page = contactFor(getOpportunity(ID)!);
    expect(bid.overview?.contact?.name).toBe(page.name);
    expect(bid.overview?.contact?.email).toBe(page.email);
    const v = truckingAnswers["rr-ask-refcontacts"].values!;
    expect(v["rr-fld-ref1-email"]).toBe(REFERENCE_CONTACTS.renataBostic.email);
    expect(v["rr-fld-ref2-phone"]).toBe(REFERENCE_CONTACTS.calvinStrickland.phone);
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
    walk(truckingAnswers);
    expect(words.filter((w) => FOREIGN.test(w) || AGENCY_WORDS.test(w) || CONSTRUCTION_WORDS.test(w))).toEqual([]);
    expect(words.map((w) => copyProblem(w)).filter(Boolean)).toEqual([]);
  });
});
