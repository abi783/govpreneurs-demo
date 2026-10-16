// Ava — pure derivations from (what Ava read) × (what the member did).
//
// Nothing here writes. Every screen asks these functions where the bid stands,
// so two screens can never disagree about it (one fact, one owner). The price
// lives in price.ts and the exact checks in checks.ts; both read the same
// effective bid this file builds.

import {
  dayFromNow,
  daysFromToday,
  fullDate,
  later,
  minusBusinessDays,
  today,
  weekdayDate,
} from "./dates";
import { decisionKey, type AskAnswer, type BidState } from "./store";
import type {
  Addendum,
  Ask,
  AvaBid,
  Claim,
  ClaimTag,
  Commitment,
  DraftSection,
  HardRequirement,
  PriceModel,
  Proof,
  ReqStatus,
  Span,
} from "./types";
import { readable } from "./types";

// ─── "Price it yourself" (docs/ava/build-progression.md, item 1) ───

/** Prototype control: show a sample bid as a price Ava cannot build yet. */
export const PRICE_YOURSELF_KEY = "demo:price-yourself";
/** The one ask that holds her prices: one field per line, keyed by line id. */
export const YOUR_PRICES_ASK = "ask-your-prices";
/** What she reads wherever she prices the sheet herself. Defined once. */
export const PRICE_YOURSELF_LINE =
  "Ava cannot build this price yet. Type your price for each line. Ava adds them up and checks that every line has one.";

/** Her prices, as one ask on the buyer's sheet. */
function yourPricesAsk(price: PriceModel): Ask {
  return {
    id: YOUR_PRICES_ASK,
    kind: "enter",
    title: `Your price for each line of ${price.sheetName}`,
    source: price.lines[0]?.qtySource ?? price.contractTypeSource,
    why: PRICE_YOURSELF_LINE,
    owner: "you",
    leadDays: 1,
    minutes: 15,
    answer: {
      type: "enter",
      fields: price.lines.map((l) => ({
        id: l.id,
        // The buyer's item often names its unit already ("Weekday hot lunch, per meal").
        label: l.item.toLowerCase().includes(l.unit.toLowerCase())
          ? l.item
          : `${l.item}, ${l.unit}`,
        unit: "usd" as const,
        hint:
          l.qty === null
            ? "The buyer gives no quantity: this is your rate."
            : `The buyer's quantity: ${l.qty.toLocaleString("en-US")}.`,
      })),
    },
    deliberate: true,
    feeds: price.lines.map((l) => `Price · ${l.item}`),
    group: "pricing",
  };
}

/** The asks when she prices the sheet herself: an ask that only fed Ava's
 *  build-up (pay rates, overhead, food cost, profit) is not asked; one that
 *  also proves a rule (insurance) stays. Her yearly increase stays too, so
 *  option periods still total. */
function asksWhenPricedByYou(asks: Ask[], price: PriceModel): Ask[] {
  const keep = price.periods?.escalation.askId;
  const buildUpOnly = (a: Ask) =>
    a.id !== keep && a.feeds.length > 0 && a.feeds.every((f) => f.startsWith("Price · "));
  return [...asks.filter((a) => !buildUpOnly(a)), yourPricesAsk(price)];
}

// ─── Prototype controls for the two-phase screens (lib/ava/cases.ts) ───

/** PROTOTYPE ONLY: show a sample bid in a state its own files never reach,
 *  so every screen of docs/ava/ava-two-phase.html can be opened. Each is a
 *  `fixes` key, so the demo bar can set it and take it back. */
export const DEMO = {
  dueTomorrow: "demo:due-tomorrow",
  dueToday: "demo:due-today",
  duePassed: "demo:due-passed",
  noPrice: "demo:no-price",
  noMain: "demo:no-main",
  /** The main file's words come out jumbled: the build stops (7.3 before
   *  8 October 2026; no case shows it now). */
  unreadable: "demo:unreadable",
  /** The main file is a scan: Ava reads it, and asks her to confirm (7.3). */
  scan: "demo:scan",
  noFiles: "demo:no-files",
  samEnds: "demo:sam-ends",
  /** A price list with no quantities: her rates, and no total (6.9). */
  rates: "demo:rates",
  /** Ava's check does not finish: phase 2 opens with a check-it-yourself list (PRD D39). */
  checkFails: "demo:check-fails",
  /** The writing gives the first role 10 fewer hours a week than the price
   *  pays for: a critical finding that is not a rule, so she may go ahead at
   *  risk (8.3). */
  staffingDrift: "demo:staffing-drift",
} as const;

// ─── The effective bid: the fixture with every received addendum applied ───

/** Addenda that are part of the bid right now: those posted before Ava
 *  started, plus those that arrived during the build. */
