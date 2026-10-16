// Ava's three pages (Ava-Simplified.html, "Ava in three pages"):
//
//   1. Scope — the whole opportunity, so the member understands it and why
//      they are bidding. Every fact carries its source; a fact the files do
//      not state reads "Not stated", never hidden.
//   2. Compliance and inputs — every item the member has, proves, supplies,
//      signs or decides, with its kind, when it is needed, its status, who
//      provides it, its lead time and its decide-by date.
//   3. Build and submit — the build, then the checks, then the hand-over,
//      in the order the submission type needs.
//
// Pure derivations over the effective bid and the member's answers, like
// derive.ts. Nothing here writes. The screens render what these return, so a
// count on one page and a count on another can never disagree.

import { approvalTotal, usd0, YOUR_PRICES_ASK } from "./price";
import {
  blockingFindings,
  depositShort,
  exactChecks,
  findingState,
  requirementStatus,
} from "./checks";
import {
  askNeededAt,
  askResolved,
  askStatus,
  askVerdict,
  bidDecision,
  clarificationStatus,
  claimView,
  commitmentStatus,
  dateCannotSlip,
  decideBy,
  decideByRaw,
  goneAheadWithout,
  openGaps,
  receivedAddenda,
  requirementChangedBy,
  sectionClaims,
  sectionPages,
  visibleAsks,
} from "./derive";
import { dayFromNow, dayMonth, daysFromToday, fullDate, weekdayDate } from "./dates";
import { buildingItems, progress } from "./status";
import type { BidState } from "./store";
import type {
  Ask,
  AskOwner,
  AvaBid,
  AwardMethod,
  ComplianceGroup,
  HardRequirement,
  NeededAt,
  Source,
} from "./types";
import { readable } from "./types";

// ─── Words shared by the pages ───

export const AWARD_LABEL: Record<AwardMethod, string> = {
  points: "Points: the highest total score wins",
  "low-bid": "Low bid: the lowest complete bid wins",
  "best-value": "Best value: the buyer weighs quality against price",
  "lowest-price-acceptable": "Lowest price among the acceptable offers",
  qualifications: "Qualifications first, then the buyer asks for a price",
  none: "Nothing is awarded yet. The buyer is asking who can do the work",
};

const METHOD_LABEL: Record<AvaBid["submission"]["method"], string> = {
  portal: "Uploaded to the buyer's online portal",
  email: "Sent by email",
  paper: "Printed, sealed in an envelope, and delivered",
  "typed-portal": "Typed into the buyer's online portal",
};

/** "Uploaded to the buyer's online portal: The City of Fayetteville vendor portal". */
export function submitLine(bid: AvaBid): string {
  return `${METHOD_LABEL[bid.submission.method]}. ${bid.submission.where}.`;
}

/** The latest addendum that has arrived, or null for the first version. */
export function currentVersion(bid: AvaBid, s: BidState): string {
  const got = receivedAddenda(bid, s);
  const last = got[got.length - 1];
  if (!last) return "The first version. No addenda so far.";
  const posted = last.arrivesDuringBuild ? "today" : fullDate(dayFromNow(last.postedDaysFromNow));
  return `Addendum ${last.number}, posted ${posted}. This is the version Ava works from.`;
}

// ─── Page 2: compliance and inputs ───

export type ItemKind = "knock-out" | "required" | "scored" | "after-award";

export type ItemStatus =
  | "have"
  | "confirm"
  | "need"
  | "expired"
  | "na"
  | "cant-meet"
  | "sign-later"
  | "with-buyer"
  | "fails";

export type ItemOwner = AskOwner | "notary" | "buyer";

export interface ComplianceItem {
  /** "ask:…", "req:…", "promise:…", "price", "form:…", "question:…". */
  id: string;
  title: string;
  /** The rule this item serves, when it is part of a knock-out. */
  rule?: string;
  kind: ItemKind;
  neededAt: NeededAt;
  status: ItemStatus;
  /** One line under the status: the evidence, who it went to, what is left. */
  note?: string;
  owner: ItemOwner;
  group: ComplianceGroup;
  source: Source;
  /** Days to get it. Null when it takes no time to get. */
  leadDays: number | null;
  decideBy: Date | null;
  /** Shown when there is no date: "Before you sign". */
  decideLabel?: string;
  /** The date cannot move: a meeting, a site visit, the question deadline. */
  fixedDate: boolean;
  /** Where it ends up in the bid. */
  endsUp: string[];
  /** It must be done before the bid can be submitted. */
  holdsBid: boolean;
  /** Its lead time no longer fits before the due date. */
  late: boolean;
  /** A knock-out the member can say they cannot meet, which sends the bid
   *  back to the bid decision. False when the ask already offers that exit. */
  canSayCantMeet: boolean;
  /** An addendum rewrote the rule; the member confirms they still meet it. */
  reconfirm: boolean;
  /** Grant's result on the rule, or what the member already told Grant. */
  grantNote?: string;
  askId?: string;
  requirementId?: string;
  commitmentId?: string;
  formId?: string;
  clarificationId?: string;
}

export const KIND_WORD: Record<ItemKind, string> = {
  "knock-out": "Knock-out",
  required: "Required",
  scored: "Scored",
  "after-award": "After award",
};

export const KIND_MEANS: Record<ItemKind, string> = {
  "knock-out": "Missing it gets the bid thrown out.",
  required: "It must be in the package.",
  scored: "It changes your points.",
  "after-award": "Needed only if you win.",
};

export const STATUS_WORD: Record<ItemStatus, string> = {
  have: "Have",
  confirm: "Confirm",
  need: "Need",
  expired: "Expired",
  na: "Doesn't apply",
  "cant-meet": "Can't meet",
  "sign-later": "Sign at the end",
  "with-buyer": "With the buyer",
  fails: "Does not meet",
};

export const NEEDED_WORD: Record<NeededAt, string> = {
  bid: "With the bid",
  award: "At award",
  "work-start": "Before work starts",
};

export const GROUPS: { id: ComplianceGroup; label: string; what: string }[] = [
  {
    id: "eligibility",
    label: "Registrations, licenses and company details",
    what: "What proves your company can bid.",
  },
  { id: "events", label: "Meetings and site visits", what: "Dates you must attend." },
  { id: "insurance", label: "Insurance and bonds", what: "From your insurance agent and surety." },
  { id: "experience", label: "References and past work", what: "Jobs the buyer checks." },
  { id: "people", label: "People and staffing", what: "The people the bid names." },
  {
    id: "pricing",
    label: "Pricing inputs",
    what: "Ava builds your price from these.",
  },
  { id: "writing", label: "Writing inputs", what: "Facts Ava needs for the writing." },
  { id: "decisions", label: "Your decisions", what: "Promises and the price you approve." },
  { id: "forms", label: "Forms to sign", what: "You sign these when the package is ready." },
  { id: "buyer", label: "From the buyer", what: "Files and answers the buyer owes you." },
];

