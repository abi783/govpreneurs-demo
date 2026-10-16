// Ava — tests for the rules added after the first review (29 Sep 2026).
//
//   bun test src/lib/ava
//
// Each test builds a small synthetic bid on top of a sample bid's files, so the
// rule is tested on its own and not through whatever the fixtures happen to hold.
// The reviewers' findings these cover:
//   · a hard requirement read "Meets" after ANY answer, even one that fails it
//   · an addendum changed a promise but the draft still stated the old one
//   · option periods were never priced
//   · a bid deposit was never compared with the total
//   · a stand-in ("I don't have this") zeroed a cost that still exists
//   · a pasted reply cleared a question to the buyer

import { describe, expect, test } from "vitest";
import { exactChecks, findingState, requirementStatus, reviewerChecks } from "./checks";
import {
  claimView,
  clarificationStatus,
  effectiveBid,
  reqStatus,
  requirementChangedBy,
  sectionParagraphs,
} from "./derive";
import { fayettevilleBid } from "./fixtures/fayetteville";
import { fortBraggReplyBid } from "./fixtures/fortBraggReply";
import { mackallBid } from "./fixtures/mackall";
import { packageParts } from "./package";
import { complianceItems } from "./pages";
import {
  approvalTotal,
  linePrices,
  missingPriceAsks,
  otherCostAmount,
  periodTotals,
  PRICE_YOURSELF_KEY,
  sheetTotal,
  YOUR_PRICES_ASK,
} from "./price";
import { findOpportunity } from "../../demo/ava/opportunity";
import { avaReview, avaScope } from "./scope";
import { progress } from "./status";
import { emptyState, type BidState } from "./store";
import { completeState } from "./testLab";
import type { Ask, AvaBid, Claim, HardRequirement, Source } from "./types";

const SRC: Source = { fileId: fayettevilleBid.files[0].id, locator: "Section 1", short: "§1" };

function withState(patch: Partial<BidState>): BidState {
  return { ...emptyState(), started: true, briefConfirmed: true, ...patch };
}

function answerAsk(id: string, extra: Partial<Ask> & Pick<Ask, "answer">): Ask {
  return {
    id,
    kind:
      extra.answer.type === "enter"
        ? "enter"
        : extra.answer.type === "upload"
          ? "upload"
          : "answer",
    title: id,
    source: SRC,
    why: "Test.",
    owner: "you",
    leadDays: 1,
    minutes: 5,
    feeds: [],
    ...extra,
  };
}

function bidWith(asks: Ask[], reqs: HardRequirement[]): AvaBid {
  const b = structuredClone(fayettevilleBid);
  b.asks = asks;
  b.hardRequirements = reqs;
  return b;
}

const at = "2026-05-07T12:00:00.000Z";