export function receivedAddenda(bid: AvaBid, s: BidState) {
  return bid.addenda
    .filter((a) => !a.arrivesDuringBuild || s.addendaReceived.includes(a.id))
    .sort((a, b) => a.number - b.number);
}

/** Addenda still to arrive (the prototype delivers them with a demo control). */
export function pendingAddenda(bid: AvaBid, s: BidState) {
  return bid.addenda.filter((a) => a.arrivesDuringBuild && !s.addendaReceived.includes(a.id));
}

/** The bid as the current set of files defines it. Patches are absolute
 *  values, so applying an addendum twice changes nothing. */
export function effectiveBid(bid: AvaBid, s: BidState): AvaBid {
  const received = receivedAddenda(bid, s);
  const receivedIds = new Set(received.map((a) => a.id));
  const pendingIds = new Set(bid.addenda.filter((a) => !receivedIds.has(a.id)).map((a) => a.id));

  let deadline = { ...bid.deadline };
  let commitments = bid.commitments.map((c) => ({ ...c }));
  let lines = (bid.price?.lines ?? []).map((l) => ({ ...l }));
  let sections = bid.sections.map((sec) => ({ ...sec }));
  let hardRequirements = bid.hardRequirements.map((r) => ({ ...r }));

  for (const a of received) {
    for (const p of a.changes.flatMap((ch) => [ch.patch, ...(ch.alsoPatches ?? [])])) {
      switch (p.kind) {
        case "due":
          deadline = {
            ...deadline,
            dueDaysFromNow: p.dueDaysFromNow,
            time: p.time ?? deadline.time,
            time24: p.time24 ?? deadline.time24,
          };
          break;
        case "commitment":
          commitments = commitments.map((c) =>
            c.id === p.commitmentId
              ? { ...c, text: p.text, pricedAs: p.pricedAs ?? c.pricedAs }
              : c,
          );
          break;
        case "price-qty":
          lines = lines.map((l) => (l.id === p.lineId ? { ...l, qty: p.qty } : l));
          break;
        case "page-limit":
          sections = sections.map((sec) =>
            sec.id === p.sectionId ? { ...sec, pageLimit: p.pageLimit } : sec,
          );
          break;
        case "requirement":
          hardRequirements = hardRequirements.map((r) =>
            r.id === p.requirementId ? { ...r, label: p.label } : r,
          );
          break;
        case "draft-text":
          sections = sections.map((sec) =>
            sec.id === p.sectionId
              ? {
                  ...sec,
                  paragraphs: sec.paragraphs.map((para, i) =>
                    i === p.paragraphIndex ? applyRedline(para, p.remove, p.insert) : para,
                  ),
                }
              : sec,
          );
          break;
        case "none":
          break;
      }
    }
  }

  // "Use your registered name" rewrites the draft, not only the check: every
  // place the writing names the company takes the registered name.
  let nameInDraft = bid.nameInDraft;
  if (s.fixes["name-sam"] && bid.nameInDraft !== bid.samLegalName) {
    sections = sections.map((sec) => ({
      ...sec,
      paragraphs: sec.paragraphs.map((para) =>
        para.map((sp) =>
          sp.text.includes(bid.nameInDraft)
            ? { ...sp, text: sp.text.split(bid.nameInDraft).join(bid.samLegalName) }
            : sp,
        ),
      ),
    }));
    nameInDraft = bid.samLegalName;
  }

  if (s.fixes[DEMO.rates]) lines = lines.map((l) => ({ ...l, qty: null }));
  let price: PriceModel | null = bid.price ? { ...bid.price, lines } : null;
  // A rate list has no recipe: she types each rate (Price it yourself).
  if (price && (s.fixes[PRICE_YOURSELF_KEY] || s.fixes[DEMO.rates]))
    price = { ...price, builtBy: "you" };
  if (s.fixes[DEMO.noPrice]) price = null;
  let asks = price?.builtBy === "you" ? asksWhenPricedByYou(bid.asks, price) : bid.asks;
  if (!price && bid.price) {
    // A bid with no price asks nothing that only builds a price.
    asks = asks.filter(
      (a) => !(a.feeds.length > 0 && a.feeds.every((f) => f.startsWith("Price · "))),
    );
  }

  if (s.fixes[DEMO.dueTomorrow]) deadline = { ...deadline, dueDaysFromNow: 1 };
  if (s.fixes[DEMO.dueToday]) deadline = { ...deadline, dueDaysFromNow: 0 };
  if (s.fixes[DEMO.duePassed]) deadline = { ...deadline, dueDaysFromNow: -1 };

  let files = bid.files.filter((f) => !(f.addendumId && pendingIds.has(f.addendumId)));
  if (s.fixes[DEMO.noMain]) files = files.filter((f) => f.role !== "main");
  if (s.fixes[DEMO.unreadable])
    files = files.map((f) =>
      f.role === "main"
        ? { ...f, readability: "garbled" as const, note: "Its words come out jumbled." }
        : f,
    );
  if (s.fixes[DEMO.scan])
    files = files.map((f) =>
      f.role === "main"
        ? {
            ...f,
            readability: "scan" as const,
            note: "A scan. I read it from a picture of each page.",
          }
        : f,
    );
  // A scanned main file is read from a picture of each page, and the build
  // goes on (PRD TD-03, PC-1, 7 October 2026). The due date and the price
  // lines Ava read from it are hers to confirm, first: a misread one can lose
  // the bid (C-45).
  const mainScan = files.find((f) => f.role === "main" && f.readability === "scan");
  if (mainScan) asks = [...scanAsks(deadline, price, mainScan.name), ...asks];
  if (s.fixes[DEMO.noFiles]) files = [];
  // A bid the buyer allows no price for has no price sheet, in its files or in hers.
  let submission = bid.submission;
  if (s.fixes[DEMO.noPrice]) {
    files = files.filter((f) => f.role !== "price-form");
    submission = {
      ...submission,
      files: submission.files.filter((f) => !f.contains.some((c) => c.kind === "price")),
    };
  }

  const draftStaffing =
    s.fixes[DEMO.staffingDrift] && price && price.roles.length > 0
      ? price.roles.map((r, i) => ({
          roleId: r.id,
          count: r.count,
          hoursPerWeek: i === 0 ? Math.max(0, r.hoursPerWeek - 10) : r.hoursPerWeek,
        }))
      : bid.draftStaffing;

  return {
    ...bid,
    draftStaffing,
    nameInDraft,
    deadline,
    commitments,
    hardRequirements,
    sections,
    asks,
    price,
    // An addendum that has not arrived has no file and no acknowledgment form yet.
    files,
    submission,
    forms: bid.forms.filter(
      (f) => !(f.acknowledgesAddendumId && pendingIds.has(f.acknowledgesAddendumId)),
    ),
  };
}

