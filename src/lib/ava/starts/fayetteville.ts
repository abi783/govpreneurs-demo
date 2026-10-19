// Where the Fayetteville bid starts in the demo. See src/lib/ava/start.ts.
//
// The story (src/demo/story/opportunities.ts, FAYNC-2026-R-08) says: Ava
// finished the proposal, Sarah Mitchell reviewed it, and the card reads
// "Sarah Mitchell reviewed your proposal. Read her notes, then send it."
// That is phase 2, stage "read".
//
// The state is built the way the product builds it. The member answers every
// question Ava asks (the loop below does what play.ts does), Ava checks the
// bid, the member opens it to read (`readOpened`), and Sarah's two edits arrive
// from the mentor dashboard. The check ran on the final bid, so opening the
// page writes nothing.
//
// This file does not import play.ts. play.ts imports the sample bids, and this
// file runs when a sample bid is first read, so the two would import each
// other. testLab.ts reads the sample bids when it loads, and it would fail
// ("Cannot access AVA_BIDS before initialization") when the page loads the
// fixtures first. The loop below keeps this file free of that cycle.

import { MEMBER_EIN, REFERENCE_CONTACTS } from "../../../demo/ava/contacts";
import { PAST_PERFORMANCE, findPastPerformance } from "../../../demo/story/persona";
import { effectiveBid } from "../derive";
import { fayettevilleBid } from "../fixtures/fayetteville";
import { ISO } from "../fixtures/when";
import { checkFixes, checkSig, flowOf, riskAllowed, STAFFING_KEY, type Question } from "../flow";
import { withGrantFor } from "../grant";
import { approvalTotal } from "../price";
import { decisionKey, emptyState, type AskAnswer, type BidState } from "../store";
import { sentencesOf } from "../thread";
import type { Ask, AvaBid } from "../types";

const ID = "FAYNC-2026-R-08";

const job = (id: string) => findPastPerformance(id)!;
const COUNTY = job("pp-county-schools");
const BRAGG = job("pp-cdg-sub");
const CHURCH = job("pp-church");

/** She built the bid three days ago and sent it to Sarah two days ago. Every
 *  answer carries the day she gave it, so a proof says when she answered. */
const BUILT_AT = ISO(-3, 15);

// ─── What she told Ava ───────────────────────────────────────────────────────
// A plain sample answer reads "Sample answer" or "Sample upload.pdf". On a sales
// call she must see real words, so every ask that shows its answer on screen has
// one here. The numbers build a year-one price of about $210,000.

/** The paper she sent for each upload ask. */
const PAPERS: Record<string, string> = {
  "ask-insurance": "Haddad Catering certificate of insurance.pdf",
  "ask-floorplan": "Exhibit D cafe kitchen floor plan.pdf",
  "ask-resume": "Kitchen manager resume.pdf",
  "ask-payroll": "2025 payroll summary.pdf",
  "ask-pl": "2025 profit and loss statement.pdf",
  "ask-servsafe": "ServSafe manager certificates.pdf",
  "ask-recent-events": "Event jobs since 2022.pdf",
  "ask-permit": "Cumberland County food service permit and inspection report.pdf",
};