describe("hard requirements are judged by the answer", () => {
  const visit = answerAsk("visit", {
    answer: {
      type: "answer",
      question: "Will you attend?",
      choices: [
        {
          id: "yes",
          label: "Yes",
          gives: { status: "confirm", evidence: "You plan to attend." },
          opensAskId: "signed",
        },
        { id: "no", label: "No one can attend", failsGate: "Non-attendees are rejected." },
      ],
    },
  });
  const signed = answerAsk("signed", {
    hiddenUntilOpened: true,
    answer: {
      type: "answer",
      question: "Did you sign the sheet?",
      choices: [
        { id: "signed-yes", label: "Yes, we signed it" },
        { id: "signed-no", label: "No, we missed it", failsGate: "Non-attendees are rejected." },
      ],
    },
  });
  const req: HardRequirement = {
    id: "r-visit",
    label: "Site visit",
    source: SRC,
    initial: "not-yet",
    askId: "visit",
    askIds: ["signed"],
  };
  const bid = bidWith([visit, signed], [req]);

  test("a failing choice is Not yet, never Meets", () => {
    const s = withState({ answers: { visit: { status: "done", choiceId: "no", at } } });
    expect(reqStatus(bid, s, req).status).toBe("not-yet");
    const f = exactChecks(effectiveBid(bid, s), s).findings.find((x) => x.id === "req:r-visit");
    expect(f?.severity).toBe("critical");
  });

  test("a plan to attend is Confirm until the sheet is signed", () => {
    const planned = withState({ answers: { visit: { status: "done", choiceId: "yes", at } } });
    expect(reqStatus(bid, planned, req)).toEqual({
      status: "confirm",
      evidence: "You plan to attend.",
    });
    const signedState = withState({
      answers: {
        visit: { status: "done", choiceId: "yes", at },
        signed: { status: "done", choiceId: "signed-yes", at },
      },
    });
    expect(reqStatus(bid, signedState, req).status).toBe("meets");
    const missed = withState({
      answers: {
        visit: { status: "done", choiceId: "yes", at },
        signed: { status: "done", choiceId: "signed-no", at },
      },
    });
    expect(reqStatus(bid, missed, req).status).toBe("not-yet");
  });

  test("not answering is Material, not red", () => {
    const s = withState({});
    const f = exactChecks(effectiveBid(bid, s), s).findings.find((x) => x.id === "req:r-visit");
    expect(f?.severity).toBe("material");
  });

  test("pay under the floor is Not yet", () => {
    const pay = answerAsk("pay", {
      answer: {
        type: "enter",
        fields: [
          {
            id: "cook",
            label: "Cook",
            unit: "usd-hour",
            floor: { value: 17.9, why: "Wage determination." },
          },
        ],
      },
    });
    const r: HardRequirement = {
      id: "r-wage",
      label: "Wages",
      source: SRC,
      initial: "confirm",
      askId: "pay",
    };
    const b = bidWith([pay], [r]);
    expect(
      reqStatus(b, withState({ answers: { pay: { status: "done", values: { cook: 15 }, at } } }), r)
        .status,
    ).toBe("not-yet");
    expect(
      reqStatus(b, withState({ answers: { pay: { status: "done", values: { cook: 18 }, at } } }), r)
        .status,
    ).toBe("meets");
  });

  test("a stand-in meets the rule only when it says it does", () => {
    const cert = answerAsk("cert", {
      answer: { type: "upload", accepts: "Your certificate" },
      dontHave: [
        {
          id: "exam",
          label: "Take the exam",
          detail: "Step.",
          outcome: "new-ask",
          opensAskId: "exam-date",
        },
        {
          id: "hire",
          label: "Hire with a letter",
          detail: "Allowed.",
          outcome: "new-ask",
          opensAskId: "loi",
          satisfies: true,
        },
      ],
    });
    const examDate = answerAsk("exam-date", {
      hiddenUntilOpened: true,
      answer: { type: "enter", fields: [{ id: "date", label: "Exam date", unit: "text" }] },
    });
    const loi = answerAsk("loi", {
      hiddenUntilOpened: true,
      answer: { type: "upload", accepts: "The letter" },
    });
    const r: HardRequirement = {
      id: "r-cert",
      label: "Certificate",
      source: SRC,
      initial: "confirm",
      askId: "cert",
    };
    const b = bidWith([cert, examDate, loi], [r]);
    const exam = withState({
      answers: {
        cert: { status: "dont-have", optionId: "exam", at },
        "exam-date": { status: "done", values: { date: "18 May" }, at },
      },
    });
    expect(reqStatus(b, exam, r).status).toBe("confirm");
    const hire = withState({
      answers: {
        cert: { status: "dont-have", optionId: "hire", at },
        loi: { status: "done", fileName: "loi.pdf", at },
      },
    });
    expect(reqStatus(b, hire, r).status).toBe("meets");
  });

  test("every listed ask must pass (three references are three asks)", () => {
    const ref = (id: string) =>
      answerAsk(id, { answer: { type: "approve", proposal: id, from: "profile" } });
    const r: HardRequirement = {
      id: "r-refs",
      label: "Three references",
      source: SRC,
      initial: "confirm",
      askId: "ref1",
      askIds: ["ref2", "ref3"],
    };
    const b = bidWith([ref("ref1"), ref("ref2"), ref("ref3")], [r]);
    const two = withState({
      answers: { ref1: { status: "done", at }, ref3: { status: "done", at } },
    });
    expect(reqStatus(b, two, r).status).toBe("confirm");
    const three = withState({
      answers: {
        ref1: { status: "done", at },
        ref2: { status: "done", at },
        ref3: { status: "done", at },
      },
    });
    expect(reqStatus(b, three, r).status).toBe("meets");
  });
});