// ─── Dates ───

/** The due moment as a UTC instant, from the day + the time and zone in the text.
 *  Null zone: the instant is unknown to the hour, and the screen says so. */
export function dueInstant(bid: AvaBid): Date {
  const day = dayFromNow(bid.deadline.dueDaysFromNow);
  const [h, m] = bid.deadline.time24.split(":").map(Number);
  const offset = bid.deadline.utcOffset ?? 0;
  return new Date(day.getTime() + ((h - offset) * 60 + m) * 60_000);
}

export function dueDay(bid: AvaBid): Date {
  return dayFromNow(bid.deadline.dueDaysFromNow);
}

export function daysLeft(bid: AvaBid): number {
  return daysFromToday(dueDay(bid));
}

/** The last day to answer an ask: a fixed event date when there is one,
 *  otherwise worked back from the due date by the ask's lead time and two
 *  business days for Ava to use the answer. Never before today. */
export function decideBy(ask: Ask, bid: AvaBid): Date {
  return later(decideByRaw(ask, bid), today());
}

/** The decide-by date before it is held at today. Earlier than today means
 *  the lead time no longer fits before the deadline (checks.ts "late"). */
export function decideByRaw(ask: Ask, bid: AvaBid): Date {
  if (ask.decideByDaysFromNow !== undefined) return dayFromNow(ask.decideByDaysFromNow);
  return minusBusinessDays(dueDay(bid), ask.leadDays + 2);
}

/** True when the date can't slip: a fixed event, or the lead time already
 *  pushes the decide-by date to today. */
export function dateCannotSlip(ask: Ask, bid: AvaBid): boolean {
  return ask.decideByDaysFromNow !== undefined || daysFromToday(decideBy(ask, bid)) <= 1;
}

// ─── Asks ───

export type AskStatus = "open" | "forwarded" | "done" | "replaced";

export function answerOf(s: BidState, askId: string): AskAnswer | undefined {
  return s.answers[askId];
}

/** An ask is resolved when answered, or when "I don't have this" opened
 *  another ask and that one is resolved. */
export function askResolved(bid: AvaBid, s: BidState, askId: string, depth = 0): boolean {
  const a = s.answers[askId];
  if (!a || depth > 5) return false;
  if (a.status === "done") return true;
  if (a.status === "dont-have") {
    const ask = bid.asks.find((x) => x.id === askId);
    const opt = ask?.dontHave?.find((o) => o.id === a.optionId);
    if (opt?.outcome === "new-ask" && opt.opensAskId) {
      return askResolved(bid, s, opt.opensAskId, depth + 1);
    }
  }
  return false;
}