/** Statuses that still need something before the item is settled. */
export const OPEN_STATUSES: ReadonlySet<ItemStatus> = new Set([
  "need",
  "confirm",
  "expired",
  "cant-meet",
  "fails",
]);

/** Every ask the price reads, so it sits under "Pricing inputs". */
export function priceAskIds(bid: AvaBid): Set<string> {
  const p = bid.price;
  const ids = new Set<string>();
  if (!p) return ids;
  // Priced by the member: her prices, and her yearly increase for option periods.
  if (p.builtBy === "you") {
    ids.add(YOUR_PRICES_ASK);
    if (p.periods) ids.add(p.periods.escalation.askId);
    return ids;
  }
  for (const r of p.roles) ids.add(r.pay.askId);
  for (const b of p.burden) {
    if (b.from.kind === "ask") ids.add(b.from.askId);
    if (b.from.kind === "per-hour" && b.from.cashWhen) ids.add(b.from.cashWhen.askId);
  }
  for (const l of p.lines) if (l.direct) ids.add(l.direct.askId);
  ids.add(p.overhead.askId);
  ids.add(p.profit.askId);
  if (p.contingency) ids.add(p.contingency.askId);
  for (const c of p.otherCosts) {
    if (c.yearly.kind === "ask") ids.add(c.yearly.askId);
    if (c.altFrom) ids.add(c.altFrom.askId);
  }
  if (p.tax) ids.add(p.tax.askId);
  if (p.periods) ids.add(p.periods.escalation.askId);
  if (bid.bidSecurity?.check) ids.add(bid.bidSecurity.check.askId);
  return ids;
}

/** Asks whose answer changes the points the buyer gives. */
function scoredAskIds(bid: AvaBid): Set<string> {
  const ids = new Set<string>();
  const scoredCriteria = new Set(
    bid.award.criteria
      .filter(
        (c) => (c.kind === "scored-writing" || c.kind === "scored-fact") && (c.points ?? 0) > 0,
      )
      .map((c) => c.id),
  );
  for (const sec of bid.sections) {
    const scored =
      (sec.points ?? 0) > 0 ||
      (sec.criterionId !== undefined && scoredCriteria.has(sec.criterionId));
    if (!scored) continue;
    for (const para of sec.paragraphs)
      for (const sp of para) if (sp.claim?.askId) ids.add(sp.claim.askId);
    for (const f of bid.reviewerFindings) if (f.sectionId === sec.id && f.askId) ids.add(f.askId);
  }
  for (const t of bid.themes) if (t.askId) ids.add(t.askId);
  // A pass-or-fail bid gives no points, so nothing in it is Scored.
  if (scoredCriteria.size > 0) {
    for (const r of bid.plan) if (r.kind === "scored-item" && r.askId) ids.add(r.askId);
  }
  // A price the buyer scores by formula: every price input changes the points.
  if (bid.award.criteria.some((c) => c.kind === "price-formula" && (c.points ?? 0) > 0)) {
    for (const id of priceAskIds(bid)) ids.add(id);
  }
  return ids;
}

function groupOfAsk(bid: AvaBid, ask: Ask, prices: Set<string>): ComplianceGroup {
  if (ask.group) return ask.group;
  if (bid.files.some((f) => f.uploadAskId === ask.id)) return "buyer";
  if (ask.owner === "surety" || ask.owner === "insurance-agent") return "insurance";
  if (ask.owner === "references") return "experience";
  if (prices.has(ask.id)) return "pricing";
  const feeds = ask.feeds.join(" | ");
  if (/Key person|resume/i.test(`${feeds} ${ask.title}`)) return "people";
  if (/Reference|Similar work|Experience/i.test(feeds)) return "experience";
  if (ask.feeds.some((f) => /^(Section|Draft|Theme) ·/.test(f))) return "writing";
  if (ask.feeds.some((f) => /^Promise ·/.test(f))) return "decisions";
  return "eligibility";
}

function ruleOf(bid: AvaBid, askId: string, depth = 0): HardRequirement | undefined {
  const direct = bid.hardRequirements.find(
    (r) => r.askId === askId || (r.askIds ?? []).includes(askId),
  );
  if (direct || depth > 3) return direct;
  const opener = bid.asks.find((x) => (x.dontHave ?? []).some((o) => o.opensAskId === askId));
  return opener ? ruleOf(bid, opener.id, depth + 1) : undefined;
}

/** The last day before the member signs: one day before the due date. */
function beforeSigning(bid: AvaBid): Date {
  return dayFromNow(bid.deadline.dueDaysFromNow - 1);
}