describe("addenda", () => {
  test("a rule an addendum rewrote reopens until the member confirms it", () => {
    const r: HardRequirement = { id: "r-permit", label: "Permit", source: SRC, initial: "meets" };
    const b = bidWith([], [r]);
    b.addenda = [
      {
        id: "a9",
        number: 9,
        fileId: SRC.fileId,
        postedDaysFromNow: -1,
        arrivesDuringBuild: false,
        otherChanges: 0,
        stillValid: "Everything else.",
        changes: [
          {
            id: "c1",
            what: "Kitchen distance",
            source: SRC,
            before: "Any",
            now: "Within 30 miles",
            effect: "reopened",
            effectText: "Confirm you still meet it.",
            patch: {
              kind: "requirement",
              requirementId: "r-permit",
              label: "Permit, kitchen within 30 miles",
            },
          },
        ],
      },
    ];
    const s = withState({});
    expect(requirementChangedBy(b, s, "r-permit")?.number).toBe(9);
    expect(reqStatus(effectiveBid(b, s), s, effectiveBid(b, s).hardRequirements[0]).status).toBe(
      "confirm",
    );
    const confirmed = withState({ fixes: { "reconfirm:r-permit": true } });
    expect(reqStatus(effectiveBid(b, confirmed), confirmed, r).status).toBe("meets");
  });

  test("a draft-text patch rewrites the sentence; without one the check says the writing is stale", () => {
    const b = structuredClone(fayettevilleBid);
    const sec = b.sections.find((x) =>
      x.paragraphs.some((p) => p.some((sp) => sp.claim?.tag === "commitment")),
    )!;
    const pi = sec.paragraphs.findIndex((p) => p.some((sp) => sp.claim?.tag === "commitment"));
    const span = sec.paragraphs[pi].find((sp) => sp.claim?.tag === "commitment")!;
    const cid = span.claim!.commitmentId!;
    const change = {
      id: "cx",
      what: "The promise",
      source: SRC,
      before: "old",
      now: "new wording",
      effect: "reopened" as const,
      effectText: "Your approval comes back to you.",
      patch: { kind: "commitment" as const, commitmentId: cid, text: "new wording" },
    };
    b.addenda = [
      {
        id: "ax",
        number: 7,
        fileId: SRC.fileId,
        postedDaysFromNow: -1,
        arrivesDuringBuild: false,
        otherChanges: 0,
        stillValid: "x",
        changes: [change],
      },
    ];
    const s = withState({});
    const stale = exactChecks(effectiveBid(b, s), s).findings.map((f) => f.id);
    expect(stale).toContain(`stale-promise:${cid}`);

    b.addenda[0].changes[0] = {
      ...change,
      alsoPatches: [
        {
          kind: "draft-text",
          sectionId: sec.id,
          paragraphIndex: pi,
          remove: span.text,
          insert: [{ text: "NEW PROMISE TEXT", claim: span.claim }],
        },
      ],
    };
    const eff = effectiveBid(b, s);
    const text = sectionParagraphs(s, eff.sections.find((x) => x.id === sec.id)!)
      [pi].map((x) => x.text)
      .join("");
    expect(text).toContain("NEW PROMISE TEXT");
    expect(text).not.toContain(span.text);
    expect(exactChecks(eff, s).findings.map((f) => f.id)).not.toContain(`stale-promise:${cid}`);
  });
});