export function askStatus(bid: AvaBid, s: BidState, ask: Ask): AskStatus {
  const a = s.answers[ask.id];
  // Going ahead without a file the member could not upload settles its
  // upload ask: the risk label carries it from here, not the list.
  if ((!a || a.status === "forwarded") && goneAheadWithout(bid, s, ask.id)) return "replaced";
  if (!a) return "open";
  if (a.status === "done") return "done";
  if (a.status === "forwarded") return "forwarded";
  return "replaced";
}

/** The file this ask would upload, when the member chose to go ahead without it. */
export function goneAheadWithout(bid: AvaBid, s: BidState, askId: string) {
  return bid.files.find((f) => f.uploadAskId === askId && s.risks[`file:${f.id}`]) ?? null;
}

/** Asks the member can see: hidden asks appear once another answer opens them. */
export function visibleAsks(bid: AvaBid, s: BidState): Ask[] {
  return bid.asks.filter((a) => !a.hiddenUntilOpened || isOpened(bid, s, a.id));
}

/** Every ask whose answer can open another: a choice's follow-up, or the ask
 *  an "I don't have this" option turns into. */
function openersOf(bid: AvaBid, askId: string): Ask[] {
  return bid.asks.filter(
    (x) =>
      (x.answer.type === "answer" && x.answer.choices.some((c) => c.opensAskId === askId)) ||
      (x.dontHave ?? []).some((o) => o.opensAskId === askId),
  );
}

/** A hidden ask is open while an answer that opens it stands. Changing that
 *  answer closes it again, so a follow-up never outlives its reason. An ask
 *  nothing in the bid opens (a file Ava could not read) stays as opened. */
function isOpened(bid: AvaBid, s: BidState, askId: string): boolean {
  const openers = openersOf(bid, askId);
  if (openers.length === 0) return !!s.opened[askId];
  return openers.some((x) => {
    const a = s.answers[x.id];
    if (!a) return false;
    if (a.status === "dont-have")
      return x.dontHave?.find((o) => o.id === a.optionId)?.opensAskId === askId;
    return (
      x.answer.type === "answer" &&
      x.answer.choices.find((c) => c.id === a.choiceId)?.opensAskId === askId
    );
  });
}

/** Open asks, slowest first: the earliest decide-by date, then the longest lead. */
export function openAsks(bid: AvaBid, s: BidState): Ask[] {
  return visibleAsks(bid, s)
    .filter((a) => {
      const st = askStatus(bid, s, a);
      return st === "open" || st === "forwarded";
    })
    .sort(
      (x, y) => decideBy(x, bid).getTime() - decideBy(y, bid).getTime() || y.leadDays - x.leadDays,
    );
}

/** True when the buyer needs the answer with the bid. An item the buyer needs
 *  only at award or before work starts never holds the bid (Ava-Simplified,
 *  page 2: "This keeps after-award items from blocking the bid"). */
export function neededWithBid(item: { neededAt?: Ask["neededAt"] }): boolean {
  return (item.neededAt ?? "bid") === "bid";
}

/** When the buyer needs an ask answered: its own date, else the date of the
 *  rule it serves, else with the bid. */
export function askNeededAt(bid: AvaBid, ask: Ask): NonNullable<Ask["neededAt"]> {
  if (ask.neededAt) return ask.neededAt;
  const rule = bid.hardRequirements.find(
    (r) => r.askId === ask.id || (r.askIds ?? []).includes(ask.id),
  );
  return rule?.neededAt ?? "bid";
}

/** Open asks the bid needs before it is submitted, slowest first. */
export function openBidAsks(bid: AvaBid, s: BidState): Ask[] {
  return openAsks(bid, s).filter((a) => askNeededAt(bid, a) === "bid");
}

export function doneAsks(bid: AvaBid, s: BidState): Ask[] {
  return visibleAsks(bid, s).filter((a) => {
    const st = askStatus(bid, s, a);
    return st === "done" || st === "replaced";
  });
}

export function minutesOf(asks: Ask[]): number {
  return asks.reduce((n, a) => n + a.minutes, 0);
}

/** Groups by who answers, for "Forward a group". Only groups with open asks. */
export function askGroups(bid: AvaBid, s: BidState): { owner: Ask["owner"]; asks: Ask[] }[] {
  const open = openAsks(bid, s).filter((a) => askStatus(bid, s, a) === "open");
  const owners = [...new Set(open.map((a) => a.owner))];
  return owners.map((owner) => ({ owner, asks: open.filter((a) => a.owner === owner) }));
}

// ─── Hard requirements ───

