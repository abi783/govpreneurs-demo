// The contractor's hero bid in Ava (fixture.ts): it starts where the story
// says, the three questions behave as the pack says (section 8), every claim
// carries its source, and the bid reaches the files he uploads.
// DEMO: a pack test runs in every member's mode, so it is guarded.
//
//   DEMO_MEMBER=construction bunx vitest run src/demo/members/construction

import { describe, expect, test } from "vitest";
import { copyProblem } from "../../../../../qa/copyRules";
import { planDownload } from "../../../../components/Ava/downloads";
import { exactChecks, requirementStatus } from "../../../../lib/ava/checks";
import { nowIso } from "../../../../lib/ava/dates";
import { claimView, sectionParagraphs } from "../../../../lib/ava/derive";
import { getAvaBid } from "../../../../lib/ava/fixtures";
import { packageParts } from "../../../../lib/ava/package";
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
import {
  constructionAnswers,
  constructionBid,
  HERO_NOTICE as ID,
  HERO_OPEN,
  REFERENCE_CONTACTS,
} from "./fixture";

/** Words no other member's story may leave here, and the words the demo never shows. */
const FOREIGN =
  /\b(cater\w*|meals?|kitchen|cooks?|menus?|Haddad|Amira|722310|Camp Mackall|Womack|Marcus|Williams Construction|roof\w*|238160)\b/i;

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

function claimText(
  bid: ReturnType<typeof look>["bid"],
  s: BidState,
  sp: { text: string; claim?: Parameters<typeof claimView>[2] },
) {
  return sp.claim ? (claimView(bid, s, sp.claim).text ?? sp.text) : sp.text;
}
const draft = (bid: ReturnType<typeof look>["bid"], s: BidState) =>
  sectionParagraphs(s, bid.sections[0])
    .flat()
    .map((sp) => claimText(bid, s, sp))
    .join("");

function chip(bid: ReturnType<typeof look>["bid"], s: BidState, claim: NonNullable<Parameters<typeof claimView>[2]>) {
  const v = claimView(bid, s, claim);
  if (v.tag === "unsupported") return "HOLE";
  if (v.tag === "commitment") return "Your promise";
  const k = v.proof!.kind;
  return k === "you-confirmed" ? "Your answer" : k === "profile" ? "Your profile" : k === "your-document" ? "Your file" : k === "sam" ? "SAM.gov" : "Your records";
}