function askRow(
  bid: AvaBid,
  s: BidState,
  ask: Ask,
  prices: Set<string>,
  scored: Set<string>,
): ComplianceItem {
  const rule = ruleOf(bid, ask.id);
  const neededAt: NeededAt = askNeededAt(bid, ask);
  const withBid = neededAt === "bid";
  const kind: ItemKind = !withBid
    ? "after-award"
    : rule
      ? "knock-out"
      : scored.has(ask.id)
        ? "scored"
        : "required";
  const st = askStatus(bid, s, ask);
  const ans = s.answers[ask.id];
  let status: ItemStatus = "need";
  let note: string | undefined;
  if (s.decision?.fromAskId === ask.id && !ans) {
    // The member said they cannot meet it, without an answer on file.
    status = "cant-meet";
    note = s.decision.reason;
  } else if (st === "open") {
    status = "need";
  } else if (st === "forwarded") {
    status = "need";
    note = `Forwarded to ${ans?.forwardedTo ?? "someone else"}. Waiting for the answer.`;
  } else if (st === "replaced") {
    const opt =
      ans?.status === "dont-have" ? ask.dontHave?.find((o) => o.id === ans.optionId) : undefined;
    if (opt?.outcome === "bid-decision") {
      status = "cant-meet";
      note = opt.detail;
    } else if (opt) {
      const v = askVerdict(bid, s, ask.id);
      const chose = `You chose: ${opt.label.replace(/\.$/, "")}.`;
      const next = opt.opensAskId ? bid.asks.find((a) => a.id === opt.opensAskId) : undefined;
      if (v === null) {
        status = "na";
        note = next ? `${chose} Answer it here: ${next.title}.` : chose;
      } else if (v.status === "meets") {
        status = "na";
        note = chose;
      } else {
        status = v.status === "not-yet" ? "fails" : "confirm";
        note = v.evidence ?? chose;
      }
    } else {
      const file = goneAheadWithout(bid, s, ask.id);
      status = "confirm";
      note = file ? `You chose to go ahead without ${file.name}.` : undefined;
    }
  } else {
    // Answered. The answer itself is judged against the rule it serves.
    const choice =
      ask.answer.type === "answer"
        ? ask.answer.choices.find((c) => c.id === ans?.choiceId)
        : undefined;
    if (choice?.failsGate) {
      status = "cant-meet";
      note = choice.failsGate;
    } else if (s.decision?.fromAskId === ask.id) {
      status = "cant-meet";
      note = s.decision.reason;
    } else {
      const v = askVerdict(bid, s, ask.id);
      status =
        v === null || v.status === "meets" ? "have" : v.status === "not-yet" ? "fails" : "confirm";
      // Where the proof came from, when the rule gives no evidence line.
      note = v?.evidence ?? (ans ? answerSource(ask, ans) : undefined);
    }
  }
  // A rule an addendum rewrote reopens on the ask that answers it.
  let reconfirm = false;
  if (rule && rule.askId === ask.id && status === "have") {
    const changedBy = requirementChangedBy(bid, s, rule.id);
    if (changedBy && !s.fixes[`reconfirm:${rule.id}`]) {
      status = "confirm";
      reconfirm = true;
      note = `Addendum ${changedBy.number} changed this rule. Confirm you still meet it.`;
    }
  }
  const check = bid.bidSecurity?.check;
  if (check && check.askId === ask.id && status === "have") {
    const short = depositShort(bid, s);
    if (short) {
      status = "fails";
      note = `Your check of ${usd0(short.amount)} is under the ${usd0(short.needed)} needed.`;
    }
  }
  // Past its date: the lead time no longer fits before the due date.
  const late = withBid && status === "need" && daysFromToday(decideByRaw(ask, bid)) < 0;
  if (late) {
    note = `It may not arrive before the due date. Ask for it today${
      rule ? ", or tell Ava you cannot meet this rule" : ""
    }.`;
  }
  const exitOffered = (ask.dontHave ?? []).some((o) => o.outcome === "bid-decision");
  const failChoice = ask.answer.type === "answer" && ask.answer.choices.some((c) => !!c.failsGate);
  return {
    id: `ask:${ask.id}`,
    title: ask.title,
    rule: rule?.label,
    kind,
    neededAt,
    status,
    note,
    owner: ask.owner,
    group: rule?.group ?? groupOfAsk(bid, ask, prices),
    source: ask.source,
    leadDays: ask.leadDays > 0 ? ask.leadDays : null,
    // An item needed only if they win has no date before the bid.
    decideBy: withBid ? decideBy(ask, bid) : null,
    decideLabel: withBid ? undefined : "If you win",
    fixedDate: withBid && dateCannotSlip(ask, bid),
    endsUp: endsUpOf(bid, ask),
    holdsBid: withBid,
    late,
    canSayCantMeet:
      kind === "knock-out" &&
      !exitOffered &&
      !failChoice &&
      status !== "have" &&
      status !== "cant-meet",
    reconfirm,
    grantNote: ask.toldGrant ? `You told Grant: ${ask.toldGrant}.` : rule?.grantSays,
    askId: ask.id,
    requirementId: rule?.id,
  };
}

/** Where an answered ask's proof came from, in the member's words. */
function answerSource(ask: Ask, ans: NonNullable<BidState["answers"][string]>): string {
  if (ans.fromGrant) return `You told Grant: ${ans.fromGrant}.`;
  if (typeof ans.values?.correction === "string") return "You corrected it.";
  if (ans.fileName) return `From your file: ${ans.fileName}.`;
  switch (ask.answer.type) {
    case "approve":
      return `You approved it. Ava found it in ${ask.answer.from.replace(/\.$/, "")}.`;
    case "answer": {
      const c = ask.answer.choices.find((x) => x.id === ans.choiceId);
      return c ? `Your answer: ${c.label}.` : "You answered it.";
    }
    case "enter":
      return "You entered it.";
    case "upload":
      return "You uploaded it.";
  }
}

/** The places in the package an ask's answer lands: the buyer's own form or
 *  section names from the plan and the forms, then what it feeds. */
function endsUpOf(bid: AvaBid, ask: Ask): string[] {
  const places = [
    ...bid.plan.filter((p) => p.askId === ask.id).map((p) => p.answeredIn.label),
    ...bid.forms.filter((f) => f.askId === ask.id).map((f) => f.name),
  ];
  const fed = ask.feeds
    .filter((f) => !/^Hard requirement ·/.test(f))
    .map((f) => f.replace(/ · /g, ": "));
  return [...new Set([...places, ...fed])];
}