const RANK: Record<ReqStatus, number> = { "not-yet": 0, confirm: 1, meets: 2 };

export type Verdict = { status: ReqStatus; evidence?: string };

/** What one answer says about the rule it serves. Null = not answered yet.
 *  Page 2 reads it for every row, so a row and its rule never disagree. */
export function askVerdict(bid: AvaBid, s: BidState, askId: string): Verdict | null {
  return judgeAsk(bid, s, askId);
}

/** What one answer says about the rule it serves. Null = not answered yet.
 *  The answer itself is judged — a failing choice, a pay rate under the
 *  floor, or a stand-in that is a step toward the rule never reads "Meets". */
function judgeAsk(bid: AvaBid, s: BidState, askId: string, depth = 0): Verdict | null {
  const a = s.answers[askId];
  const ask = bid.asks.find((x) => x.id === askId);
  if (!a || a.status === "forwarded" || !ask || depth > 5) return null;
  if (a.status === "dont-have") {
    const opt = ask.dontHave?.find((o) => o.id === a.optionId);
    if (!opt || opt.outcome === "bid-decision") {
      return {
        status: "not-yet",
        evidence: opt ? `You chose: ${opt.label.replace(/\.$/, "")}` : undefined,
      };
    }
    if (!opt.opensAskId)
      return { status: "confirm", evidence: `You chose: ${opt.label.replace(/\.$/, "")}` };
    const next = judgeAsk(bid, s, opt.opensAskId, depth + 1);
    if (next === null) return null;
    if (next.status !== "meets") return next;
    return opt.satisfies
      ? { status: "meets", evidence: `You chose: ${opt.label.replace(/\.$/, "")}` }
      : {
          status: "confirm",
          evidence: `You chose: ${opt.label.replace(/\.$/, "")}. The rule is not met until the proof arrives.`,
        };
  }
  if (ask.answer.type === "answer") {
    const choice = ask.answer.choices.find((c) => c.id === a.choiceId);
    if (choice?.failsGate) return { status: "not-yet", evidence: `Your answer: ${choice.label}` };
    // A plan ("we will attend") gives way to its follow-up once answered
    // ("we signed the sheet"): the follow-up decides.
    if (choice?.gives && choice.opensAskId && s.answers[choice.opensAskId]) {
      return judgeAsk(bid, s, choice.opensAskId, depth + 1);
    }
    if (choice?.gives) return choice.gives;
  }
  // "This is not right" and a typed correction: the member told Ava the fact
  // is different. That is their word to check against the rule, not a pass.
  if (typeof a.values?.correction === "string") {
    return { status: "confirm", evidence: `You corrected it: ${a.values.correction}` };
  }
  if (ask.answer.type === "enter") {
    for (const f of ask.answer.fields) {
      const v = a.values?.[f.id];
      if (f.floor && typeof v === "number" && v < f.floor.value) {
        return { status: "not-yet", evidence: `${f.label} is under the floor of ${f.floor.value}` };
      }
    }
  }
  return { status: "meets" };
}

export function reqStatus(bid: AvaBid, s: BidState, r: HardRequirement): Verdict {
  const ids = [r.askId, ...(r.askIds ?? [])].filter((x): x is string => !!x);
  let result: Verdict = { status: r.initial, evidence: r.evidence };
  if (ids.length > 0) {
    let worst: Verdict = { status: "meets" };
    let complete = true;
    for (const id of ids) {
      const v = judgeAsk(bid, s, id);
      if (v === null) {
        complete = false;
        break;
      }
      if (RANK[v.status] < RANK[worst.status]) worst = v;
    }
    if (!complete) {
      // An earlier answer that did not settle the rule keeps its word;
      // otherwise the rule reads as Ava first found it.
      result = worst.status !== "meets" ? worst : { status: r.initial, evidence: r.evidence };
    } else if (worst.status === "meets") {
      result = { status: r.afterAsk ?? "meets", evidence: r.evidenceAfter ?? r.evidence };
    } else {
      result = worst;
    }
  }
  // An addendum that rewrote this rule reopens it until the member confirms
  // they still meet it (fix key "reconfirm:<id>"), or gives her word on the
  // rule as it now reads.
  const changedBy = receivedAddenda(bid, s).find((a) =>
    a.changes.some((c) =>
      [c.patch, ...(c.alsoPatches ?? [])].some(
        (p) => p.kind === "requirement" && p.requirementId === r.id,
      ),
    ),
  );
  const m = s.mustHave[r.id];
  const saidOnNewRule =
    !!m && (!changedBy?.arrivesDuringBuild || (m.addenda ?? []).includes(changedBy.id));
  if (changedBy && result.status === "meets" && !s.fixes[`reconfirm:${r.id}`] && !saidOnNewRule) {
    return {
      status: "confirm",
      evidence: `Addendum ${changedBy.number} changed this rule. Confirm you still meet it.`,
    };
  }
  return result;
}