describe("price", () => {
  test("option periods are priced at the member's yearly increase, and approval covers them", () => {
    const b = structuredClone(fayettevilleBid);
    const s = completeState(b);
    b.asks.push(
      answerAsk("esc", {
        answer: {
          type: "enter",
          fields: [{ id: "pct", label: "Yearly increase", unit: "percent" }],
        },
      }),
    );
    b.price!.periods = {
      count: 2,
      label: "Option year",
      escalation: { askId: "esc", fieldId: "pct" },
      source: SRC,
    };
    const unknown = periodTotals(b, s);
    expect(unknown[1].total).toBeNull();
    expect(approvalTotal(b, s)).toBeNull();
    const withEsc = {
      ...s,
      answers: { ...s.answers, esc: { status: "done" as const, values: { pct: 3 }, at } },
    };
    const periods = periodTotals(b, withEsc);
    const base = sheetTotal(linePrices(b, withEsc))!;
    expect(periods).toHaveLength(3);
    expect(periods[1].total! / base).toBeCloseTo(1.03, 2);
    expect(periods[2].total! / base).toBeCloseTo(1.0609, 2);
    expect(approvalTotal(b, withEsc)).toBeCloseTo(
      periods.reduce((n, p) => n + p.total!, 0),
      2,
    );
  });

  test("a stand-in keeps a cost unknown unless it has no fee or its own amount", () => {
    const b = structuredClone(fayettevilleBid);
    const cost = b.price!.otherCosts.find((c) => c.yearly.kind === "ask")!;
    if (cost.yearly.kind !== "ask") throw new Error("fixture shape");
    const askId = cost.yearly.askId;
    const ask = b.asks.find((a) => a.id === askId)!;
    ask.dontHave = [
      {
        id: "free",
        label: "Free stand-in",
        detail: "x",
        outcome: "new-ask",
        opensAskId: "alt",
        noFee: true,
      },
      { id: "paid", label: "Paid stand-in", detail: "x", outcome: "new-ask", opensAskId: "alt" },
    ];
    b.asks.push(
      answerAsk("alt", {
        hiddenUntilOpened: true,
        answer: { type: "enter", fields: [{ id: "amt", label: "Amount", unit: "usd" }] },
      }),
    );
    const free = withState({ answers: { [askId]: { status: "dont-have", optionId: "free", at } } });
    expect(otherCostAmount(b, free, cost)).toBe(0);
    const paid = withState({ answers: { [askId]: { status: "dont-have", optionId: "paid", at } } });
    expect(otherCostAmount(b, paid, cost)).toBeNull();
    cost.altFrom = { askId: "alt", fieldId: "amt" };
    const paidAlt = withState({
      answers: {
        [askId]: { status: "dont-have", optionId: "paid", at },
        alt: { status: "done", values: { amt: 900 }, at },
      },
    });
    expect(otherCostAmount(b, paidAlt, cost)).toBe(900);
  });

  test("a bid deposit under the percent of the total is critical", () => {
    const b = structuredClone(fayettevilleBid);
    const s = completeState(b);
    b.asks.push(
      answerAsk("bond", {
        answer: { type: "upload", accepts: "Bond" },
        dontHave: [
          {
            id: "check",
            label: "Certified check",
            detail: "x",
            outcome: "new-ask",
            opensAskId: "chk",
            satisfies: true,
            noFee: true,
          },
        ],
      }),
      answerAsk("chk", {
        hiddenUntilOpened: true,
        answer: { type: "enter", fields: [{ id: "amount", label: "Check amount", unit: "usd" }] },
      }),
    );
    b.bidSecurity = {
      percent: 5,
      source: SRC,
      bondAskId: "bond",
      check: { askId: "chk", fieldId: "amount" },
    };
    // The total the check compares with is the effective bid's (addenda applied).
    const total = sheetTotal(linePrices(effectiveBid(b, s), s))!;
    const short = {
      ...s,
      answers: {
        ...s.answers,
        bond: { status: "dont-have" as const, optionId: "check", at },
        chk: { status: "done" as const, values: { amount: Math.floor(total * 0.04) }, at },
      },
    };
    expect(exactChecks(effectiveBid(b, short), short).findings.map((f) => f.id)).toContain(
      "security-amount",
    );
    const enough = {
      ...short,
      answers: {
        ...short.answers,
        chk: { status: "done" as const, values: { amount: Math.ceil(total * 0.05) + 1 }, at },
      },
    };
    expect(exactChecks(effectiveBid(b, enough), enough).findings.map((f) => f.id)).not.toContain(
      "security-amount",
    );
  });
});