/** Every item on page 2, in no particular order. The page groups and sorts. */
export function complianceItems(bid: AvaBid, s: BidState): ComplianceItem[] {
  const prices = priceAskIds(bid);
  const scored = scoredAskIds(bid);
  const out: ComplianceItem[] = [];

  // Every ask the member can see is one row.
  for (const ask of visibleAsks(bid, s)) out.push(askRow(bid, s, ask, prices, scored));

  // A rule with no ask behind it: Ava already had the proof, or it has none yet.
  for (const r of bid.hardRequirements) {
    if (r.askId || (r.askIds ?? []).length > 0) continue;
    const v = requirementStatus(bid, s, r);
    const neededAt = r.neededAt ?? "bid";
    const changedBy = requirementChangedBy(bid, s, r.id);
    const reconfirm = !!changedBy && v.status === "confirm" && !s.fixes[`reconfirm:${r.id}`];
    const status: ItemStatus =
      v.status === "meets" ? "have" : v.status === "confirm" ? "confirm" : "need";
    out.push({
      id: `req:${r.id}`,
      title: r.label,
      kind: neededAt === "bid" ? "knock-out" : "after-award",
      neededAt,
      status,
      note: v.evidence,
      owner: "you",
      group: r.group ?? "eligibility",
      source: r.source,
      leadDays: null,
      decideBy: null,
      fixedDate: false,
      // A reply to a sources sought awards nothing: the buyer checks it when it reads it.
      endsUp: [
        bid.award.method === "none"
          ? "Checked by the buyer when it reads your reply"
          : "Checked by the buyer before award",
      ],
      // No ask to answer: the check carries it (checks.ts, "req:").
      holdsBid: false,
      late: false,
      canSayCantMeet: neededAt === "bid" && status !== "have",
      reconfirm,
      grantNote: r.grantSays,
      requirementId: r.id,
    });
  }

  // Promises the member approves.
  for (const c of bid.commitments) {
    const st = commitmentStatus(s, c);
    if (st === "no-approval-needed") continue;
    const inWriting = bid.sections.some((sec) =>
      sectionClaims(s, sec).some((cl) => cl.commitmentId === c.id),
    );
    out.push({
      id: `promise:${c.id}`,
      title: c.text,
      kind: "required",
      neededAt: "bid",
      status: st === "approved" ? "have" : "need",
      note:
        st === "reopened"
          ? "An addendum changed this. Approve the new wording."
          : st === "approved"
            ? "You approved this promise."
            : "A promise you keep if you win.",
      owner: "you",
      group: "decisions",
      source: c.source,
      leadDays: null,
      decideBy: null,
      decideLabel: "Before you sign",
      fixedDate: false,
      endsUp: [...(c.pricedAs ? [c.pricedAs] : []), ...(inWriting ? ["Your writing"] : [])],
      holdsBid: true,
      late: false,
      canSayCantMeet: false,
      reconfirm: false,
      commitmentId: c.id,
    });
  }

  // The price, once Ava can total it. Until then its inputs are the rows.
  // A bid with no price (the buyer allows none) has nothing to approve.
  const total = approvalTotal(bid, s);
  if (total !== null && bid.price) {
    const approved = !!s.priceApproval && Math.abs(s.priceApproval.total - total) <= 0.005;
    const priceScored = bid.award.criteria.some(
      (c) => c.kind === "price-formula" && (c.points ?? 0) > 0,
    );
    out.push({
      id: "price",
      title: "Approve your final price",
      kind: priceScored ? "scored" : "required",
      neededAt: "bid",
      status: approved ? "have" : "need",
      note: approved
        ? "You approved it."
        : s.priceApproval
          ? "Your price changed since you approved it."
          : bid.price.builtBy === "you"
            ? "You priced every line. Approve the total."
            : "Ava finished your price. It needs your approval.",
      owner: "you",
      group: "decisions",
      source: bid.price.contractTypeSource,
      leadDays: null,
      decideBy: null,
      decideLabel: "Before you sign",
      fixedDate: false,
      endsUp: [bid.price.sheetName],
      holdsBid: true,
      late: false,
      canSayCantMeet: false,
      reconfirm: false,
    });
  }

  // Forms the member signs at the end. A form someone else provides is its ask.
  for (const f of bid.forms) {
    if (f.askId) continue;
    const signs = f.handling.includes("you-sign") || f.handling.includes("notary");
    if (!signs) continue;
    const notary = f.handling.includes("notary");
    const files = bid.submission.files
      .filter((p) => p.contains.some((c) => c.kind === "form" && c.id === f.id))
      .map((p) => p.name);
    out.push({
      id: `form:${f.id}`,
      title: f.name,
      kind: "required",
      neededAt: "bid",
      status: "sign-later",
      note: notary
        ? "Book a notary. Sign it in front of them when the package is ready."
        : f.handling.includes("ava-fills")
          ? "Ava fills it. You sign it when the package is ready."
          : "You sign it when the package is ready.",
      owner: notary ? "notary" : "you",
      group: "forms",
      source: f.source,
      // A notary appointment takes about a day to book.
      leadDays: notary ? 1 : null,
      decideBy: beforeSigning(bid),
      fixedDate: false,
      endsUp: files.length > 0 ? files.slice(0, 1) : ["Your package"],
      holdsBid: false,
      late: false,
      canSayCantMeet: false,
      reconfirm: false,
      formId: f.id,
    });
  }

  // Questions only the buyer can answer.
  const qDay =
    bid.deadline.questionsDueDaysFromNow !== undefined
      ? dayFromNow(bid.deadline.questionsDueDaysFromNow)
      : null;
  for (const c of bid.clarifications) {
    const st = clarificationStatus(bid, s, c.id);
    const plans = bid.plan.filter((p) => p.clarificationId === c.id);
    const scoredSection = plans.some(
      (p) =>
        p.answeredIn.kind === "section" &&
        bid.sections.some((sec) => sec.id === p.answeredIn.id && (sec.points ?? 0) > 0),
    );
    const settledBy = c.settledByAddendumId
      ? bid.addenda.find((a) => a.id === c.settledByAddendumId)
      : undefined;
    let status: ItemStatus;
    let note: string;
    if (st === "settled") {
      status = "have";
      note = settledBy ? `Addendum ${settledBy.number} settles it.` : "An addendum settles it.";
    } else if (st === "answered") {
      status = "have";
      note = "The buyer answered. You said it settles the question.";
    } else if (st === "sent") {
      status = "with-buyer";
      note = "You sent the question. Ava is waiting for the answer.";
    } else {
      status = "need";
      note = `Not sent yet. ${c.meanwhile}`;
    }
    out.push({
      id: `question:${c.id}`,
      title: c.title,
      kind: scoredSection ? "scored" : "required",
      neededAt: "bid",
      status,
      note,
      owner: "buyer",
      group: "buyer",
      source: c.passages[0],
      leadDays: null,
      decideBy: qDay,
      fixedDate: qDay !== null,
      endsUp: plans.map((p) => p.answeredIn.label),
      // Ava builds to the stricter reading meanwhile, so it never holds the bid.
      holdsBid: false,
      late: false,
      canSayCantMeet: false,
      reconfirm: false,
      clarificationId: c.id,
    });
  }

  return out;
}

/** Items that need the member before the bid can be submitted. Equal to
 *  buildingItems() by construction: one open ask, promise or price approval
 *  is one row (pages.test asserts it). */
export function needsYouNow(items: ComplianceItem[]): ComplianceItem[] {
  return items.filter((i) => i.holdsBid && i.status === "need");
}

/** The bar on top of the list: how many of all the items are filled, and
 *  which to fill next. The total is every item, the same as "All items". An
 *  item is filled when nothing on the list waits on her for it: she or Ava
 *  filled it, or it is not hers to fill before she sends (a form she signs at
 *  the end, a question for the buyer, an item needed only if she wins, or the
 *  price, which she approves on the final build). So the open ones are
 *  needsYouNow less the price, and a forwarded ask stays open until its
 *  answer comes back. */
export function fillCount(items: ComplianceItem[]): {
  filled: number;
  total: number;
  next: ComplianceItem | null;
} {
  const open = needsYouNow(items).filter((i) => i.id !== "price");
  return {
    filled: items.length - open.length,
    total: items.length,
    next: [...open].sort(byDecideDate)[0] ?? null,
  };
}

/** Page 2's "who provides it" sections, in order. */
export const SECTION_OWNERS: ItemOwner[] = [
  "you",
  "bookkeeper",
  "insurance-agent",
  "surety",
  "references",
  "subcontractor",
  "notary",
  "buyer",
];

/** The page 2 section a row sits in: its topic, or who provides it. */
export function sectionKey(i: ComplianceItem, by: "topic" | "owner"): string {
  return by === "topic" ? i.group : `owner:${i.owner}`;
}

/** What she does for an item: the list's default grouping (mock
 *  docs/ava/list-by-action-mock.html). Grouping by the action, not the topic,
 *  makes fewer groups, and each group's button is the same kind of task. */
export type ItemAction =
  | "upload"
  | "enter"
  | "answer"
  | "approve"
  | "buyer"
  | "sign"
  | "after"
  | "has";

export const ITEM_ACTIONS: { id: ItemAction; label: string }[] = [
  { id: "upload", label: "Upload a file" },
  { id: "enter", label: "Type it in" },
  { id: "answer", label: "Answer a question" },
  { id: "approve", label: "Approve" },
  { id: "buyer", label: "Send the buyer a question" },
  { id: "sign", label: "Sign at the end" },
  { id: "after", label: "Only if you win" },
  { id: "has", label: "Ava already has these" },
];