/** An addendum that arrived after she gave her word or her answer on this
 *  rule changed it: what she said was about the old rule, so it is set aside
 *  and the rule is asked again (review panel, 7 October 2026). The addendum,
 *  or null. */
export function ruleReopenedBy(bid: AvaBid, s: BidState, r: HardRequirement) {
  const a = requirementChangedBy(bid, s, r.id);
  if (!a || !a.arrivesDuringBuild || s.fixes[`reconfirm:${r.id}`]) return null;
  const ids = [r.askId, ...(r.askIds ?? [])].filter((x): x is string => !!x);
  const m = s.mustHave[r.id];
  const said = [m, ...ids.map((id) => s.answers[id])].filter((x) => !!x);
  // Never answered: it is asked the usual way, on the rule as it reads now.
  if (said.length === 0) return null;
  return said.some((x) => (x!.addenda ?? []).includes(a.id)) ? null : a;
}

/** The addendum that rewrote this requirement, if any (for "I still meet it"). */
export function requirementChangedBy(bid: AvaBid, s: BidState, requirementId: string) {
  return (
    receivedAddenda(bid, s).find((a) =>
      a.changes.some((c) =>
        [c.patch, ...(c.alsoPatches ?? [])].some(
          (p) => p.kind === "requirement" && p.requirementId === requirementId,
        ),
      ),
    ) ?? null
  );
}

// ─── Commitments ───

export type CommitmentStatus = "approved" | "needs-approval" | "reopened" | "no-approval-needed";

export function commitmentStatus(s: BidState, c: Commitment): CommitmentStatus {
  const approved = s.commitments[c.id];
  if (!c.needsApproval) return "no-approval-needed";
  if (!approved) return "needs-approval";
  return approved.text === c.text ? "approved" : "reopened";
}

export function openCommitments(bid: AvaBid, s: BidState): Commitment[] {
  return bid.commitments.filter((c) => {
    const st = commitmentStatus(s, c);
    return st === "needs-approval" || st === "reopened";
  });
}

// ─── Scans ───

/** The ids of what Ava asks her to confirm from a scanned main file. */
export const SCAN_ASK = "ask-scan-";

/** What Ava read from a scanned main file that can lose the bid if misread:
 *  the due date, and the lines on the price sheet. Each is a yes she gives,
 *  with the page beside it (C-45). */
function scanAsks(deadline: AvaBid["deadline"], price: PriceModel | null, file: string): Ask[] {
  const due = `${weekdayDate(dayFromNow(deadline.dueDaysFromNow))}, ${deadline.time}${
    deadline.zone ? ` ${deadline.zone}` : ""
  }`;
  const out: Ask[] = [
    {
      id: `${SCAN_ASK}due`,
      kind: "approve",
      title: "The due date, read from a scan",
      source: deadline.source,
      why: "Your main file is a scan. I read it from a picture of each page. A wrong due date can lose the bid.",
      owner: "you",
      leadDays: 0,
      minutes: 1,
      answer: {
        type: "approve",
        proposal: `The due date, as I read it from a scan: ${due}.`,
        from: `${file}, a scan`,
        value: due,
      },
      feeds: ["The whole bid · Due date"],
    },
  ];
  if (price && price.lines.length > 0) {
    const lines = price.lines
      .map((l) => `${l.item}${l.qty !== null ? `, ${l.qty.toLocaleString("en-US")} a year` : ""}`)
      .join("; ");
    out.push({
      id: `${SCAN_ASK}price`,
      kind: "approve",
      title: "The price lines, read from a scan",
      source: price.contractTypeSource,
      why: "A wrong line or amount on the price sheet can lose the bid. You check what I read.",
      owner: "you",
      leadDays: 0,
      minutes: 2,
      answer: {
        type: "approve",
        proposal: `The ${price.lines.length === 1 ? "line" : `${price.lines.length} lines`} to price, as I read them from a scan: ${lines}.`,
        from: `${file}, a scan`,
        value: lines,
      },
      feeds: ["Price sheet · Lines"],
    });
  }
  return out;
}

// ─── Files ───

/** A file Ava could not read that the member has neither uploaded nor
 *  chosen to go ahead without. */
export function blockedFiles(bid: AvaBid, s: BidState) {
  return bid.files.filter(
    (f) =>
      !readable(f) &&
      f.riskIfMissing !== "minor" &&
      !(f.uploadAskId && askResolved(bid, s, f.uploadAskId)) &&
      !s.risks[`file:${f.id}`],
  );
}