describe.runIf(MEMBER === "construction")("the contractor's USACE sealed bid", () => {
  test("it is the story's hero: title, buyer, kind and bid opening", () => {
    const o = getOpportunity(ID)!;
    const bid = getAvaBid(ID)!;
    expect(bid.officialTitle).toBe(o.title);
    expect(bid.buyer).toBe(o.agency);
    expect(bid.kind).toBe(o.ava!.kind);
    expect(bid.award.method).toBe("low-bid");
    expect(bid.deadline.dueDaysFromNow).toBe(o.closesInDays);
    expect(`${bid.deadline.time} ${bid.deadline.zone}`).toBe("2:00 PM Eastern Time");
    expect(o.dueTime).toBe("2:00 PM Eastern");
    expect(bid.deadline.questionsDueDaysFromNow).toBe(
      getGrantBrief(ID)!.keyDates.find((k) => k.label === "Questions due")!.inDays,
    );
    expect(bid.bidSecurity?.percent).toBe(20);
  });

  test("it starts at answer my questions, with the pack's three questions in order", () => {
    const { flow, s } = look(ID, atStart());
    expect(s.started).toBe(true);
    expect(flow.stage).toBe("answer");
    expect(flow.queue.map((q) => q.key)).toEqual(HERO_OPEN);
    expect(s.priceApproval?.total).toBe(approvalTotal(look(ID, s).bid, s));
    expect(s.clarifications["nb-clar-pipefitter"]?.sentAt).toBeTruthy();
  });

  test("each question offers the pack's three choices", () => {
    const labels = (askId: string) => {
      const a = constructionBid.asks.find((x) => x.id === askId)!.answer;
      return a.type === "answer" ? a.choices.map((c) => c.label) : [];
    };
    expect(labels("nb-ask-qc")).toEqual([
      "Leon Batts, our superintendent, as QC Manager, plus a separate safety officer",
      "One person for both",
      "We hire them after award",
    ]);
    expect(labels("nb-ask-controls")).toEqual([
      "Our own controls tech, on the existing BACnet system",
      "A controls subcontractor",
      "Ask the Corps which system first",
    ]);
    expect(labels("nb-ask-cooling")).toEqual([
      "Rent a temporary chiller",
      "One air handler at a time",
      "Do the chiller outage November to March only",
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
    for (const c of ["SAM.gov", "Your profile", "Your file", "Your answer"]) expect(chips).toContain(c);
    expect(draft(bid, s)).toContain("Leon Batts, the company's superintendent, is the QC Manager");
  });

  test("one person for both: Ava checks the spec, and flags it", () => {
    const s = ready(ID, atStart(), choosing("nb-ask-qc", "qc-one"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const v = requirementStatus(bid, s, bid.hardRequirements.find((r) => r.id === "nb-r-qc")!);
    expect(v.status).toBe("confirm");
    expect(v.evidence).toMatch(/^A risk/);
    const said = threadOf({ bid, s, flow, now: Date.now(), memberName: "Derrick Faircloth", grant: null, mentor: null });
    const ack = said.find((t) => t.key === "ack:ask:nb-ask-qc");
    expect(ack?.kind === "ava" && ack.lines[0]).toMatch(/^I checked the spec/);
  });

  test("hiring after award goes through, flagged as a risk", () => {
    const s = ready(ID, atStart(), choosing("nb-ask-qc", "qc-hire"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    expect(draft(bid, s)).toContain("will hire a QC Manager");
  });

  test("asking the Corps about the controls goes through, and says he asked", () => {
    const s = ready(ID, atStart(), choosing("nb-ask-controls", "ctl-ask"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    expect(draft(bid, s)).toContain("asked the Corps in writing");
  });

  test("the price: one firm price near Grant's $730K", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const years = periodTotals(bid, s).map((p) => p.total!);
    expect(years).toHaveLength(1);
    expect(years[0]).toBeGreaterThan(640_000);
    expect(years[0]).toBeLessThan(820_000);
  });

  test("the presenter's jump plays his own answers", () => {
    const s = reading(ready(ID));
    expect(s.answers["nb-ask-qc"]?.choiceId).toBe("qc-batts");
    expect(s.answers["nb-ask-cooling"]?.choiceId).toBe("cool-winter");
    expect(s.answers["nb-ask-equipment"]?.values).toEqual(constructionAnswers["nb-ask-equipment"].values);
    expect(look(ID, s).flow.stage).toBe("read");
    expect(look(ID, ready(ID, started())).flow.stage).toBe("ready");
  });

  test("the files: his name on each, and the bid bond from his surety", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    // Ava makes two of the three files. The surety's bid bond is his upload.
    const { files } = planDownload({ id: ID, bid, s }, null, "pdf");
    expect(files.map((f) => f.name)).toEqual([
      "SF1442_and_Bid_Schedule_Ninebark_Builders.pdf",
      "Bidder_Qualifications_Ninebark_Builders.pdf",
    ]);
    expect(packageParts(bid).map((p) => p.file.name)).toContain("Bid_Bond_SF24_Ninebark_Builders.pdf");
  });

  test("the people: the page's contracting officer, and one phone and email per contact", () => {
    const bid = getAvaBid(ID)!;
    const page = contactFor(getOpportunity(ID)!);
    expect(bid.overview?.contact?.name).toBe(page.name);
    expect(bid.overview?.contact?.email).toBe(page.email);
    const v = constructionAnswers["nb-ask-refcontacts"].values!;
    expect(v["nb-fld-ref1-email"]).toBe(REFERENCE_CONTACTS.raymondOxendine.email);
    expect(v["nb-fld-ref2-phone"]).toBe(REFERENCE_CONTACTS.lornaBatchelor.phone);
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
    walk(constructionAnswers);
    expect(words.filter((w) => FOREIGN.test(w) || AGENCY_WORDS.test(w))).toEqual([]);
    expect(words.map((w) => copyProblem(w)).filter(Boolean)).toEqual([]);
  });
});