/** The one group an item sits in by what she does for it. */
export function itemAction(bid: AvaBid, i: ComplianceItem): ItemAction {
  if (i.status === "sign-later") return "sign";
  if (i.clarificationId) return "buyer";
  if (i.id === "price" || i.commitmentId) return "approve";
  if (i.kind === "after-award") return "after";
  const ask = i.askId ? bid.asks.find((a) => a.id === i.askId) : undefined;
  if (ask) return ask.kind;
  // No question of her own: Ava already has it, or there is a rule to look at.
  return i.status === "have" || i.status === "na" ? "has" : "answer";
}

/** What a closed page 2 section says about itself, so the member can tell
 *  whether to open it. "Need you" is needsYouNow's own test, so the section
 *  counts add up to the number at the top of the page (pages.test asserts it). */
export function sectionSummary(rows: ComplianceItem[]) {
  const needs = needsYouNow(rows);
  const dated = needs
    .map((i) => i.decideBy)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  const signLater = rows.filter((i) => i.status === "sign-later");
  const laterDates = signLater
    .map((i) => i.decideBy)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  return {
    needYou: needs.length,
    done: rows.filter((i) => i.status === "have").length,
    knockOuts: rows.filter(
      (i) => i.kind === "knock-out" && i.status !== "have" && i.status !== "na",
    ).length,
    allSignLater: rows.length !== 0 && signLater.length === rows.length,
    /** The earliest decide-by among the rows that need the member. */
    firstDate: dated[0] ?? null,
    /** With no date: the first such row's own word ("Before you sign"). */
    firstLabel: dated.length === 0 ? (needs[0]?.decideLabel ?? null) : null,
    /** For a section of forms to sign: the first day to sign by. */
    signBy: laterDates[0] ?? null,
  };
}

/** A stable order: the date the member must decide by, fixed dates first. */
export function byDecideDate(a: ComplianceItem, b: ComplianceItem): number {
  const da = a.decideBy?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const db = b.decideBy?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return da - db || (b.leadDays ?? 0) - (a.leadDays ?? 0) || a.title.localeCompare(b.title);
}

export type RuleState = "meets" | "confirm" | "not-yet" | "cant-meet";

/** Every knock-out rule the buyer checks with the bid, judged once. Page 1
 *  ("Who can bid") and page 2 (the verdict) both read this, so they give the
 *  same count and the same words. A rule whose answer failed it, or that sent
 *  the bid back to the bid decision, cannot be met. */
export function knockOutRules(
  bid: AvaBid,
  s: BidState,
): { rule: HardRequirement; state: RuleState; evidence?: string }[] {
  return bid.hardRequirements
    .filter((r) => (r.neededAt ?? "bid") === "bid")
    .map((r) => {
      const v = requirementStatus(bid, s, r);
      const ids = [r.askId, ...(r.askIds ?? [])].filter((x): x is string => !!x);
      const failed = ids.some((id) => {
        const a = s.answers[id];
        const ask = bid.asks.find((x) => x.id === id);
        if (!a || !ask) return false;
        if (s.decision?.fromAskId === id) return true;
        if (a.status === "dont-have")
          return ask.dontHave?.find((o) => o.id === a.optionId)?.outcome === "bid-decision";
        return (
          ask.answer.type === "answer" &&
          !!ask.answer.choices.find((c) => c.id === a.choiceId)?.failsGate
        );
      });
      return {
        rule: r,
        state: failed ? ("cant-meet" as const) : v.status,
        evidence: v.evidence,
      };
    });
}

export function knockOutSummary(bid: AvaBid, s: BidState) {
  const rules = knockOutRules(bid, s);
  return {
    total: rules.length,
    meets: rules.filter((r) => r.state === "meets").length,
    confirm: rules.filter((r) => r.state === "confirm").length,
    notYet: rules.filter((r) => r.state === "not-yet").length,
    cantMeet: rules.filter((r) => r.state === "cant-meet").length,
  };
}

// ─── Page 3: build and submit ───

export type BuildStepId =
  | "writing"
  | "forms"
  | "price"
  | "checks"
  | "evaluator"
  | "mentor"
  | "final-read"
  | "handover"
  | "receipt";

export type StepTone = "done" | "open" | "waiting" | "idle";

export interface BuildStep {
  id: BuildStepId;
  title: string;
  what: string;
  status: string;
  tone: StepTone;
  action: string;
}

/** The steps page 3 shows, in order, for this kind of bid. Build → check →
 *  submit. The evaluator read appears only when there is writing to read. */