/** The words and numbers she typed for each enter ask. */
const TYPED: Record<string, Record<string, number | string>> = {
  "ask-ref-contacts": {
    "ref1-phone": REFERENCE_CONTACTS.janetReyes.phone,
    "ref1-email": REFERENCE_CONTACTS.janetReyes.email,
    "ref2-phone": REFERENCE_CONTACTS.mikeSutton.phone,
    "ref2-email": REFERENCE_CONTACTS.mikeSutton.email,
    "ref3-phone": REFERENCE_CONTACTS.pastorHall.phone,
    "ref3-email": REFERENCE_CONTACTS.pastorHall.email,
  },
  "ask-city-vendor": { "vendor-number": "CV-48215", "tax-id": MEMBER_EIN },
  "ask-pay-rates": { "pay-manager": 23.5, "pay-cook": 17.5, "pay-server": 14.5 },
  "ask-food-cost": { "food-lunch": 3.5, "food-guest": 7.5 },
  "ask-other-costs": { "cost-vehicle": 170, "cost-permit": 350, "cost-renewal": 180 },
  "ask-contingency": { contingency: 3 },
  "ask-profit": { "profit-rate": 6 },
  "ask-food-safety": {
    "temp-check": "Every hour during service, and at each handoff",
    "temp-record": "On a signed log sheet at the hot line. The manager reviews it each day",
    "missed-fix": "The cook replaces or reheats the item at once. The manager logs it",
  },
  "ask-backup-manager": {
    "backup-name": "Sam Ortiz",
    "backup-role": "our head cook, who holds a ServSafe manager certificate",
  },
};

/** Her answer to one ask. A choice is the first one that keeps the bid alive. */
function answerOf(ask: Ask): AskAnswer {
  const at = BUILT_AT;
  const spec = ask.answer;
  switch (spec.type) {
    case "enter":
      return { status: "done", at, values: TYPED[ask.id] };
    case "upload":
      return {
        status: "done",
        at,
        fileName: PAPERS[ask.id],
        values: spec.extracts
          ? Object.fromEntries(spec.extracts.map((x) => [x.fieldId, x.value]))
          : undefined,
      };
    case "answer":
      return { status: "done", at, choiceId: spec.choices.find((c) => !c.failsGate)?.id };
    case "approve":
      return { status: "done", at };
  }
}

// ─── Playing the bid forward ─────────────────────────────────────────────────

function look(s: BidState) {
  const g = withGrantFor(ID, fayettevilleBid, s, {});
  const bid = effectiveBid(g.fixture, g.s);
  return { bid, s: g.s, flow: flowOf(bid, g.s, { now: Date.now() }) };
}

/** Her plain answer to one question, as a state change. */
function answerQuestion(bid: AvaBid, s: BidState, q: Question): BidState {
  const at = BUILT_AT;
  const trail = [...s.trail.filter((k) => k !== q.key), q.key];
  if (q.kind === "must" && q.key.startsWith("must:")) {
    return { ...s, mustHave: { ...s.mustHave, [q.rule!.id]: { says: "have", at } }, trail };
  }
  if ((q.kind === "ask" || q.kind === "must") && q.ask) {
    return { ...s, answers: { ...s.answers, [q.ask.id]: answerOf(q.ask) }, trail };
  }
  if (q.kind === "promise" && q.commitment) {
    return {
      ...s,
      commitments: { ...s.commitments, [q.commitment.id]: { at, text: q.commitment.text } },
      trail,
    };
  }
  if (q.kind === "decision" && q.decision) {
    const k = decisionKey(q.decision.sectionId, q.decision.decision.id);
    return { ...s, decisions: { ...s.decisions, [k]: { pick: "ava", at } }, trail };
  }
  if (q.kind === "staffing")
    return {
      ...s,
      fixes: { ...s.fixes, [STAFFING_KEY]: true },
      trail: [...s.trail, `fix:${STAFFING_KEY}`],
    };
  if (q.kind === "price") {
    const total = approvalTotal(bid, s);
    return total === null ? s : { ...s, priceApproval: { at, total }, trail };
  }
  if (q.kind === "clar" && q.clar) {
    return {
      ...s,
      clarifications: {
        ...s.clarifications,
        [q.clar.id]: { ...s.clarifications[q.clar.id], sentAt: at },
      },
      trail,
    };
  }
  if (q.kind === "fix" && q.finding) {
    if (q.finding.fix) return { ...s, fixes: { ...s.fixes, [q.finding.fix.key]: true }, trail };
    // A rule that rejects the bid is never taken at risk: it stays open.
    if (!riskAllowed(q.finding))
      return {
        ...s,
        left: { ...s.left, [q.key]: { at, for: "me" } },
        trail: [...s.trail, `left:${q.key}`],
      };
    return {
      ...s,
      risks: {
        ...s.risks,
        [q.finding.id]: {
          reason: "I will fix this before I send it",
          severity: q.finding.severity,
          label: q.finding.title,
          at,
        },
      },
      trail,
    };
  }
  return s;
}