describe("questions to the buyer", () => {
  test("a pasted reply alone does not settle the question", () => {
    const b = fayettevilleBid;
    const c = b.clarifications[0];
    const replied = withState({
      clarifications: { [c.id]: { sentAt: at, reply: "lol", replyAt: at } },
    });
    expect(clarificationStatus(b, replied, c.id)).toBe("sent");
    const settled = withState({
      clarifications: { [c.id]: { sentAt: at, reply: "Ten pages.", replyAt: at, settled: true } },
    });
    expect(clarificationStatus(b, settled, c.id)).toBe("answered");
  });
});

describe("verification round (29 Sep 2026)", () => {
  test("a typed correction is Confirm, never Meets", () => {
    const ref = answerAsk("ref", {
      answer: { type: "approve", proposal: "Use this job", from: "profile" },
    });
    const r: HardRequirement = {
      id: "r-ref",
      label: "Reference",
      source: SRC,
      initial: "confirm",
      askId: "ref",
    };
    const b = bidWith([ref], [r]);
    const s = withState({
      answers: { ref: { status: "done", values: { correction: "About 60 meals a day" }, at } },
    });
    expect(reqStatus(b, s, r).status).toBe("confirm");
  });

  test("the deposit reads the same in the brief and the check", () => {
    const b = structuredClone(fayettevilleBid);
    const s0 = completeState(b);
    b.asks.push(
      answerAsk("bond2", {
        answer: { type: "upload", accepts: "Bond" },
        dontHave: [
          {
            id: "check",
            label: "Certified check",
            detail: "x",
            outcome: "new-ask",
            opensAskId: "chk2",
            satisfies: true,
            noFee: true,
          },
        ],
      }),
      answerAsk("chk2", {
        hiddenUntilOpened: true,
        answer: { type: "enter", fields: [{ id: "amount", label: "Check amount", unit: "usd" }] },
      }),
    );
    const req: HardRequirement = {
      id: "r-bond",
      label: "Bid security",
      source: SRC,
      initial: "not-yet",
      askId: "bond2",
    };
    b.hardRequirements.push(req);
    b.bidSecurity = {
      percent: 5,
      source: SRC,
      bondAskId: "bond2",
      check: { askId: "chk2", fieldId: "amount" },
    };
    const s = {
      ...s0,
      answers: {
        ...s0.answers,
        bond2: { status: "dont-have" as const, optionId: "check", at },
        chk2: { status: "done" as const, values: { amount: 100 }, at },
      },
    };
    const eff = effectiveBid(b, s);
    expect(reqStatus(eff, s, req).status).toBe("meets");
    expect(requirementStatus(eff, s, req).status).toBe("not-yet");
    const found = exactChecks(eff, s).findings.map((f) => f.id);
    expect(found).toContain("security-amount");
    expect(found).toContain("req:r-bond");
  });

  test("an uploaded addendum Ava has not compared holds the bid", () => {
    const b = fayettevilleBid;
    const s = { ...completeState(b), addendumUploads: [{ fileName: "Addendum_3.pdf", at }] };
    const f = exactChecks(effectiveBid(b, s), s).findings.find((x) => x.id === "upload:0");
    expect(f?.severity).toBe("critical");
    expect(progress(b, s).phase).not.toBe("ready");
  });

  test("a reviewer finding holds until the answer is in the section", () => {
    const b = fayettevilleBid;
    const rf = b.reviewerFindings.find((x) => x.askId === "ask-backup-manager")!;
    const finding = reviewerChecks(b).find((x) => x.id === `review:${rf.id}`)!;
    const s = completeState(b);
    expect(findingState(b, s, finding)).toBe("answered");
    // The same answer, but the sentence that needed it is gone from the draft:
    // the answer never reached the writing, so the concern stays open.
    const b2 = structuredClone(b);
    for (const sec of b2.sections)
      sec.paragraphs = sec.paragraphs.map((p) =>
        p.map((sp) => (sp.claim?.askId === rf.askId ? { text: sp.text } : sp)),
      );
    expect(findingState(b2, s, finding)).toBe("open");
  });

  test("the draft takes its wording from the member's answer", () => {
    const b = fayettevilleBid;
    // A claim that says one thing for each choice she can make. No sample bid
    // needs one now, so this one is made for the test.
    const claim: Claim = {
      id: "clm-test-choice",
      tag: "unsupported",
      askId: "ask-site-visit",
      gap: "[NEEDED: who went]",
      resolvedByChoice: { "sv-owner": "The owner went.", "sv-staff": "A staff member went." },
    };
    const other = withState({
      answers: { "ask-site-visit": { status: "done", choiceId: "sv-staff", at } },
    });
    expect(claimView(b, other, claim).text).toBe(claim.resolvedByChoice!["sv-staff"]);
    const backup = b.sections
      .flatMap((sec) => sec.paragraphs.flat())
      .find((sp) => sp.claim?.id === "clm-ops-backup")!.claim!;
    const typed = withState({
      answers: {
        "ask-backup-manager": {
          status: "done",
          values: { "backup-name": "Sam Ortiz", "backup-role": "our head cook" },
          at,
        },
      },
    });
    expect(claimView(b, typed, backup).text).toBe(
      "When the manager is out, Sam Ortiz, our head cook, covers the kitchen",
    );
  });
});