export function buildSteps(fixture: AvaBid, bid: AvaBid, s: BidState): BuildStep[] {
  const p = progress(fixture, s);
  const steps: BuildStep[] = [];
  const hasWriting = bid.sections.length > 0;
  const building = p.phase === "building" || p.phase === "understanding";

  if (hasWriting) {
    const gaps = openGaps(bid, s).length;
    const over = bid.sections.filter(
      (sec) =>
        sec.pageLimit !== undefined &&
        sec.pageLimit !== null &&
        sectionPages(s, sec) > sec.pageLimit,
    ).length;
    const promises = bid.commitments.filter((c) => {
      const st = commitmentStatus(s, c);
      return st === "needs-approval" || st === "reopened";
    }).length;
    const parts = [
      ...(gaps > 0 ? [`${gaps} ${gaps === 1 ? "gap" : "gaps"}`] : []),
      ...(promises > 0
        ? [`${promises} ${promises === 1 ? "promise" : "promises"} to approve`]
        : []),
      ...(over > 0 ? [`${over} over the page limit`] : []),
    ];
    steps.push({
      id: "writing",
      title: bid.kind === "short-response" ? "Write the short answers" : "Write the proposal",
      what: "Ava drafts each section the buyer asked for, in the buyer's order and limits.",
      status: parts.length > 0 ? parts.join(" · ") : "Drafted",
      tone: parts.length > 0 ? "open" : "done",
      action: "Open the writing",
    });
  }

  const signing = bid.forms.filter(
    (f) => f.handling.includes("you-sign") || f.handling.includes("notary"),
  ).length;
  const waitingForms = bid.forms.filter((f) => {
    const ask = f.askId ? bid.asks.find((a) => a.id === f.askId) : undefined;
    return !!ask && askNeededAt(bid, ask) === "bid" && !askResolved(bid, s, ask.id);
  }).length;
  steps.push({
    id: "forms",
    title: hasWriting ? "Prepare the forms" : "Prepare the forms and papers",
    what: "Ava fills what it can and marks every signature and notary stamp.",
    status:
      waitingForms > 0
        ? `Waiting on ${waitingForms} ${waitingForms === 1 ? "paper" : "papers"} from others`
        : signing > 0
          ? `${signing} to sign at the end`
          : "Nothing to sign",
    tone: waitingForms > 0 ? "open" : "done",
    action: "Open the forms",
  });

  // A bid the buyer allows no price for has no price step.
  const total = approvalTotal(bid, s);
  const approved =
    total !== null && !!s.priceApproval && Math.abs(s.priceApproval.total - total) <= 0.005;
  if (bid.price) {
    steps.push({
      id: "price",
      title: "Price",
      what:
        bid.price.builtBy === "you"
          ? "Ava cannot build this price yet. You type each price, Ava adds them up, and you approve the total."
          : "Ava builds your price from your costs, with the contingency you set. You approve the rates, the assumptions and the total.",
      status:
        total === null ? "Needs your inputs" : approved ? "Approved" : "Ready for your approval",
      tone: total === null ? "open" : approved ? "done" : "open",
      action: total !== null && !approved ? "Open the price to approve it" : "Open the price",
    });
  }

  const exact = exactChecks(bid, s).findings.filter(
    (f) => f.severity !== "minor" && findingState(bid, s, f) === "open",
  ).length;
  steps.push({
    id: "checks",
    title: "Run the exact checks",
    what: "Math, totals, pages, dates, names, forms, and every addendum acknowledged.",
    status: building ? "Runs when the build is done" : exact > 0 ? `${exact} to fix` : "Passed",
    tone: building ? "idle" : exact > 0 ? "open" : "done",
    action: "Open the check",
  });

  if (hasWriting) {
    const reviewerOpen = blockingFindings(bid, s).filter((f) => f.kind === "reviewer").length;
    steps.push({
      id: "evaluator",
      title: "Evaluator read",
      what: "A GovPreneurs reviewer reads it like the buyer would. Findings, never scores.",
      status: building
        ? "Reads the finished draft"
        : reviewerOpen > 0
          ? `${reviewerOpen} ${reviewerOpen === 1 ? "finding" : "findings"} to answer`
          : "No findings open",
      tone: building ? "idle" : reviewerOpen > 0 ? "open" : "done",
      action: "Open the reviewer's findings",
    });
  }

  const mentor = s.mentorAsks["checkpoint-3"];
  steps.push({
    id: "mentor",
    title: "Mentor review",
    what: "Your Mentor can review the finished package. It is your choice. Ava does not wait.",
    status: mentor ? `Sent on ${fullDate(new Date(mentor.at))}` : "Not asked",
    tone: mentor ? "done" : "idle",
    action: mentor ? "Open the conversation" : "Ask your Mentor to review",
  });

  const ready = p.phase === "ready" || p.phase === "submitted";
  steps.push({
    id: "final-read",
    title: "Your final read",
    what:
      bid.submission.certifying.length > 0
        ? "Read what you are certifying, then sign."
        : "Read the whole package once before you send it.",
    status: ready ? "Ready for you" : "After the checks",
    tone: ready ? "open" : "idle",
    action: "Open your final read",
  });

  const method = bid.submission.method;
  steps.push({
    id: "handover",
    title:
      method === "paper"
        ? "Prepare for delivery"
        : method === "email"
          ? "Prepare the email"
          : "Prepare the upload",
    what:
      method === "paper"
        ? "The package split and marked for delivery, with a print and delivery checklist."
        : method === "email"
          ? "The files named the buyer's way, with the email ready to send."
          : "The files named the buyer's way, in upload order, with a checklist.",
    status: ready ? "Ready" : "After your final read",
    tone: ready ? "open" : "idle",
    action: "Open the package",
  });

  steps.push({
    id: "receipt",
    title: "Submit and save the receipt",
    what: "You submit it yourself. Then upload the buyer's receipt here.",
    status: s.receipt ? `Saved on ${fullDate(new Date(s.receipt.at))}` : "After you submit",
    tone: s.receipt ? "done" : "idle",
    action: s.receipt ? "Open the receipt" : "Upload your receipt",
  });

  return steps;
}

export type Readiness =
  | { state: "paused"; reason: string }
  | { state: "submitted" }
  | { state: "ready" }
  | { state: "not-ready"; items: number; findings: number; brief: boolean };

/** The status at the top of page 3. It reads the same counts as page 2 and
 *  the check, so the three never disagree. */
export function readiness(fixture: AvaBid, bid: AvaBid, s: BidState): Readiness {
  const d = bidDecision(bid, s);
  if (d) return { state: "paused", reason: d.reason };
  const p = progress(fixture, s);
  if (p.phase === "submitted") return { state: "submitted" };
  if (p.phase === "ready") return { state: "ready" };
  return {
    state: "not-ready",
    items: s.briefConfirmed ? buildingItems(bid, s) : 0,
    findings: p.phase === "reviewing" ? p.remaining : 0,
    brief: !s.briefConfirmed,
  };
}

/** Pages measured on the draft, against the limits, for the side panel. */
export function pageTotals(bid: AvaBid, s: BidState): { pages: number; limit: number | null } {
  const pages = bid.sections.reduce((n, sec) => n + sectionPages(s, sec), 0);
  const limited = bid.sections.every((sec) => typeof sec.pageLimit === "number");
  const limit = limited ? bid.sections.reduce((n, sec) => n + (sec.pageLimit ?? 0), 0) : null;
  return { pages, limit };
}

/** A claim still marked Unsupported in this section. */
export function sectionGaps(bid: AvaBid, s: BidState, sectionId: string): number {
  const sec = bid.sections.find((x) => x.id === sectionId);
  if (!sec) return 0;
  return sectionClaims(s, sec).filter((c) => claimView(bid, s, c).tag === "unsupported").length;
}

// ─── Dates in words ───

/** "Thursday 21 May 2026, 2:00 PM Eastern Time". */
export function dueWhen(bid: AvaBid): string {
  const d = bid.deadline;
  const zone = d.zone ?? "time zone not stated in the buyer's files";
  return `${weekdayDate(dayFromNow(d.dueDaysFromNow))}, ${d.time} ${zone}`;
}

/** "Due Thursday 21 May 2026, 2:00 PM Eastern Time". */
export function dueLine(bid: AvaBid): string {
  return `Due ${dueWhen(bid)}`;
}

/** When questions to the buyer close, with the time and the zone:
 *  "14 May, 5:00 PM Eastern Time". Null when the files set no such date. */
export function questionsWhen(bid: AvaBid, withYear = false): string | null {
  const d = bid.deadline;
  if (d.questionsDueDaysFromNow === undefined) return null;
  const day = dayFromNow(d.questionsDueDaysFromNow);
  const date = withYear ? fullDate(day) : dayMonth(day);
  if (!d.questionsTime) return `${date}, time not stated`;
  return d.zone
    ? `${date}, ${d.questionsTime} ${d.zone}`
    : `${date}, ${d.questionsTime}, time zone not stated`;
}

// ─── Page 1: the scope ───

export type ScopeSectionId =
  | "overview"
  | "work"
  | "commit"
  | "contract"
  | "dates"
  | "eligibility"
  | "award"
  | "submit"
  | "buyer"
  | "files"
  | "money"
  | "flags"
  | "why"
  | "brief";

/** One fact on page 1. A null value is a fact the files do not state. */
export interface ScopeFact {
  /** Empty for a list item under the fact above it. */
  label: string;
  value: string | null;
  source?: Source;
}