/** Answer each question in the order Ava asks it, and let Ava check the bid,
 *  until the bid is ready. Reading and checking take no time here. */
function playToReady(): BidState {
  const t = Date.now();
  let cur: BidState = {
    ...emptyState(),
    started: true,
    briefConfirmed: true,
    read: { startedAt: t - 180_000, doneAt: t },
  };
  for (let i = 0; i < 300; i++) {
    const { bid, s: seen, flow } = look(cur);
    cur = { ...cur, answers: seen.answers };
    if (flow.stage === "ready") return cur;
    if (flow.stage === "checking") {
      const fixes = checkFixes(bid, cur);
      cur = {
        ...cur,
        fixes: { ...cur.fixes, ...Object.fromEntries(fixes.map((f) => [f.key, true as const])) },
        avaFixes: {
          ...cur.avaFixes,
          ...Object.fromEntries(fixes.map((f) => [f.key, { text: f.text, at: BUILT_AT }])),
        },
        check: { startedAt: t - 40_000, doneAt: t, sig: "" },
      };
      cur = { ...cur, check: { ...cur.check!, sig: checkSig(cur) } };
      continue;
    }
    if (!flow.current) break;
    const next = answerQuestion(bid, cur, flow.current);
    if (next === cur) break;
    cur = next;
  }
  throw new Error(
    `${ID}: the sample answers did not bring the bid to ready (${look(cur).flow.stage}).`,
  );
}

// ─── What Sarah changed ──────────────────────────────────────────────────────
// Her review is in Mentor Reviews (src/demo/state/mentorReviews.ts). Three
// notes: events first in part 2, the county program as daily service, Janet
// Reyes as the first reference. The draft already puts events first. She wrote
// the other two into part 2 herself, marked with her name.

/** Note 2: the county summer program, called what it is. */
const DAILY_SERVICE =
  "This was daily service. The team cooked and delivered 1,100 breakfasts and lunches a day to 9 sites across Fayetteville for 11 weeks.";

/** Note 3: Janet Reyes first. */
const REFERENCES_IN_ORDER = [
  `The first is ${COUNTY.referenceName}, ${COUNTY.referenceTitle}.`,
  `The second is ${BRAGG.referenceName}, ${BRAGG.referenceTitle}.`,
  `The third is ${CHURCH.referenceName}, ${CHURCH.customerName}.`,
].join(" ");

function withSarahsEdits(s: BidState): BidState {
  const { bid } = look(s);
  const sentences = sentencesOf(bid, s, "sec-experience").flat();
  const notes: [RegExp, string][] = [
    [/^The team cooked and delivered 1,100 breakfasts and lunches a day/, DAILY_SERVICE],
    [/^They are .*; and .*\.$/, REFERENCES_IN_ORDER],
  ];
  const edits = { ...s.edits };
  for (const [find, now] of notes) {
    const x = sentences.find((y) => find.test(y.text));
    // A sentence that is gone leaves the draft as it is. Never a half edit.
    if (!x) continue;
    edits[x.key] = {
      sectionId: x.sectionId,
      paragraph: x.paragraph,
      was: x.text,
      now,
      by: "mentor",
      at: ISO(0, 9, 30),
    };
  }
  const edited = { ...s, edits };
  // Ava checks a mentor's changes like her own (flow.ts checkSig). The check
  // ran on the bid as it stands now, so it needs no second run.
  return edited.check ? { ...edited, check: { ...edited.check, sig: checkSig(edited) } } : edited;
}

export function fayettevilleStart(): Partial<BidState> {
  return withSarahsEdits({ ...playToReady(), readOpened: true });
}