test("using the registered name rewrites the draft, not only the check", () => {
  const b = fayettevilleBid;
  const s = withState({ fixes: { "name-sam": true } });
  const eff = effectiveBid(b, s);
  const text = eff.sections
    .flatMap((sec) => sec.paragraphs.flat())
    .map((sp) => sp.text)
    .join(" ");
  expect(text).not.toContain(b.nameInDraft);
  expect(text).toContain(b.samLegalName);
  expect(exactChecks(eff, s).findings.map((f) => f.id)).not.toContain("name-sam");
});

// SAM.gov is the federal registration. A state or local buyer keeps its own
// vendor registration, which Ava tracks as its own requirement. The name check
// on a city bid must not send the member to SAM.gov.
test("the name check names SAM.gov on a federal bid only", () => {
  const s = withState({});
  const city = exactChecks(effectiveBid(fayettevilleBid, s), s).findings.find(
    (f) => f.id === "name-sam",
  )!;
  expect(city.title).not.toMatch(/SAM/);
  expect(city.detail).not.toMatch(/SAM|registration/);
  expect(city.fix?.label).not.toMatch(/registered/);

  const army: AvaBid = { ...mackallBid, nameInDraft: "Haddad Catering and Food Services" };
  const fed = exactChecks(effectiveBid(army, s), s).findings.find((f) => f.id === "name-sam")!;
  expect(fed.title).toContain("SAM.gov registration");
});