// ─── Clarifications ───

export type ClarStatus = "open" | "sent" | "answered" | "settled";

export function clarificationStatus(bid: AvaBid, s: BidState, clarId: string): ClarStatus {
  const c = bid.clarifications.find((x) => x.id === clarId);
  if (
    c?.settledByAddendumId &&
    receivedAddenda(bid, s).some((a) => a.id === c.settledByAddendumId)
  ) {
    return "settled";
  }
  const st = s.clarifications[clarId];
  if (st?.reply && st.settled) return "answered";
  if (st?.sentAt || st?.reply) return "sent";
  return "open";
}

/** The Clarification needed flag: nothing in the buyer's files or in a
 *  written answer settles it yet. */
export function openClarifications(bid: AvaBid, s: BidState) {
  return bid.clarifications.filter((c) => {
    const st = clarificationStatus(bid, s, c.id);
    return st === "open" || st === "sent";
  });
}

// ─── The draft ───

export interface ClaimView {
  tag: ClaimTag;
  /** Replaces the span text once an unsupported claim is answered. */
  text?: string;
  gap?: string;
  proof?: Proof;
  /** Commitment claims only. */
  commitment?: { status: CommitmentStatus; commitment: Commitment };
}

export function claimView(bid: AvaBid, s: BidState, claim: Claim): ClaimView {
  if (claim.tag === "unsupported") {
    if (claim.askId && askResolved(bid, s, claim.askId)) {
      const a = s.answers[claim.askId];
      let text = claim.resolvedText;
      if (claim.resolvedByChoice && a?.choiceId && claim.resolvedByChoice[a.choiceId]) {
        text = claim.resolvedByChoice[a.choiceId];
      }
      if (claim.resolvedTemplate && a?.values) {
        const filled = claim.resolvedTemplate.replace(/\{([\w-]+)\}/g, (_m, k: string) => {
          const v = a.values?.[k];
          return v === undefined || v === ""
            ? "\u0000"
            : String(v)
                .trim()
                .replace(/[.\s]+$/, "");
        });
        // A blank field leaves the fixed wording, never a half-filled sentence.
        if (!filled.includes("\u0000")) text = filled;
      }
      return {
        tag: "confirmed",
        text,
        proof: {
          kind: "you-confirmed",
          from: "You told Ava",
          locator: a?.at ? `Answered ${fullDate(new Date(a.at))}` : "Your answer",
          quote: claim.resolvedText ?? "Your answer",
        },
      };
    }
    return { tag: "unsupported", gap: claim.gap };
  }
  if (claim.tag === "commitment" && claim.commitmentId) {
    const c = bid.commitments.find((x) => x.id === claim.commitmentId);
    if (c)
      return { tag: "commitment", commitment: { status: commitmentStatus(s, c), commitment: c } };
  }
  // Verified means a document or a government record backs it. Something the
  // member typed into their profile is their own word: You confirmed.
  if (claim.tag === "verified" && claim.proof?.kind === "profile") {
    return { tag: "confirmed", proof: claim.proof };
  }
  return { tag: claim.tag, proof: claim.proof };
}

/** Replace `remove` in a paragraph with `insert`, splitting spans where needed.
 *  Returns the paragraph unchanged when the text isn't there (never guesses). */
export function applyRedline(spans: Span[], remove: string, insert: Span[]): Span[] {
  const full = spans.map((x) => x.text).join("");
  const at = full.indexOf(remove);
  if (at < 0 || remove.length === 0) return spans;
  const end = at + remove.length;
  const out: Span[] = [];
  let pos = 0;
  let inserted = false;
  for (const sp of spans) {
    const s0 = pos;
    const s1 = pos + sp.text.length;
    pos = s1;
    if (s1 <= at || s0 >= end) {
      if (s0 >= end && !inserted) {
        out.push(...insert);
        inserted = true;
      }
      out.push(sp);
      continue;
    }
    // This span overlaps the removed range: keep its outside parts.
    if (s0 < at) out.push({ ...sp, text: sp.text.slice(0, at - s0) });
    if (!inserted) {
      out.push(...insert);
      inserted = true;
    }
    if (s1 > end) out.push({ ...sp, text: sp.text.slice(end - s0) });
  }
  if (!inserted) out.push(...insert);
  return out;
}