export interface ScopeSection {
  id: ScopeSectionId;
  title: string;
  what: string;
  facts: ScopeFact[];
}

export const READ_WORD: Record<AvaBid["files"][number]["readability"], string> = {
  read: "Read",
  scan: "Read from a scan",
  "behind-login": "Behind the buyer's login",
  garbled: "Could not read the text",
  controlled: "Controlled file, kept out of AI",
};

type Topic = AvaBid["screen"][number]["topic"];

/** A screened topic as a fact: its summary when the files ask for it, else Not stated. */
function screenFact(bid: AvaBid, topic: Topic, label: string): ScopeFact {
  const x = bid.screen.find((i) => i.topic === topic);
  return x?.found ? { label, value: x.summary, source: x.source } : { label, value: null };
}

function fact(label: string, f: { text: string; source: Source } | null | undefined): ScopeFact {
  return f ? { label, value: f.text, source: f.source } : { label, value: null };
}

/** Every section on page 1, in the order the page shows them. */
export function scopeSections(bid: AvaBid, s: BidState): ScopeSection[] {
  const o = bid.overview;
  const due = dueWhen(bid);
  const qWhen = questionsWhen(bid, true);
  const posted = Math.min(...bid.files.map((f) => f.postedDaysFromNow));
  const pm = bid.price;
  const lineNames = (pm?.lines ?? []).map((l) => l.item).join("; ");

  return [
    {
      id: "overview",
      title: "Opportunity overview",
      what: "The key details in one place.",
      facts: [
        fact("What they are buying", o?.summary),
        { label: "Official title", value: bid.officialTitle },
        { label: "Bid number", value: bid.bidNumber },
        fact("Kind of notice", o?.noticeType),
        { label: "How you submit it", value: submitLine(bid), source: bid.submission.source },
        {
          label: "How the winner is picked",
          value: AWARD_LABEL[bid.award.method],
          source: bid.award.source,
        },
        { label: "Due", value: due, source: bid.deadline.source },
        { label: "Current version", value: currentVersion(bid, s) },
        { label: "Status", value: statusLine(bid, s) },
      ],
    },
    {
      id: "work",
      title: "What is being asked for",
      what: "The work, where it happens, and what is not included.",
      facts: [
        ...(o && o.work.length > 0
          ? o.work.map((w, i) => ({
              label: i === 0 ? "The work" : "",
              value: w.text,
              source: w.source,
            }))
          : [{ label: "The work", value: null }]),
        fact("Where", o?.place),
        fact("Hours and coverage", o?.hours),
        fact("Staff", o?.staffing),
        fact("Standards to meet", o?.serviceLevels),
        fact("Not included", o?.outOfScope),
      ],
    },
    {
      id: "commit",
      title: "What you would commit to",
      what: "The promises you keep if you win.",
      facts: [
        ...bid.commitments.map((c, i) => ({
          label: i === 0 ? "Your promises" : "",
          value: c.text,
          source: c.source,
        })),
        fact("Money taken off for late or missed work", o?.penalties),
      ],
    },
    {
      id: "contract",
      title: "Contract structure",
      what: "The kind of contract, how long it runs, and how you are paid.",
      facts: [
        {
          label: "Kind of contract",
          value: pm?.contractType ?? null,
          source: pm?.contractTypeSource,
        },
        fact("How long it runs", o?.term),
        fact("Estimated value", o?.estimatedValue),
        { label: "Payment", value: pm?.payment.text ?? null, source: pm?.payment.source },
        ...bid.contractTerms.map((t, i) => ({
          label: i === 0 ? "Other terms" : "",
          value: t.text,
          source: t.source,
        })),
      ],
    },
    {
      id: "dates",
      title: "Key dates",
      what: "The due date, the question deadline, meetings and visits.",
      facts: [
        { label: "Posted", value: fullDate(dayFromNow(posted)) },
        {
          label: "Questions close",
          value:
            qWhen && (bid.deadline.questionsDueDaysFromNow ?? 0) < 0 ? `${qWhen}. Closed.` : qWhen,
          source: bid.deadline.questionsSource,
        },
        ...(o?.dates ?? []).map((d) => ({
          label: d.mandatory
            ? `${d.label} (${d.daysFromNow < 0 ? "attendance was required" : "you must attend"})`
            : d.label,
          value: `${weekdayDate(dayFromNow(d.daysFromNow))}${d.time ? `, ${d.time}` : ""}`,
          source: d.source,
        })),
        { label: "Bids due", value: due, source: bid.deadline.source },
        fact("Your price must stay open", o?.validity),
        fact("Expected award", o?.expectedAward),
        fact("Work starts", o?.start),
      ],
    },
    {
      id: "eligibility",
      title: "Who can bid",
      what: "Set-asides, registrations, licenses and the rules that decide who may bid.",
      facts: [
        fact("Who may bid", o?.setAside),
        fact("Industry code and size", o?.size),
        screenFact(bid, "vendor-registration", "Registered with the buyer"),
        fact("Limits on subcontracting", o?.subcontracting),
        ...bid.hardRequirements
          .filter((r) => (r.neededAt ?? "bid") === "bid")
          .map((r, i) => ({
            label: i === 0 ? "Knock-out rules" : "",
            value: r.label,
            source: r.source,
          })),
      ],
    },
    {
      id: "award",
      title: "How the winner is picked",
      what: "The award method, what is scored and what is pass or fail.",
      facts: [
        { label: "Award method", value: AWARD_LABEL[bid.award.method], source: bid.award.source },
        {
          label: "How price counts",
          source: bid.award.criteria.find((c) => c.kind === "price-formula")?.source,
          value:
            bid.award.priceFormula?.text ??
            (bid.award.method === "low-bid" || bid.award.method === "lowest-price-acceptable"
              ? "The lowest price wins among the bids that pass."
              : null),
        },
        ...bid.award.criteria.map((c, i) => ({
          label: i === 0 ? "What is judged" : "",
          value: `${c.name}: ${c.points !== null ? `${c.points} points` : c.treatment}`,
          source: c.source,
        })),
      ],
    },
    {
      id: "submit",
      title: "What you must submit, and how",
      what: "The parts of the package, the forms, and how to deliver it.",
      facts: [
        { label: "How you submit it", value: submitLine(bid), source: bid.submission.source },
        {
          label: "Account or address",
          value: bid.submission.account,
          source: bid.submission.source,
        },
        {
          label: "File or copy rules",
          value: bid.submission.limits,
          source: bid.submission.source,
        },
        {
          label: "Forms",
          value: `${bid.forms.length} forms: ${bid.forms.map((f) => f.name).join("; ")}.`,
        },
        screenFact(bid, "notary-signature", "Signatures and notary"),
        {
          label: "Markings",
          value: bid.submission.markings.length > 0 ? bid.submission.markings.join(" ") : null,
          source: bid.submission.markings.length > 0 ? bid.submission.source : undefined,
        },
        fact("Late bids", o?.lateRule),
      ],
    },
    {
      id: "buyer",
      title: "The buyer",
      what: "Who is buying, who to contact, and the only allowed way to ask questions.",
      facts: [
        { label: "Buyer", value: bid.buyer },
        {
          label: "Contact",
          value: o?.contact
            ? [o.contact.name, o.contact.role, o.contact.email, o.contact.phone]
                .filter(Boolean)
                .join(", ")
            : null,
          source: o?.contact?.source,
        },
        fact("How to ask questions", o?.questionsChannel),
        fact("Rules on contacting other staff", o?.noContact),
        fact("Where the buyer posts it", o?.buyerPortal),
      ],
    },
    {
      id: "files",
      title: "The buyer's files",
      what: "Every file, its version, and whether Ava could read it.",
      facts: [],
    },
    {
      id: "money",
      title: "The money picture",
      what: "How you price it, bonds, insurance, wage rules, taxes and payment.",
      facts: [
        {
          label: "How you price it",
          source: pm?.lines[0]?.qtySource,
          value: pm
            ? `${pm.lines.length} ${pm.lines.length === 1 ? "price" : "prices"} on ${pm.sheetName}: ${lineNames}.`
            : "The buyer allows no price in this bid.",
        },
        screenFact(bid, "bonds", "Bonds"),
        screenFact(bid, "insurance", "Insurance"),
        screenFact(bid, "wages", "Wage rules"),
        screenFact(bid, "tax", "Taxes"),
        { label: "Payment", value: pm?.payment.text ?? null, source: pm?.payment.source },
        screenFact(bid, "public-opening", "Prices made public"),
      ],
    },
    {
      id: "flags",
      title: "Red flags",
      what: "Unclear rules, unreadable files and dates to watch.",
      facts: [],
    },
    {
      id: "why",
      title: "Why you are pursuing this",
      what: "Grant's call, your decision, and your Mentor's input.",
      facts: [],
    },
    {
      id: "brief",
      title: "Bid Brief",
      what: "Your hours, the slowest item, and whether a Mentor is advised. You confirm it.",
      facts: [],
    },
  ];
}

