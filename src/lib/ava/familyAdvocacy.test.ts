// The agency's hero bid in Ava (fixtures/familyAdvocacy.ts): it starts where
// the story says, the three questions behave as the pack says (section 8),
// every claim carries its source, and the bid reaches the files she sends.
// DEMO: the bid is Dana's whichever member is on stage, so this runs in both
// test runs (DEMO_MEMBER=agency and the caterer default).
//
//   bunx vitest run src/lib/ava/familyAdvocacy.test.ts

import { describe, expect, test } from "vitest";
import { copyProblem } from "../../../qa/copyRules";
import { contactFor } from "../../demo/grant/facts";
import { REFERENCE_CONTACTS } from "../../demo/ava/contacts";
import { getGrantBrief } from "../../demo/story/grantBriefs";
import { getOpportunity } from "../../demo/story/opportunities";
import { planDownload } from "../../components/Ava/downloads";
import { exactChecks } from "./checks";
import { nowIso } from "./dates";
import { bidDecision, claimView, sectionParagraphs } from "./derive";
import {
  FAMILY_ADVOCACY_ID as ID,
  FAMILY_ADVOCACY_OPEN,
  familyAdvocacyAnswers,
  familyAdvocacyBid,
} from "./fixtures/familyAdvocacy";
import { getAvaBid } from "./fixtures";
import { look, play, ready, reading, stage, started, type Pick } from "./play";
import { passToGrant } from "./grant";
import { requirementStatus } from "./checks";
import { packageParts, partLabel } from "./package";
import { approvalTotal, periodTotals } from "./price";
import { startingState } from "./start";
import { emptyState, type BidState } from "./store";
import { threadOf } from "./thread";
import { grantRead } from "../../demo/ava/grantRead";
import { findOpportunity } from "../../demo/ava/opportunity";
import { grantFacts, resetAllGrantFacts } from "../../demo/ava/grantFacts";

/** The words the agency's pages must never show (demo-storyboard/tools/scan-member.mjs). */
const CATERER_WORDS =
  /\b(cater\w*|meals?|kitchen|food[- ]?(service|handler)?|cooks?|dining|menus?|ServSafe|Haddad|Amira|722310|Camp Mackall|Womack|Carolina Dining|Marcus)\b/i;

/** Her answer to one of the three questions, as a tap would give it. */
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

/** Where the bid starts, with the story's seed. */
function atStart(): BidState {
  return { ...emptyState(), ...startingState(ID) };
}

/** The chip a claim shows in her bid (components/Ava/BidText.tsx). */
function chip(
  bid: ReturnType<typeof look>["bid"],
  s: BidState,
  claim: NonNullable<Parameters<typeof claimView>[2]>,
) {
  const v = claimView(bid, s, claim);
  if (v.tag === "unsupported") return "HOLE";
  if (v.tag === "commitment") return "Your promise";
  return (
    (
      {
        "you-confirmed": "Your answer",
        profile: "Your profile",
        "your-document": "Your file",
        sam: "SAM.gov",
      } as const
    )[v.proof!.kind as "sam"] ?? "Your records"
  );
}