// "Price it yourself" (docs/ava/build-progression.md, item 1): when Ava has no
// recipe for the buyer's sheet, she types each unit price. Ava adds them up and
// asks her to approve the total; the asks that only fed Ava's build-up go away.
describe("price it yourself", () => {
  const yours = (patch: Partial<BidState> = {}) =>
    withState({ ...patch, fixes: { [PRICE_YOURSELF_KEY]: true, ...(patch.fixes ?? {}) } });

  test("her prices are the sheet: one ask holds them, and the build-up asks are gone", () => {
    const eff = effectiveBid(fayettevilleBid, yours());
    expect(eff.price?.builtBy).toBe("you");
    const ids = eff.asks.map((a) => a.id);
    expect(ids).toContain(YOUR_PRICES_ASK);
    // Only the build-up: pay rates, food cost, profit.
    for (const id of ["ask-pay-rates", "ask-food-cost", "ask-profit"])
      expect(ids).not.toContain(id);
    // Proves a rule as well as a cost: stays.
    expect(ids).toContain("ask-insurance");
    expect(missingPriceAsks(eff, yours())).toEqual([YOUR_PRICES_ASK]);
  });

  test("Ava totals what she typed and asks her to approve it", () => {
    const lines = fayettevilleBid.price!.lines;
    const values = Object.fromEntries(lines.map((l, i) => [l.id, 10 + i]));
    const s = yours({
      answers: { [YOUR_PRICES_ASK]: { status: "done", at: "2026-05-07", values } },
    });
    const eff = effectiveBid(fayettevilleBid, s);
    const prices = linePrices(eff, s);
    expect(prices.map((p) => p.unitPrice)).toEqual(lines.map((_, i) => 10 + i));
    const want = lines.reduce((n, l, i) => n + (10 + i) * l.qty!, 0);
    expect(sheetTotal(prices)).toBe(want);
    const ids = exactChecks(eff, s).findings.map((f) => f.id);
    expect(ids).not.toContain("price-incomplete");
    expect(ids).toContain("price-approval");
    // Ava knows no costs it did not build, so it claims nothing about them.
    expect(ids.some((id) => id.startsWith("deliver:") || id.startsWith("wage:"))).toBe(false);
  });
});

// Ava's own check (docs/ava/build-progression.md, item 4): can Ava build this
// kind of notice, and does the bid need a reviewer — by how hard it is, never
// by the notice number.
describe("Ava's check", () => {
  const opp = (id: string) => findOpportunity(id)!;

  test("a sources sought is answered, not refused", () => {
    expect(avaScope(opp("W912EE-27-S-0004")).ok).toBe(true);
  });

  test("a reviewer for scored writing or best value, whatever the number says", () => {
    expect(avaReview(fayettevilleBid)).toMatch(/points for the writing/);
    expect(avaReview(mackallBid)).toBeNull();
    const bestValue: AvaBid = {
      ...mackallBid,
      award: { ...mackallBid.award, method: "best-value" },
    };
    expect(avaReview(bestValue)).toMatch(/quality against price/);
    // An "-R-" in the number no longer decides anything.
    expect(avaReview({ ...mackallBid, noticeId: "SP4701-26-R-0021" })).toBeNull();
  });
});

// A bid the buyer allows no price for (docs/ava/build-progression.md, item 2):
// the reply to a sources sought. No price step, no approval, and a price sheet
// put into the package is caught.
describe("a bid with no price", () => {
  const bid = fortBraggReplyBid;

  test("the reply has no price, no price piece and nothing to approve", () => {
    const s = completeState(bid);
    const eff = effectiveBid(bid, s);
    expect(eff.price!).toBeNull();
    expect(
      packageParts(eff)
        .flatMap((p) => p.pieces)
        .some((x) => x.kind === "price"),
    ).toBe(false);
    expect(complianceItems(eff, s).some((i) => i.id === "price")).toBe(false);
    const run = exactChecks(eff, s);
    expect(run.findings.map((f) => f.id)).toEqual([]);
    expect(run.passed).toContain("Your bid has no price sheet. The buyer allows no price.");
  });

  test("a price sheet in the package is a critical finding", () => {
    const s = completeState(bid);
    const withSheet: AvaBid = {
      ...bid,
      submission: {
        ...bid.submission,
        files: bid.submission.files.map((f, i) =>
          i === 0 ? { ...f, contains: [...f.contains, { kind: "price", id: "price" }] } : f,
        ),
      },
    };
    const f = exactChecks(effectiveBid(withSheet, s), s).findings.find((x) => x.id === "no-price");
    expect(f?.severity).toBe("critical");
  });
});