/** The Overview tab: the few facts that say what this bid is. The bid header
 *  already shows the due date and the days left. */
export function atAGlance(bid: AvaBid, s: BidState): ScopeFact[] {
  const o = bid.overview;
  return [
    fact("What they are buying", o?.summary),
    fact("Kind of notice", o?.noticeType),
    fact("Who may bid", o?.setAside),
    {
      label: "How the winner is picked",
      value: AWARD_LABEL[bid.award.method],
      source: bid.award.source,
    },
    { label: "How you submit it", value: submitLine(bid), source: bid.submission.source },
    fact("How long it runs", o?.term),
    fact("Estimated value", o?.estimatedValue),
    { label: "Current version", value: currentVersion(bid, s) },
  ];
}

/** Where the bid stands with the buyer: open, and how long is left. */
function statusLine(bid: AvaBid, s: BidState): string {
  const left = daysFromToday(dayFromNow(bid.deadline.dueDaysFromNow));
  const moved = receivedAddenda(bid, s).find((a) => a.changes.some((c) => c.patch.kind === "due"));
  if (left < 0) return "Closed. The due date has passed.";
  return `Open for bids, ${left} ${left === 1 ? "day" : "days"} left.${
    moved ? ` Addendum ${moved.number} moved the due date.` : ""
  }`;
}

/** Questions for the buyer still open, on every page that counts them: the
 *  drafted questions not yet settled, plus the time zone when no file gives it. */
export function openQuestionCount(bid: AvaBid, s: BidState): number {
  const open = bid.clarifications.filter((c) => {
    const st = clarificationStatus(bid, s, c.id);
    return st === "open" || st === "sent";
  }).length;
  return open + (bid.deadline.zone === null ? 1 : 0);
}

/** Facts the buyer's files do not state, in this section. */
export function notStatedCount(sec: ScopeSection): number {
  return sec.facts.filter((f) => f.value === null).length;
}

export interface RedFlag {
  id: string;
  text: string;
  source?: Source;
  /** The drafted question that goes with it, by clarification id. */
  clarificationId?: string;
}

/** Things to watch, worked out from the files and the dates. */
export function redFlags(bid: AvaBid, s: BidState): RedFlag[] {
  const out: RedFlag[] = [];
  for (const c of bid.clarifications) {
    const st = clarificationStatus(bid, s, c.id);
    if (st === "settled" || st === "answered") continue;
    out.push({
      id: `clar:${c.id}`,
      text: `${c.title}. Ava wrote a question for the buyer.`,
      source: c.passages[0],
      clarificationId: c.id,
    });
  }
  for (const f of bid.files) {
    if (readable(f)) continue;
    out.push({ id: `file:${f.id}`, text: `${f.name}: ${f.note ?? READ_WORD[f.readability]}` });
  }
  if (bid.deadline.zone === null) {
    out.push({
      id: "zone",
      text: "No file states the time zone for the deadline. Ask the buyer.",
      source: bid.deadline.source,
    });
  }
  for (const d of bid.overview?.dates ?? []) {
    if (!d.mandatory) continue;
    const when = weekdayDate(dayFromNow(d.daysFromNow));
    out.push({
      id: `date:${d.id}`,
      text:
        d.daysFromNow < 0
          ? `${d.label} was on ${when}, and attendance was required. If no one from your company went, the bid will be thrown out.`
          : `${d.label} on ${when}. You must attend, or the bid is thrown out.`,
      source: d.source,
    });
  }
  const q = bid.deadline.questionsDueDaysFromNow;
  if (q !== undefined && q < 0) {
    out.push({
      id: "questions-closed",
      text: `Questions to the buyer closed on ${fullDate(dayFromNow(q))}. The buyer may not answer new ones.`,
      source: bid.deadline.questionsSource,
    });
  }
  const open = visibleAsks(bid, s).filter((a) => askStatus(bid, s, a) === "open");
  for (const a of open) {
    if (askNeededAt(bid, a) !== "bid" || daysFromToday(decideByRaw(a, bid)) >= 0) continue;
    out.push({
      id: `late:${a.id}`,
      text: `${a.title} takes about ${a.leadDays} business ${a.leadDays === 1 ? "day" : "days"} to get. It may not arrive before the due date.`,
      source: a.source,
    });
  }
  const slow = open
    .filter(
      (a) =>
        askNeededAt(bid, a) === "bid" && a.leadDays >= 5 && daysFromToday(decideByRaw(a, bid)) >= 0,
    )
    .sort((a, b) => b.leadDays - a.leadDays)[0];
  if (slow) {
    out.push({
      id: `slow:${slow.id}`,
      text: `${slow.title} takes about ${slow.leadDays} business days to get. Ask for it by ${fullDate(decideBy(slow, bid))}.`,
      source: slow.source,
    });
  }
  if (bid.failedAtStart) {
    out.push({ id: "failed", text: bid.failedAtStart.reason, source: bid.failedAtStart.source });
  }
  return out;
}