describe("the agency's Family Advocacy quote", () => {
  test("it is the story's hero: title, buyer, kind and due date", () => {
    const o = getOpportunity(ID)!;
    const bid = getAvaBid(ID)!;
    expect(bid.officialTitle).toBe(o.title);
    expect(bid.buyer).toBe(o.agency);
    expect(bid.kind).toBe(o.ava!.kind);
    expect(bid.deadline.dueDaysFromNow).toBe(o.closesInDays);
    expect(`${bid.deadline.time} ${bid.deadline.zone}`).toBe("11:00 AM Eastern Time");
    expect(o.dueTime).toBe("11:00 AM Eastern");
    expect(bid.deadline.questionsDueDaysFromNow).toBe(
      getGrantBrief(ID)!.keyDates.find((k) => k.label === "Questions due")!.inDays,
    );
    expect(bid.price?.periods?.count).toBe(4);
  });

  test("it starts at answer my questions, with the pack's three questions in order", () => {
    const { flow, s } = look(ID, atStart());
    expect(s.started).toBe(true);
    expect(flow.stage).toBe("answer");
    expect(flow.queue.map((q) => q.key)).toEqual(FAMILY_ADVOCACY_OPEN);
    // Her price and her promises are already approved.
    expect(s.priceApproval?.total).toBe(approvalTotal(look(ID, s).bid, s));
    expect(Object.keys(s.commitments)).toHaveLength(
      familyAdvocacyBid.commitments.filter((c) => c.needsApproval).length,
    );
  });

  test("each question offers the pack's three choices", () => {
    const labels = (askId: string) => {
      const a = familyAdvocacyBid.asks.find((x) => x.id === askId)!.answer;
      return a.type === "answer" ? a.choices.map((c) => c.label) : [];
    };
    expect(labels("fa-ask-pm")).toEqual([
      "I lead it. Tasha Greene, our account director, is the alternate",
      "Tasha Greene leads it. I am the alternate",
      "We hire a project manager after award",
    ]);
    expect(labels("fa-ask-videos")).toEqual([
      "All in-house, with our 2-person crew",
      "In-house, plus a freelancer in busy months",
      "A local production company makes them",
    ]);
    expect(labels("fa-ask-app")).toEqual([
      "A news partner's app. Say so in the quote",
      "Wait for the Army's answer in Q&A",
      "Take an exception to the app line",
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
    for (const c of ["SAM.gov", "Your profile", "Your file", "Your answer"])
      expect(chips).toContain(c);
  });

  test("hiring a project manager after award goes through, flagged as a risk", () => {
    const s = ready(ID, atStart(), choosing("fa-ask-pm", "pm-hire"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const rule = bid.hardRequirements.find((r) => r.id === "fa-r-pm")!;
    const v = requirementStatus(bid, s, rule);
    expect(v.status).toBe("confirm");
    expect(v.evidence).toMatch(/^A risk/);
    const said = threadOf({
      bid,
      s,
      flow,
      now: Date.now(),
      memberName: "Dana Okafor",
      grant: null,
      mentor: null,
    });
    const ack = said.find((t) => t.key === "ack:ask:fa-ask-pm");
    expect(ack?.kind === "ava" && ack.lines[0]).toMatch(/^That is a risk/);
    const text = sectionParagraphs(s, bid.sections[0])
      .flat()
      .map((sp) => claimText(bid, s, sp))
      .join("");
    expect(text).toContain("will hire a project manager after award");
  });

  test("an exception to the app line is non-compliant: Ava pauses the bid and Grant says No Bid", () => {
    resetAllGrantFacts();
    const s = play(ID, atStart(), stage("ready"), choosing("fa-ask-app", "app-exception"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("paused");
    expect(bidDecision(bid, s)?.reason).toMatch(/non-compliant/);
    passToGrant(ID, bid, s);
    expect(grantRead(findOpportunity(ID)!, grantFacts(ID)).call).toBe("No Bid");
    resetAllGrantFacts();
  });

  test("waiting for the Army's answer goes through, and says she asked", () => {
    const s = ready(ID, atStart(), choosing("fa-ask-app", "app-wait"));
    const { bid, flow } = look(ID, s);
    expect(flow.stage).toBe("ready");
    const text = sectionParagraphs(s, bid.sections[0])
      .flat()
      .map((sp) => claimText(bid, s, sp))
      .join("");
    expect(text).toContain("asked the Army in writing");
  });

  test("the price: five fixed years at her 3% increase, about $215K in the base year", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const years = periodTotals(bid, s).map((p) => p.total!);
    expect(years).toHaveLength(5);
    expect(years[0]).toBeGreaterThan(190_000);
    expect(years[0]).toBeLessThan(240_000);
    for (let i = 1; i < years.length; i++) expect(years[i]).toBeGreaterThan(years[i - 1]);
  });

  test("the presenter's jump plays her own answers, not the samples", () => {
    const s = reading(ready(ID));
    expect(s.answers["fa-ask-pm"]?.choiceId).toBe("pm-owner");
    expect(s.answers["fa-ask-videos"]?.choiceId).toBe("v-freelance");
    expect(s.answers["fa-ask-media"]?.values).toEqual(familyAdvocacyAnswers["fa-ask-media"].values);
    expect(look(ID, s).flow.stage).toBe("read");
    // From an empty bid too, as segment 8 does it.
    expect(look(ID, ready(ID, started())).flow.stage).toBe("ready");
  });

  test("the files: her name on each, the Army's Excel price schedule back as Excel", () => {
    const { bid, s } = look(ID, ready(ID, atStart()));
    const { files } = planDownload({ id: ID, bid, s }, null, "pdf");
    expect(files.map((f) => [f.name, f.kind])).toEqual([
      ["Volume_I_Technical_Approach_Lantern_Row_Creative.pdf", "pdf"],
      ["Volume_II_Past_Performance_Lantern_Row_Creative.pdf", "pdf"],
      ["Volume_III_Price_Schedule_Lantern_Row_Creative.xlsx", "xlsx"],
      ["Signed_Forms_Lantern_Row_Creative.pdf", "pdf"],
    ]);
    expect(packageParts(bid).map((p) => p.label)).toEqual([
      "Volume I technical approach",
      "Volume II past performance",
      "Volume III price schedule",
      "Signed forms",
    ]);
    expect(partLabel(bid, "Volume_I_Technical_Approach_Lantern_Row_Creative.pdf")).toBe(
      "Volume I technical approach",
    );
  });

  test("the people: the page's contracting officer, and one phone and email per reference", () => {
    const bid = getAvaBid(ID)!;
    const page = contactFor(getOpportunity(ID)!);
    expect(bid.overview?.contact?.name).toBe(page.name);
    expect(bid.overview?.contact?.email).toBe(page.email);
    expect(bid.submission.account).toBe(page.email);
    const v = familyAdvocacyAnswers["fa-ask-refcontacts"].values!;
    expect(v["fld-ref1-email"]).toBe(REFERENCE_CONTACTS.owenPryor.email);
    expect(v["fld-ref2-phone"]).toBe(REFERENCE_CONTACTS.teresaWynn.phone);
    expect(v["fld-ref3-email"]).toBe(REFERENCE_CONTACTS.gloriaPratt.email);
    for (const c of [
      REFERENCE_CONTACTS.owenPryor,
      REFERENCE_CONTACTS.teresaWynn,
      REFERENCE_CONTACTS.gloriaPratt,
    ])
      expect(c.email).toMatch(/\.example$/);
  });

  test("no caterer word, and no copy-rule mistake, in any of its words", () => {
    const words: string[] = [];
    const walk = (n: unknown) => {
      if (typeof n === "string") words.push(n);
      else if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === "object") Object.values(n).forEach(walk);
    };
    walk(getAvaBid(ID));
    walk(familyAdvocacyAnswers);
    expect(words.filter((w) => CATERER_WORDS.test(w))).toEqual([]);
    expect(words.map((w) => copyProblem(w)).filter(Boolean)).toEqual([]);
  });
});

/** A span's words as her bid reads them. */
function claimText(
  bid: ReturnType<typeof look>["bid"],
  s: BidState,
  sp: { text: string; claim?: Parameters<typeof claimView>[2] },
) {
  if (!sp.claim) return sp.text;
  const v = claimView(bid, s, sp.claim);
  return v.text ?? sp.text;
}