/** The section's paragraphs with every accepted redline applied. */
export function sectionParagraphs(s: BidState, sec: DraftSection): Span[][] {
  let paras = sec.paragraphs.map((p) => [...p]);
  for (const ch of sec.challenges) {
    const optId = s.redlines[`${sec.id}:${ch.id}`];
    const opt = ch.options.find((o) => o.id === optId);
    if (!opt) continue;
    paras = paras.map((p, i) =>
      i === opt.paragraphIndex ? applyRedline(p, opt.redline.remove, opt.redline.insert) : p,
    );
  }
  // Ava's decisions: her own words stay, marked; the other wording, or the
  // member's own, takes their place.
  for (const d of sec.decisions ?? []) {
    const got = s.decisions?.[decisionKey(sec.id, d.id)];
    const text = got?.pick === "other" ? d.other : got?.pick === "own" ? got.text : undefined;
    paras = paras.map((p, i) => {
      if (i !== d.paragraphIndex) return p;
      return text
        ? applyRedline(p, d.choice, [{ text, decisionId: d.id }])
        : markRange(p, d.choice, d.id);
    });
  }
  // Sentences rewritten while she read: hers, or her mentor's, marked.
  for (const e of Object.values(s.edits ?? {})) {
    if (e.sectionId !== sec.id) continue;
    paras = paras.map((p, i) =>
      i === e.paragraph ? applyRedline(p, e.was, [{ text: e.now, edit: e.by }]) : p,
    );
  }
  return paras;
}

/** The spans that carry `text`, split at its ends and marked as a decision's
 *  words. Facts inside keep their proof. */
function markRange(spans: Span[], text: string, decisionId: string): Span[] {
  const at = spans
    .map((x) => x.text)
    .join("")
    .indexOf(text);
  if (at < 0 || text.length === 0) return spans;
  const end = at + text.length;
  const out: Span[] = [];
  let pos = 0;
  for (const sp of spans) {
    const s0 = pos;
    const s1 = pos + sp.text.length;
    pos = s1;
    if (s1 <= at || s0 >= end) {
      out.push(sp);
      continue;
    }
    if (s0 < at) out.push({ ...sp, text: sp.text.slice(0, at - s0) });
    out.push({
      ...sp,
      text: sp.text.slice(Math.max(at, s0) - s0, Math.min(end, s1) - s0),
      decisionId,
    });
    if (s1 > end) out.push({ ...sp, text: sp.text.slice(end - s0) });
  }
  return out;
}

/** Claims in the section as it reads now. */
export function sectionClaims(s: BidState, sec: DraftSection): Claim[] {
  return sectionParagraphs(s, sec)
    .flat()
    .flatMap((sp) => (sp.claim ? [sp.claim] : []));
}

/** Measured pages after any fix Ava applied. */
export function sectionPages(s: BidState, sec: DraftSection): number {
  if (s.fixes[`pages:${sec.id}`] && sec.pageLimit) return Math.min(sec.pages, sec.pageLimit);
  return sec.pages;
}

/** Unsupported claims still open across the draft. They stay out of the export. */
export function openGaps(bid: AvaBid, s: BidState): { sectionId: string; claim: Claim }[] {
  return bid.sections.flatMap((sec) =>
    sectionClaims(s, sec)
      .filter((c) => claimView(bid, s, c).tag === "unsupported")
      .map((claim) => ({ sectionId: sec.id, claim })),
  );
}

// ─── Bid decision ───

export function bidDecision(bid: AvaBid, s: BidState) {
  if (s.decision) return s.decision;
  if (bid.failedAtStart && !s.fixes["failed-at-start"]) {
    return { reason: bid.failedAtStart.reason, source: bid.failedAtStart.source };
  }
  return failingAnswer(bid, s);
}

/** An answer on file that fails a knock-out: a choice that fails the rule,
 *  or an "I don't have this" option that sends the bid back. */
function failingAnswer(
  bid: AvaBid,
  s: BidState,
): { reason: string; source?: Ask["source"]; fromAskId: string } | null {
  for (const ask of visibleAsks(bid, s)) {
    const a = s.answers[ask.id];
    if (!a) continue;
    if (a.status === "dont-have") {
      const o = ask.dontHave?.find((x) => x.id === a.optionId);
      if (o?.outcome === "bid-decision")
        return { reason: o.detail, source: o.source ?? ask.source, fromAskId: ask.id };
      continue;
    }
    if (ask.answer.type !== "answer") continue;
    const c = ask.answer.choices.find((x) => x.id === a.choiceId);
    if (c?.failsGate) return { reason: c.failsGate, source: ask.source, fromAskId: ask.id };
  }
  return null;
}

/** The day an addendum was posted, as the member sees it. One that arrives
 *  during the build is delivered by the prototype's control "now", and the
 *  prototype clock does not move — so it reads as posted today rather than
 *  on a date still in the future. */
export function addendumPostedDay(a: Addendum): Date {
  return a.arrivesDuringBuild ? today() : dayFromNow(a.postedDaysFromNow);
}
