// Ava in two phases (docs/ava/build-handoff-two-phase.md, ava-two-phase.html).
//
//   Phase 1, "Build your bid together": Ava reads the buyer's files, checks
//   she can bid (the rules that get a bid rejected), asks her questions one at
//   a time, then checks the whole bid for mistakes on her own.
//   Phase 2, "Read it and send it": her own read of the finished bid, an
//   optional mentor review, then she downloads it and sends it herself.
//
// Pure derivations over the effective bid and her state, like derive.ts and
// pages.ts. Nothing here writes. The header, the steps, the conversation, the
// checklist and the bid all read these, so no two of them can disagree about
// what is open, what is a hole, or what holds the download.
//
// Holes (Shyam, 7 October 2026): anything Ava cannot do, she or her mentor
// does. A hole stays marked in her bid and in the file she downloads. It holds
// the download only when the buyer would reject the bid without it (decision 1
// of the build plan; KNOWLEDGE D-C3, D-C5). Every other hole goes through,
// marked.
//
// What holds the download comes from what the thing IS, never from a
// severity (review panel, 7 October 2026): a rule that rejects the bid, her
// price, her promises, an addendum, or anything reopened after she started
// reading. None of those can go ahead at risk.

import { blockingFindings, exactChecks, findingState, riskAllowed, type Finding } from "./checks";
import {
  askResolved,
  askStatus,
  bidDecision,
  DEMO,
  commitmentStatus,
  daysLeft,
  decideBy,
  openBidAsks,
  ruleReopenedBy,
  SCAN_ASK,
  sectionParagraphs,
  visibleAsks,
} from "./derive";
import {
  dayFromNow,
  daysFromToday,
  fullDate,
  minusBusinessDays,
  today,
  weekdayDate,
} from "./dates";
import { findOpportunity } from "../../demo/ava/opportunity";
import { PERSONA } from "../../demo/story/persona";
import { wait } from "../../demo/ava/pace";
import { packageParts, piecesOfAsk, type Part, type Piece } from "./package";
import {
  complianceItems,
  fillCount,
  knockOutRules,
  priceAskIds,
  type ComplianceItem,
  type RuleState,
} from "./pages";
import { approvalTotal, isRateList, missingPriceAsks, rates, ratesApproved, usd } from "./price";
import { decisionKey, type BidState, type LeadSaid } from "./store";
import type {
  Ask,
  AvaBid,
  BidFile,
  Clarification,
  Commitment,
  HardRequirement,
  Source,
  WritingDecision,
} from "./types";
import { readable } from "./types";

// ─── Words ───

/** What she calls the buyer: "the city's files", "the Army's files". */
export function buyerWord(bid: AvaBid): string {
  if (/^city\b/i.test(bid.buyer)) return "city";
  if (/county/i.test(bid.buyer)) return "county";
  if (/\barmy\b|fort bragg/i.test(bid.buyer)) return "Army";
  if (/school|\bisd\b|district/i.test(bid.buyer)) return "district";
  return "buyer";
}

/** "1 thing", "3 things". */
export function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

// ─── The kind of proof a question wants ───

export type ProofKind = "copy" | "word" | "there" | "later" | "type" | "choose";

export const PROOF_LABEL: Record<ProofKind, string> = {
  copy: "A copy",
  word: "Your word",
  there: "Be there",
  later: "Only if you win",
  type: "Type it in",
  choose: "Choose one",
};

/** What an ask wants: a copy, her word, being there, typing, or a choice. */
export function proofOf(bid: AvaBid, ask: Ask): ProofKind {
  if (ask.proof) return ask.proof;
  const at = ask.neededAt ?? ruleOfAsk(bid, ask.id)?.neededAt ?? "bid";
  if (at !== "bid") return "later";
  switch (ask.kind) {
    case "upload":
      return "copy";
    case "enter":
      return "type";
    case "approve":
      return "word";
    case "answer":
      return ask.answer.type === "answer" && ask.answer.choices.length > 2 ? "choose" : "word";
  }
}

/** The rule an ask proves, if any. */
export function ruleOfAsk(bid: AvaBid, askId: string): HardRequirement | undefined {
  return bid.hardRequirements.find((r) => r.askId === askId || (r.askIds ?? []).includes(askId));
}

// ─── Where an answer goes ───

/** "part 3, Menu and food safety", "Form 5, References", "your price sheet". */
export function pieceWords(parts: Part[], pc: Piece): string {
  if (pc.kind === "section") {
    const proposal = parts.find((p) => p.pieces.some((x) => x.id === pc.id));
    const secs = proposal?.pieces.filter((x) => x.kind === "section") ?? [];
    const n = secs.findIndex((x) => x.id === pc.id) + 1;
    return `part ${n}, ${pc.label}`;
  }
  if (pc.kind === "price") return "your price sheet";
  if (pc.kind === "papers") return "the papers you send";
  if (pc.kind === "portal") return `the portal's screen ${pc.label}`;
  return pc.label;
}

// ─── Questions: every input is one ───

export type QuestionKind =
  /** A rule that can get the bid rejected, asked before Ava builds. */
  | "must"
  | "ask"
  | "promise"
  | "decision"
  /** Her staffing plan: the one thing Ava cannot price without her. */
  | "staffing"
  /** Her yes on the price Ava built. */
  | "price"
  /** A question for the buyer, drafted by Ava. */
  | "clar"
  /** Something Ava's check found that only she can answer. */
  | "fix"
  /** A typed portal whose questions sit behind its login: she shows Ava the
   *  screens first (6.4, R13). */
  | "portal";

export interface Question {
  /** "must:<ruleId>", "ask:<id>", "promise:<id>", "decision:<sec>:<id>",
   *  "staffing", "price", "clar:<id>", "fix:<findingId>". */
  key: string;
  kind: QuestionKind;
  /** What it is, as a short noun phrase: the checklist row and Needs you. */
  title: string;
  proof: ProofKind;
  /** The pieces of the bid it lands in, and their words. */
  pieces: Piece[];
  goes: string | null;
  /** "Why?", on demand only: one plain line and the buyer's words. */
  why: { text: string; source: Source } | null;
  /** Its absence would get the bid rejected and it belongs in the files: an
   *  open one holds the download (decision 1). */
  holds: boolean;
  ask?: Ask;
  rule?: HardRequirement;
  commitment?: Commitment;
  decision?: { sectionId: string; decision: WritingDecision };
  clar?: Clarification;
  finding?: Finding;
  /** An addendum changed this rule after she answered: "Addendum 1 changed
   *  this rule. Do you still meet it?" The addendum's number. */
  changedBy?: number;
}

/** The staffing plan's key in `fixes` once she approves it. */
export const STAFFING_KEY = "staffing:approved";

/** Ava builds the price from a staffing plan she has not approved yet. Until
 *  she does, there is no price to show or to approve (design 6.5; PRD §15.10). */
export function staffingOpen(bid: AvaBid, s: BidState): boolean {
  const p = bid.price;
  return !!p && p.builtBy !== "you" && p.roles.length > 0 && !s.fixes[STAFFING_KEY];
}

/** Her answer to "How long will it take?", in days. */
const LEAD_DAYS: Record<Exclude<LeadSaid, "unsure">, number> = { days: 3, week: 7, weeks: 14 };

/** The answers she can give, in her words. */
export const LEAD_WORDS: Record<LeadSaid, string> = {
  days: "A few days",
  week: "About a week",
  weeks: "Two weeks or more",
  unsure: "I'm not sure",
};

/** The day a paper she is getting must be in her bid: two business days
 *  before the due date, so there is time to add it and check it. */
export function addByDay(bid: AvaBid): Date {
  return minusBusinessDays(dayFromNow(bid.deadline.dueDaysFromNow), 2);
}

/** How Ava says when to ask for a paper from someone else. Ava asks her how
 *  long it takes and works the date out from her answer; it never states a
 *  lead time of its own (PRD OD2, Shyam, 8 October 2026). Before she says,
 *  there is nothing to say. */
export function leadLine(
  bid: AvaBid,
  s: BidState,
  ask: Ask,
): { fits: boolean | null; text: string } {
  if (ask.decideByDaysFromNow !== undefined)
    return { fits: true, text: `Get it by ${fullDate(dayFromNow(ask.decideByDaysFromNow))}.` };
  const said = s.lead?.[ask.id];
  const addBy = addByDay(bid);
  if (!said) return { fits: null, text: "" };
  if (said === "unsure")
    return {
      fits: null,
      text: `Ask for it today. It must be in your bid by ${fullDate(addBy)}. If you are not sure it comes in time, ask a mentor.`,
    };
  const askBy = new Date(addBy.getTime() - LEAD_DAYS[said] * 86_400_000);
  if (askBy.getTime() >= today().getTime())
    return {
      fits: true,
      text: `There is time. Ask for it by ${fullDate(askBy)}, so it is in your bid by ${fullDate(addBy)}.`,
    };
  return {
    fits: false,
    text: `It may not come in time: your bid is due ${fullDate(dayFromNow(bid.deadline.dueDaysFromNow))}. Ask for it today.`,
  };
}

/** An ask about an event still to come ("Did you sign the attendance
 *  sheet?"), opened by her plan to go. It is asked on its day, never before:
 *  nobody can truthfully answer it early (D-D10). */
export function laterFollowUp(bid: AvaBid, ask: Ask): boolean {
  if (ask.decideByDaysFromNow === undefined || ask.decideByDaysFromNow <= 0) return false;
  return bid.asks.some(
    (x) =>
      x.answer.type === "answer" &&
      x.answer.choices.some((c) => c.opensAskId === ask.id && c.gives !== undefined),
  );
}

/** Where an answer is shown when it lands in several places: the writing it
 *  fills first (2.4: "every gap is a hole in the section it fills"), then the
 *  paper itself, a form, the price sheet. */
const HOME: Record<Piece["kind"], number> = { section: 0, papers: 1, form: 2, portal: 2, price: 3 };

function askQuestion(
  bid: AvaBid,
  s: BidState,
  parts: Part[],
  ask: Ask,
  kind: QuestionKind = "ask",
): Question {
  const rule = ruleOfAsk(bid, ask.id);
  const pieces = [...piecesOfAsk(bid, s, parts, ask.id)].sort(
    (x, y) => HOME[x.kind] - HOME[y.kind],
  );
  const holds =
    !!rule && (rule.neededAt ?? "bid") === "bid" && (ask.kind === "upload" || ask.kind === "enter");
  return {
    key: `ask:${ask.id}`,
    kind,
    title: ask.title,
    proof: proofOf(bid, ask),
    pieces,
    goes: pieces[0] ? pieceWords(parts, pieces[0]) : null,
    why: { text: ask.why, source: ask.source },
    holds,
    ask,
    rule,
  };
}

// ─── Check you can bid: the rules that get a bid rejected ───

export type MustState =
  | "meets"
  | "asking"
  | "grant-unsure"
  | "have"
  | "getting"
  | "planned"
  | "open"
  | "cant-meet";

export interface MustRow {
  rule: HardRequirement;
  state: MustState;
  /** One plain line under the rule. */
  line: string;
}

/** The asks behind a rule, visible ones only. */
function ruleAsks(bid: AvaBid, s: BidState, r: HardRequirement): Ask[] {
  const vis = new Set(visibleAsks(bid, s).map((a) => a.id));
  return [r.askId, ...(r.askIds ?? [])]
    .filter((x): x is string => !!x && vis.has(x))
    .map((id) => bid.asks.find((a) => a.id === id)!)
    .filter(Boolean);
}

/** True when the must-have phase has nothing left to ask about this rule. */
function mustSettled(bid: AvaBid, s: BidState, r: HardRequirement, state: RuleState): boolean {
  if (state === "cant-meet") return true;
  // An addendum changed the rule after she answered: it is asked again.
  if (ruleReopenedBy(bid, s, r)) return false;
  if (state === "meets") return true;
  if (s.mustHave[r.id]) return true;
  const asks = ruleAsks(bid, s, r);
  // A rule settled by a choice (the site visit): her answer settles it here.
  const choice = asks.find((a) => a.answer.type === "answer");
  if (choice) return !!s.answers[choice.id];
  // Any other rule: her answer on its ask settles it too.
  return asks.length > 0 && asks.every((a) => !!s.answers[a.id]);
}

/** The rules the buyer checks with the bid, each with where she stands. */
export function mustRows(bid: AvaBid, s: BidState, askingKey?: string | null): MustRow[] {
  const w = samWarning(bid, s);
  const samRule = samRuleOf(bid);
  const sam =
    w && samRule
      ? {
          rule: samRule,
          state: (w.kind === "told" ? "have" : "open") as MustState,
          line:
            w.kind === "told"
              ? "You told me it is active"
              : w.kind === "unknown"
                ? "I could not check when it ends"
                : w.kind === "before-due"
                  ? `${w.past ? "Ended" : "Ends"} on ${fullDate(w.ends)}, before your bid is due`
                  : `Ends on ${fullDate(w.ends)}, before the award`,
        }
      : null;
  return knockOutRules(bid, s).map(({ rule, state, evidence }) => {
    const said = s.mustHave[rule.id];
    const asks = ruleAsks(bid, s, rule);
    const copy = asks.find((a) => a.kind === "upload");
    const by = copy ? fullDate(decideBy(copy, bid)) : null;
    if (state === "cant-meet") return { rule, state: "cant-meet", line: "You cannot meet this" };
    if (sam && rule.id === sam.rule.id) return { rule, state: sam.state, line: sam.line };
    if (state === "meets") return { rule, state: "meets", line: evidence ?? "You have it" };
    const keys = [`must:${rule.id}`, ...asks.map((a) => `ask:${a.id}`)];
    if (askingKey && keys.includes(askingKey))
      return { rule, state: "asking", line: "Asking you now" };
    const reopened = ruleReopenedBy(bid, s, rule);
    if (reopened)
      return { rule, state: "open", line: `Addendum ${reopened.number} changed this rule` };
    if (said?.says === "getting")
      return { rule, state: "getting", line: by ? `Get it by ${by}` : "You are getting it" };
    if (said?.says === "have")
      return {
        rule,
        state: "have",
        line:
          copy && !askResolved(bid, s, copy.id)
            ? `You have it. A copy, by ${by}`
            : "You said you meet it",
      };
    if (mustSettled(bid, s, rule, state))
      return { rule, state: "planned", line: evidence ?? "You answered it" };
    if (rule.grantSays?.startsWith("Grant could not confirm"))
      return { rule, state: "grant-unsure", line: "Grant could not tell" };
    if (rule.grantSays?.startsWith("Grant found this missing"))
      return { rule, state: "open", line: "Grant found this missing" };
    return { rule, state: "open", line: "Not checked yet" };
  });
}

/** What the must-have phase still asks, in the rules' order. */
export function mustQueue(bid: AvaBid, s: BidState, parts: Part[]): Question[] {
  const out: Question[] = [];
  for (const { rule, state } of knockOutRules(bid, s)) {
    if (mustSettled(bid, s, rule, state)) continue;
    const asks = ruleAsks(bid, s, rule);
    // Changed by an addendum after she answered: one question, on the rule as
    // it reads now. Her new word settles it (store.sayMustHave).
    const reopened = ruleReopenedBy(bid, s, rule);
    if (reopened) {
      const first = asks[0];
      out.push({
        key: `must:${rule.id}`,
        kind: "must",
        title: rule.label,
        proof: "word",
        pieces: [],
        goes: null,
        why: { text: `Addendum ${reopened.number} changed this rule.`, source: rule.source },
        holds: false,
        ask: first,
        rule,
        changedBy: reopened.number,
      });
      continue;
    }
    const choice = asks.find((a) => a.answer.type === "answer" && !s.answers[a.id]);
    if (choice) {
      out.push({ ...askQuestion(bid, s, parts, choice, "must"), holds: false });
      continue;
    }
    const first = asks[0];
    const pieces = first
      ? [...piecesOfAsk(bid, s, parts, first.id)].sort((x, y) => HOME[x.kind] - HOME[y.kind])
      : [];
    out.push({
      key: `must:${rule.id}`,
      kind: "must",
      title: rule.label,
      proof: first ? proofOf(bid, first) : "word",
      pieces,
      goes: pieces[0] ? pieceWords(parts, pieces[0]) : null,
      why: {
        text: first?.why ?? `The ${buyerWord(bid)} rejects a bid that does not meet this rule.`,
        source: rule.source,
      },
      holds: false,
      ask: first,
      rule,
    });
  }
  return out;
}

// ─── Answer my questions ───

/** Every question she still has in phase 1, in the order Ava asks them:
 *  questions for the buyer (their deadline comes first), her answers, the
 *  promises, Ava's choices in the writing, her staffing plan, the costs that
 *  build her price, then her yes on the price. Left and forwarded ones are
 *  holes, not questions. */
export function answerQueue(bid: AvaBid, s: BidState, parts: Part[]): Question[] {
  const prices = priceAskIds(bid);
  const out: Question[] = [];
  const open = openBidAsks(bid, s).filter(
    (a) => askStatus(bid, s, a) === "open" && !laterFollowUp(bid, a),
  );

  // What Ava read from a scanned main file comes first: a misread due date or
  // price can lose the bid (PC-1, C-45).
  const scanned = open.filter((a) => a.id.startsWith(SCAN_ASK));
  for (const a of scanned) out.push(askQuestion(bid, s, parts, a));

  // A paper she said she is getting from someone else comes first: Ava
  // writes the email that gets it moving (2.2).
  const getting = open.filter((a) => {
    const r = ruleOfAsk(bid, a.id);
    return !!r && s.mustHave[r.id]?.says === "getting" && a.owner !== "you";
  });
  for (const a of getting) out.push(askQuestion(bid, s, parts, a));

  if (bid.submission.method === "typed-portal" && s.portalUnseen && s.portalShots.length === 0) {
    out.push({
      key: "portal",
      kind: "portal",
      title: "Show Ava the portal",
      proof: "copy",
      pieces: [],
      goes: null,
      why: {
        text: `The ${buyerWord(bid)}'s questions sit behind its portal login. I cannot read them from the files.`,
        source: bid.submission.source,
      },
      holds: false,
    });
  }

  for (const c of bid.clarifications) {
    const st = s.clarifications[c.id];
    if (st?.sentAt || st?.reply) continue;
    if (c.settledByAddendumId && s.addendaReceived.includes(c.settledByAddendumId)) continue;
    out.push({
      key: `clar:${c.id}`,
      kind: "clar",
      title: c.title,
      proof: "word",
      pieces: [],
      goes: null,
      why: c.passages[0] ? { text: c.checked, source: c.passages[0] } : null,
      holds: false,
      clar: c,
    });
  }

  const rest = open.filter((a) => !getting.includes(a) && !scanned.includes(a));
  for (const a of rest.filter((x) => !prices.has(x.id))) out.push(askQuestion(bid, s, parts, a));

  for (const c of bid.commitments) {
    const st = commitmentStatus(s, c);
    if (st !== "needs-approval" && st !== "reopened") continue;
    out.push({
      key: `promise:${c.id}`,
      kind: "promise",
      title: c.text,
      proof: "word",
      pieces: parts
        .flatMap((p) => p.pieces)
        .filter((pc) => pc.kind === "section")
        .slice(0, 1),
      goes: null,
      why: { text: c.pricedAs ?? "A promise you make if you win.", source: c.source },
      holds: false,
      commitment: c,
    });
  }

  for (const sec of bid.sections) {
    const spans = sectionParagraphs(s, sec).flat();
    for (const d of sec.decisions ?? []) {
      if (s.decisions[decisionKey(sec.id, d.id)]) continue;
      if (!spans.some((sp) => sp.decisionId === d.id)) continue;
      const pc = parts.flatMap((p) => p.pieces).find((x) => x.sectionId === sec.id);
      out.push({
        key: `decision:${decisionKey(sec.id, d.id)}`,
        kind: "decision",
        title: "A choice only you can make",
        proof: "choose",
        pieces: pc ? [pc] : [],
        goes: pc ? pieceWords(parts, pc) : null,
        why: {
          text: "The buyer's files allow either. Only you know which is true.",
          source: sec.answers,
        },
        holds: false,
        decision: { sectionId: sec.id, decision: d },
      });
    }
  }

  const price = bid.price;
  const pricePiece = parts.flatMap((p) => p.pieces).filter((pc) => pc.kind === "price");
  if (staffingOpen(bid, s)) {
    out.push({
      key: "staffing",
      kind: "staffing",
      title: "Your staffing plan",
      proof: "word",
      pieces: pricePiece,
      goes: pricePiece[0] ? pieceWords(parts, pricePiece[0]) : null,
      why: {
        text: "Nothing in the files says how many people, for how many hours. I build your price from it.",
        source: price!.contractTypeSource,
      },
      holds: false,
    });
  }

  for (const a of rest.filter((x) => prices.has(x.id))) out.push(askQuestion(bid, s, parts, a));

  // Until she approves her staffing plan there is no price (design 6.5).
  const total = approvalTotal(bid, s);
  const rateList = price && isRateList(bid) && rates(bid, s) !== null && !ratesApproved(bid, s);
  if (
    !staffingOpen(bid, s) &&
    (rateList ||
      (price &&
        total !== null &&
        (!s.priceApproval || Math.abs(s.priceApproval.total - total) > 0.005)))
  ) {
    out.push({
      key: "price",
      kind: "price",
      title: "Your price",
      proof: "word",
      pieces: pricePiece,
      goes: pricePiece[0] ? pieceWords(parts, pricePiece[0]) : null,
      why: {
        text: "I never put a price in your bid that you did not approve.",
        source: price!.contractTypeSource,
      },
      holds: true,
    });
  }
  return out;
}

// ─── Check for mistakes: Ava's checker, on her own ───

/** The sum of what she has told Ava, and of every word changed in her bid. A
 *  check that started on a different sum is out of date, and runs again: an
 *  edit by her or her mentor is checked like an answer (review panel, 7
 *  October 2026). Ava's own fixes are not part of it. A download made on a
 *  different sum is older than her bid. */
export function checkSig(s: BidState): string {
  const answers = Object.entries(s.answers)
    .map(
      ([k, a]) =>
        `${k}=${a.status}/${a.choiceId ?? ""}/${a.optionId ?? ""}/${JSON.stringify(a.values ?? {})}`,
    )
    .sort();
  const fixes = Object.keys(s.fixes)
    .filter((k) => !s.avaFixes[k])
    .sort();
  return JSON.stringify([
    answers,
    Object.keys(s.commitments).sort(),
    Object.keys(s.decisions).sort(),
    s.priceApproval?.total ?? null,
    Object.keys(s.left).sort(),
    Object.keys(s.mustHave).sort(),
    fixes,
    Object.keys(s.risks).sort(),
    Object.entries(s.edits)
      .map(([k, e]) => `${k}=${e.by}/${e.now}`)
      .sort(),
    [...s.addendaReceived].sort(),
    s.addendumUploads.map((u) => u.fileName),
  ]);
}

/** Taps that change no file she sends: she renewed her registration, she
 *  read an addendum herself, she will sign its acknowledgment, a rule she
 *  confirmed. They never make a download older than her bid. */
const NOT_IN_FILES = /^(sam-renewed$|upload-(read|ack|compared):|reconfirm:|demo:)/;

/** Her bid's files as they stand: everything that changes what she sends.
 *  A download records it, so a later change says "Download it again"
 *  (review panel, 7 October 2026). Risks she accepted are labels, never in
 *  the files, so they are not in it either. */
export function downloadSig(s: BidState): string {
  const answers = Object.entries(s.answers)
    .map(
      ([k, a]) =>
        `${k}=${a.status}/${a.choiceId ?? ""}/${a.optionId ?? ""}/${a.fileName ?? ""}/${JSON.stringify(a.values ?? {})}`,
    )
    .sort();
  return JSON.stringify([
    answers,
    Object.keys(s.commitments).sort(),
    Object.entries(s.decisions)
      .map(([k, d]) => `${k}=${d.pick}/${d.text ?? ""}`)
      .sort(),
    s.priceApproval?.total ?? null,
    Object.keys(s.left).sort(),
    Object.keys(s.fixes)
      .filter((k) => !NOT_IN_FILES.test(k))
      .sort(),
    Object.entries(s.edits)
      .map(([k, e]) => `${k}=${e.by}/${e.now}`)
      .sort(),
    [...s.addendaReceived].sort(),
    s.addendumUploads.map((u) => u.fileName),
  ]);
}

/** Her last download of the whole bid. A download of one part is not her
 *  bid: it never counts as "downloaded" (review panel, 7 October 2026). */
export function lastWholeDownload(s: BidState): BidState["downloads"][number] | null {
  return [...s.downloads].reverse().find((d) => d.whole !== false) ?? null;
}

/** Her last download of the whole bid was made before her bid last changed:
 *  "Download it again". Null when she has not downloaded it. */
export function downloadStale(s: BidState): boolean | null {
  const last = lastWholeDownload(s);
  if (!last) return null;
  return last.sig !== undefined && last.sig !== downloadSig(s);
}

export { riskAllowed };

/** Findings Ava fixes herself: the page limit, her legal name, a missing
 *  addendum form. Everything else is hers, or her price. */
const AVA_FIXES = /^(pages:|ack:|name-sam$)/;

/** Findings that are already a question, a hole, or not hers to see. The
 *  review list is out: Ava fixes what she can, and asks about the rest
 *  (Shyam, 7 October 2026). */
const NOT_A_CHECK_QUESTION =
  /^(req:|gaps$|late:|clar:|price-approval$|price-incomplete$|commitments$|review:|upload:|upload-ack:|no-price$|file:)/;

export interface CheckLine {
  id: string;
  label: string;
  result: string;
  tone: "ok" | "fixed" | "you" | "hold";
}

/** The fixes Ava will make when the check finishes, with their plain line. */
export function checkFixes(bid: AvaBid, s: BidState): { key: string; text: string }[] {
  const { findings } = exactChecks(bid, s);
  const out: { key: string; text: string }[] = [];
  for (const f of findings) {
    if (!f.fix || !AVA_FIXES.test(f.fix.key) || s.fixes[f.fix.key]) continue;
    if (f.fix.key.startsWith("pages:")) {
      const sec = bid.sections.find((x) => `pages:${x.id}` === f.fix!.key);
      out.push({
        key: f.fix.key,
        text: sec
          ? `${sec.title} was ${sec.pages} pages; the limit is ${sec.pageLimit}. I shortened it.`
          : f.title,
      });
    } else if (f.fix.key === "name-sam") {
      out.push({
        key: f.fix.key,
        text: `I used your legal name, ${bid.samLegalName}, everywhere.`,
      });
    } else {
      const a = bid.addenda.find((x) => f.fix!.key === `ack:${x.id}`);
      out.push({
        key: f.fix.key,
        text: a ? `I added the form for Addendum ${a.number}.` : f.title,
      });
    }
  }
  return out;
}

/** What the check found that only she can answer: one more question each.
 *  `withLeft` keeps the ones she left open, for the holes. */
export function checkQuestions(bid: AvaBid, s: BidState, withLeft = false): Question[] {
  const { findings } = exactChecks(bid, s);
  return findings
    .filter(
      (f) =>
        f.severity !== "minor" &&
        !NOT_A_CHECK_QUESTION.test(f.id) &&
        !(f.fix && AVA_FIXES.test(f.fix.key)) &&
        findingState(bid, s, f) === "open" &&
        (withLeft || !s.left[`fix:${f.id}`]),
    )
    .map((f) => ({
      key: `fix:${f.id}`,
      kind: "fix" as const,
      title: f.title,
      proof: "word" as const,
      pieces: [],
      goes: null,
      why: null,
      holds: f.severity === "critical",
      finding: f,
    }));
}

/** The checks as Ava runs them, each with what it found: the ticks the
 *  check shows while it runs, and the fixes she made by herself. */
export function checkLines(bid: AvaBid, s: BidState): CheckLine[] {
  const w = buyerWord(bid);
  const out: CheckLine[] = [];
  // The rows she sees, so the check and the checklist agree (her federal
  // registration follows its warning).
  const rules = mustRows(bid, s);
  if (rules.length > 0) {
    const met = rules.filter((r) => r.state === "meets").length;
    const open = rules.filter((r) => r.state !== "meets");
    out.push({
      id: "rules",
      label: `The ${count(rules.length, "rule")} that can get a bid rejected`,
      result:
        open.length === 0
          ? "All met."
          : `${met} met. Still to finish: ${open.map((r) => lowerFirst(r.rule.label)).join("; ")}.`,
      tone: open.length === 0 ? "ok" : "you",
    });
  }
  const fc = fillCount(complianceItems(bid, s));
  const open = fc.total - fc.filled;
  out.push({
    id: "asks",
    label: `Everything the ${w} asks for`,
    result:
      open === 0
        ? `${fc.total} of ${fc.total} are in your bid.`
        : `${fc.filled} of ${fc.total} are in your bid. ${count(open, "is", "are")} left for you.`,
    tone: open === 0 ? "ok" : "you",
  });
  const made = { ...s.avaFixes };
  for (const f of checkFixes(bid, s)) made[f.key] = { text: f.text, at: "" };
  const pageFixes = Object.entries(made).filter(([k]) => k.startsWith("pages:"));
  if (bid.sections.some((x) => x.pageLimit)) {
    out.push({
      id: "pages",
      label: "Page limits",
      result:
        pageFixes.length > 0
          ? pageFixes.map(([, v]) => v.text).join(" ")
          : "Every part is within its limit.",
      tone: pageFixes.length > 0 ? "fixed" : "ok",
    });
  }
  out.push({
    id: "name",
    label: "Your company name",
    result: made["name-sam"]?.text ?? "It is the same everywhere.",
    tone: made["name-sam"] ? "fixed" : "ok",
  });
  if (findOpportunity(bid.noticeId)?.scope === "fed" && bid.kind !== "reply") {
    const sam = samWarning(bid, s);
    out.push({
      id: "sam",
      label: "Your registration to sell to the government",
      result: sam
        ? `${samWords(bid, sam).title}.`
        : "It is active while your price must stay open.",
      tone: sam ? "you" : "ok",
    });
  }
  const acks = Object.entries(made).filter(([k]) => k.startsWith("ack:"));
  // Addenda she added count too: each needs her acknowledgment, which Ava
  // cannot add for her (review panel, round 2).
  const added = s.addendumUploads.filter((_, i) => !s.fixes[`upload-ack:${i}`]);
  if (bid.addenda.length > 0 || s.addendumUploads.length > 0) {
    const mine = added.map((u) => `${u.fileName} needs your acknowledgment.`);
    out.push({
      id: "addenda",
      label: "An acknowledgment for every addendum",
      result: [
        ...(acks.length > 0 ? acks.map(([, v]) => v.text) : []),
        ...mine,
        ...(acks.length === 0 && mine.length === 0 ? ["Every addendum has its form."] : []),
      ].join(" "),
      tone: mine.length > 0 ? "you" : acks.length > 0 ? "fixed" : "ok",
    });
  }
  if (bid.price) {
    const qs = checkQuestions(bid, s).filter((q) => q.finding?.view === "price");
    // No line says the price is complete while there is no price.
    const missing = missingPriceAsks(bid, s)
      .map((id) => bid.asks.find((a) => a.id === id)?.title)
      .filter((x): x is string => !!x);
    out.push({
      id: "price",
      label: `Prices on the ${w}'s sheet`,
      result: staffingOpen(bid, s)
        ? "No price yet: it waits on your staffing plan."
        : missing.length > 0
          ? `No price yet: it waits on ${lowerFirst(missing[0])}.`
          : qs.length > 0
            ? `${count(qs.length, "thing")} to ask you.`
            : "Every line has a price, and the totals add up.",
      tone: staffingOpen(bid, s) || missing.length > 0 || qs.length > 0 ? "you" : "ok",
    });
  }
  const sign = bid.forms.filter(
    (f) => f.handling.includes("you-sign") || f.handling.includes("notary"),
  );
  if (sign.length > 0) {
    const notary = bid.forms.filter((f) => f.handling.includes("notary")).length;
    out.push({
      id: "sign",
      label: "Where you sign, and what needs a notary",
      result: `You sign ${count(sign.length, "form")} at the end.${notary > 0 ? ` ${count(notary, "needs", "need")} a notary.` : ""}`,
      tone: "ok",
    });
  }
  return out;
}

/** What Ava did not check, for her to check herself before she sends (PRD
 *  D39): every check when Ava could not finish, a buyer's file she could not
 *  read, and a rule she left open that has no paper behind it. */
export function selfChecks(bid: AvaBid, s: BidState): string[] {
  const out: string[] = [];
  if (s.check?.failed)
    for (const l of checkLines(bid, s)) out.push(`${l.label}: I did not finish checking it.`);
  for (const f of exactChecks(bid, s).findings) {
    if (!f.id.startsWith("file:")) continue;
    const file = bid.files.find((x) => `file:${x.id}` === f.id);
    out.push(`I have not checked your bid against ${file?.name ?? "one of the buyer's files"}.`);
  }
  // A rule she left open, by either of its questions, while it is not met.
  const rows = new Map(knockOutRules(bid, s).map((k) => [k.rule.id, k.state]));
  for (const r of bid.hardRequirements) {
    const keys = [`must:${r.id}`, ...ruleAsks(bid, s, r).map((a) => `ask:${a.id}`)];
    if (!keys.some((k) => s.left[k]) || rows.get(r.id) === "meets") continue;
    out.push(
      `${r.label}: I did not check this rule. Read ${r.source.short} and check it yourself.`,
    );
  }
  // An addendum she added that Ava has not compared, even if she read it.
  s.addendumUploads.forEach((u, i) => {
    if (!s.fixes[`upload-compared:${i}`])
      out.push(`I have not compared ${u.fileName} with your bid. Read it before you send.`);
  });
  return out;
}

/** How long each simulated step of Ava's work lasts on screen. The prototype
 *  calls no model, so reading and checking are paced to be watched.
 *  DEMO: a little faster than the prototype for a sales call, and zero in fast
 *  mode (tests and the crawl; see demo/ava/pace.ts). */
export const READ_FILE_MS = wait(900);
export const CHECK_LINE_MS = wait(800);

// ─── Reading the buyer's files ───

export interface FileRead {
  file: BidFile;
  state: "done" | "now" | "next" | "locked";
  /** What Ava found in it, in plain words, once read. */
  found: string | null;
}

/** The files as Ava reads them, ticking off one by one. */
export function filesRead(bid: AvaBid, s: BidState, now: number): FileRead[] {
  const files = bid.files.filter((f) => !f.supersededBy);
  const done = s.read?.doneAt
    ? files.length
    : s.read
      ? READ_FILE_MS > 0
        ? Math.floor((now - s.read.startedAt) / READ_FILE_MS)
        : files.length
      : 0;
  const items = complianceItems(bid, s);
  const rules = knockOutRules(bid, s).length;
  return files.map((file, i) => {
    const locked = !readable(file);
    const state = i < done ? (locked ? "locked" : "done") : i === done ? "now" : "next";
    // A scan is read from a picture of each page, and says so (PC-1).
    const scan =
      file.readability === "scan" ? "A scan: I read it from a picture of each page. " : "";
    let found: string | null = null;
    if (locked) found = file.note ?? "I could not read it. I will ask you for it.";
    else if (file.role === "main")
      found = `${scan}Found ${items.length} things the ${buyerWord(bid)} asks for, and ${count(rules, "rule")} that can get a bid rejected.`;
    else if (scan) found = file.note ?? scan.trim();
    else if (file.role === "price-form" && bid.price)
      found = `${count(bid.price.lines.length, "line")} to price.`;
    else if (file.role === "form") found = `${count(bid.forms.length, "form")} to fill.`;
    else if (file.role === "addendum") {
      const a = bid.addenda.find((x) => x.id === file.addendumId);
      if (a) found = `${count(a.changes.length, "change")}.`;
    }
    return { file, state: locked && i < done ? "locked" : state, found };
  });
}

/** "3 min", "40 sec": how long Ava's work took, from her own clock. */
export function tookWords(ms: number): string {
  const sec = Math.max(1, Math.round(ms / 1000));
  if (sec < 60) return `${sec} sec`;
  return `${Math.round(sec / 60)} min`;
}

// ─── Where the bid stands ───

export type StageId =
  /** Ava cannot start: no files, no main file, or a main file she cannot read. */
  | "stopped"
  | "mentor-no"
  | "reading"
  | "must"
  | "paused"
  | "answer"
  | "checking"
  | "found"
  | "ready"
  | "read";

export type StopKind = "no-files" | "no-main" | "unreadable";

/** Why Ava cannot start reading, if she cannot (Part 7). */
export function stopOf(bid: AvaBid): StopKind | null {
  const files = bid.files.filter((f) => !f.supersededBy);
  if (files.length === 0) return "no-files";
  const main = files.find((f) => f.role === "main");
  if (!main) return "no-main";
  // A scan is read, never a stop (PRD TD-03, PC-1); only words that come out
  // jumbled stop the build.
  if (main.readability === "garbled") return "unreadable";
  return null;
}

export interface Flow {
  stage: StageId;
  /** Set when the stage is "stopped". */
  stop?: StopKind;
  /** 1 or 2. */
  phase: 1 | 2;
  parts: Part[];
  /** What Ava asks about in this stage, in order. */
  queue: Question[];
  /** The question shown now: a tapped hole, else the first one. */
  current: Question | null;
  /** Things left open: by her choice, or waiting on someone she wrote to. */
  holes: Question[];
  /** What holds the download, in order. Empty: she can download. */
  holds: Hold[];
  must: MustRow[];
  /** The check is up to date with her answers and every edit. */
  checked: boolean;
}

/** What a hold is, which decides its ways out. */
export type HoldKind =
  | "paused"
  /** A rule that rejects the bid: a copy, a typed fact, a deposit, a wage floor. */
  | "rule"
  | "price"
  | "promise"
  /** An addendum she added that Ava has not compared, or one not acknowledged. */
  | "addendum"
  /** Phase 2: something changed after she started reading and needs her answer. */
  | "reopened"
  /** Phase 2: Ava is checking her changes. */
  | "checking"
  /** Anything else the check calls critical. The only kind she may take at risk. */
  | "risky";

export interface Hold {
  key: string;
  kind: HoldKind;
  /** "No download yet: your insurance certificate is not in your bid." */
  text: string;
  /** She may go ahead at risk. Never on a rule that rejects the bid, her
   *  price, her promises or an addendum (PRD R11). */
  canRisk: boolean;
  finding?: Finding;
  question?: Question;
}

/** Every question of the bid, open or left, phase 1 order. */
function allQuestions(bid: AvaBid, s: BidState, parts: Part[]): Question[] {
  return [...mustQueue(bid, s, parts), ...answerQueue(bid, s, parts)];
}

/** The holes: what she left, and what waits on someone she wrote to. */
export function holesOf(bid: AvaBid, s: BidState, parts: Part[]): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  for (const q of allQuestions(bid, s, parts)) {
    // A question to the buyer she skipped because the bid is safe either way
    // leaves nothing open in her bid.
    if (q.kind === "clar" && q.clar?.kind === "simple-limit") continue;
    if (s.left[q.key] && !seen.has(q.key)) {
      out.push(q);
      seen.add(q.key);
    }
  }
  for (const a of openBidAsks(bid, s)) {
    const key = `ask:${a.id}`;
    if (seen.has(key)) continue;
    if (askStatus(bid, s, a) === "forwarded") out.push(askQuestion(bid, s, parts, a));
  }
  for (const q of checkQuestions(bid, s, true))
    if (s.left[q.key] && !seen.has(q.key)) {
      out.push(q);
      seen.add(q.key);
    }
  return out;
}

/** The questions still open after she started reading: anything an addendum,
 *  a mentor's change or a date reopened (review panel, 7 October 2026). Phase 2
 *  asks them in its own chat; none of them is ever skipped. */
export function reopenedQueue(
  bid: AvaBid,
  s: BidState,
  parts: Part[],
  checked: boolean,
): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  const qs = [...mustQueue(bid, s, parts), ...answerQueue(bid, s, parts)];
  if (checked && !s.check?.failed) qs.push(...checkQuestions(bid, s));
  for (const q of qs) {
    if (s.left[q.key] || seen.has(q.key)) continue;
    seen.add(q.key);
    out.push(q);
  }
  return out;
}

/** What holds the download, from what each thing is: a rule that rejects the
 *  bid, her price, her promises, an addendum, and in phase 2 anything
 *  reopened or a check still running on her changes. Only "risky" holds may
 *  go ahead at risk. */
export function holdsOf(bid: AvaBid, s: BidState, parts: Part[]): Hold[] {
  const out: Hold[] = [];
  if (bidDecision(bid, s)) {
    out.push({
      key: "paused",
      kind: "paused",
      text: "No download yet: this bid is paused.",
      canRisk: false,
    });
    return out;
  }
  const seen = new Set<string>();
  // A copy or a typed fact a rule needs, not in the bid yet.
  for (const r of bid.hardRequirements) {
    if ((r.neededAt ?? "bid") !== "bid") continue;
    for (const a of ruleAsks(bid, s, r)) {
      if (a.kind !== "upload" && a.kind !== "enter") continue;
      // A step toward the paper is not the paper: a quote for coverage is not
      // the certificate (review panel, 7 October 2026; DontHaveOption.satisfies).
      const ans = s.answers[a.id];
      const step =
        ans?.status === "dont-have" && !a.dontHave?.find((o) => o.id === ans.optionId)?.satisfies;
      if (askResolved(bid, s, a.id) && !step) continue;
      out.push({
        key: `req:${r.id}`,
        kind: "rule",
        text: `No download yet: ${lowerFirst(a.title)} is not in your bid.`,
        canRisk: false,
        question: askQuestion(bid, s, parts, a),
      });
      seen.add(`req:${r.id}`);
      break;
    }
  }

  const found = blockingFindings(bid, s);
  const byId = (re: RegExp) => found.find((f) => re.test(f.id));

  // Her price. There is no price until she approves her staffing plan, and no
  // price goes out that she did not approve (PRD §5.3).
  if (bid.price) {
    const queue = answerQueue(bid, s, parts);
    const priceQ = queue.find((q) => q.kind === "price");
    const incomplete = byId(/^price-incomplete$/);
    const approval = byId(/^price-approval$/);
    if (staffingOpen(bid, s)) {
      out.push({
        key: "price",
        kind: "price",
        text: "No download yet: your price waits on your staffing plan.",
        canRisk: false,
        question:
          queue.find((q) => q.kind === "staffing") ??
          holesOf(bid, s, parts).find((q) => q.kind === "staffing"),
      });
    } else if (incomplete) {
      const missing = missingPriceAsks(bid, s)
        .map((id) => bid.asks.find((a) => a.id === id))
        .filter((a): a is Ask => !!a);
      const first = missing[0];
      out.push({
        key: "price",
        kind: "price",
        text:
          incomplete.severity === "critical"
            ? "No download yet: your price sheet cannot be totaled."
            : first
              ? `No download yet: your price waits on ${lowerFirst(first.title)}.`
              : "No download yet: your price sheet is not complete.",
        canRisk: false,
        finding: incomplete,
        question: first ? askQuestion(bid, s, parts, first) : undefined,
      });
    } else if (approval) {
      out.push({
        key: "price",
        kind: "price",
        text: s.priceApproval
          ? "No download yet: your price changed since you approved it."
          : "No download yet: you have not approved your price.",
        canRisk: false,
        finding: approval,
        question: priceQ,
      });
    }
  }

  // Her promises: none goes out that she did not approve.
  const promises = byId(/^commitments$/);
  if (promises) {
    const first = answerQueue(bid, s, parts).find((q) => q.kind === "promise");
    out.push({
      key: "commitments",
      kind: "promise",
      text: `No download yet: ${promises.title.replace(/ needs? your approval$/, "")} ${/^1 /.test(promises.title) ? "needs" : "need"} your yes.`,
      canRisk: false,
      finding: promises,
      question: first,
    });
  }

  // Everything else the check calls critical. A short deposit is one fact:
  // its own finding stands for the bid-bond rule too.
  const bondRule = bid.hardRequirements.find(
    (r) => !!bid.bidSecurity && r.askId === bid.bidSecurity.bondAskId,
  );
  if (bondRule && found.some((f) => f.id === "security-amount")) seen.add(`req:${bondRule.id}`);
  for (const f of found) {
    if (f.severity !== "critical" || f.kind !== "exact") continue;
    if (/^(gaps$|price-incomplete$|price-approval$|commitments$)/.test(f.id)) continue;
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    const fixQ = checkQuestions(bid, s, true).find((q) => q.key === `fix:${f.id}`);
    out.push({
      key: f.id,
      kind: /^(ack:|upload:|upload-ack:)/.test(f.id)
        ? "addendum"
        : riskAllowed(f)
          ? "risky"
          : "rule",
      text: `No download yet: ${lowerFirst(f.title)}.`.replace(/\.\.$/, "."),
      canRisk: riskAllowed(f),
      finding: f,
      question: fixQ,
    });
  }

  // Phase 2: anything reopened since she started reading, then the check of
  // her changes. Questions already behind a hold above are not counted twice.
  if (s.readOpened) {
    const checked = !!s.check?.doneAt && s.check.sig === checkSig(s);
    const behind = new Set(out.flatMap((h) => (h.question ? [h.question.key] : [])));
    const reopened = reopenedQueue(bid, s, parts, checked).filter(
      (q) =>
        !behind.has(q.key) && q.kind !== "price" && q.kind !== "staffing" && q.kind !== "promise",
    );
    if (reopened.length > 0)
      out.push({
        key: "reopened",
        kind: "reopened",
        text: `No download yet: ${count(reopened.length, "thing")} changed and ${reopened.length === 1 ? "needs" : "need"} your answer.`,
        canRisk: false,
        question: reopened[0],
      });
    // The check runs whenever it is out of date, whatever else holds: a
    // finding only the check clears (an addendum's form) must never wait
    // behind another hold (review panel, 7 October 2026).
    else if (!checked)
      out.push({
        key: "checking",
        kind: "checking",
        text: "No download yet: I am checking your changes.",
        canRisk: false,
      });
  }
  return out;
}

/** Her SAM.gov registration, checked through the window in which the buyer
 *  can still award: the due date plus how long her price must stay open
 *  (KNOWLEDGE D-C8; PRD §5.3). Federal bids only.
 *
 *  A warning, never a hold (review panel, 7 October 2026): FAR 52.204-7(b)(1)
 *  wants her registered when she sends her offer and on until award, so she
 *  can send now and renew before it ends. An expiry Ava does not know, or a
 *  window the files do not state, is said plainly, never passed in silence. */
export type SamWarning =
  /** It ends (or ended) before the due date: renew it before she sends. */
  | { kind: "before-due"; ends: Date; until: Date | null; past: boolean }
  /** It ends after the due date but while her price must stay open. */
  | { kind: "before-award"; ends: Date; until: Date }
  /** Ava does not know when it ends. */
  | { kind: "unknown"; until: Date | null }
  /** She told Ava she renewed it, or checked it. Ava cannot see the new date
   *  yet: her tap is her word, never evidence (review panel, round 2). */
  | { kind: "told"; until: Date | null };

export function samWarning(bid: AvaBid, s: BidState): SamWarning | null {
  if (findOpportunity(bid.noticeId)?.scope !== "fed") return null;
  // An answer to a request for information is not an offer.
  if (bid.kind === "reply") return null;
  const days = Number(bid.overview?.validity?.text.match(/(\d+)\s+days/)?.[1]);
  const due = dayFromNow(bid.deadline.dueDaysFromNow);
  const until = Number.isFinite(days) ? new Date(due.getTime() + days * 86_400_000) : null;
  if (s.fixes[SAM_RENEWED_KEY]) return { kind: "told", until };
  const expiry: string | null = PERSONA.samActiveUntil;
  const ends = s.fixes[DEMO.samEnds]
    ? new Date(due.getTime() + 20 * 86_400_000)
    : expiry
      ? new Date(`${expiry}T00:00:00Z`)
      : null;
  if (!ends) return { kind: "unknown", until };
  if (ends.getTime() < due.getTime())
    return { kind: "before-due", ends, until, past: ends.getTime() < today().getTime() };
  if (until && ends.getTime() < until.getTime()) return { kind: "before-award", ends, until };
  return null;
}

/** The warning in her words, plain sentence first and the government's term
 *  under it (the acronym rule). */
export function samWords(
  bid: AvaBid,
  w: SamWarning,
): { title: string; text: string; term: string } {
  const who = buyerWord(bid);
  const term = "SAM.gov registration";
  const reg = "registration to sell to the government";
  const open = (until: Date | null) =>
    until
      ? `, and until ${fullDate(until)}, while your price must stay open`
      : ", and until the award";
  if (w.kind === "unknown")
    return {
      title: `I could not check when your ${reg} ends`,
      text: `It must be active when you send your bid${open(w.until)}. Check the date on SAM.gov.`,
      term,
    };
  if (w.kind === "told")
    return {
      title: `You told me your ${reg} is active`,
      text: `I cannot see its new date yet. Check on SAM.gov that it lasts${w.until ? ` until ${fullDate(w.until)}` : " until the award"}.`,
      term,
    };
  if (w.kind === "before-due")
    return {
      title: `Your ${reg} ${w.past ? "ended" : "ends"} on ${fullDate(w.ends)}`,
      text: "It must be active when you send your bid. Renew it on SAM.gov before you send.",
      term,
    };
  return {
    title: `Your ${reg} ends on ${fullDate(w.ends)}`,
    text: `Your price must stay open until ${fullDate(w.until)}, and the ${who} may award until then. You can send your bid now. Renew it on SAM.gov before ${fullDate(w.ends)}.`,
    term,
  };
}

/** The rule for her federal registration, if the bid has one. It follows the
 *  warning: never "met" while the warning stands (review panel, round 2). */
export function samRuleOf(bid: AvaBid): HardRequirement | undefined {
  return bid.hardRequirements.find(
    (r) => r.grantRow === "gm-sam" || /federal registration/i.test(r.label),
  );
}

/** She renewed her registration on SAM.gov and told Ava. */
export const SAM_RENEWED_KEY = "sam-renewed";

function lowerFirst(t: string): string {
  // Keep a name or an acronym as it is: "Form 3", "SF 1449", "Exhibit D", "Ava".
  // A file name keeps its spelling: "Addendum_3.pdf".
  if (/^\S+\.[a-z0-9]{2,4}\b/i.test(t) || /^\S*_/.test(t)) return t;
  return /^(A |[A-Z][a-z])/.test(t) && !/^(Form|Exhibit|Addendum|Ava|Grant|Pastor)\b/.test(t)
    ? t.charAt(0).toLowerCase() + t.slice(1)
    : t;
}

/** Where the bid stands, from the files and her state. `now` is the device
 *  clock, for Ava's simulated reading and checking. */
export function flowOf(
  bid: AvaBid,
  s: BidState,
  opts: { now: number; focus?: string | null; mentorNo?: boolean },
): Flow {
  const parts = packageParts(bid);
  const holes = holesOf(bid, s, parts);
  const holds = holdsOf(bid, s, parts);
  const base = { parts, holes, holds };
  const checked = !!s.check?.doneAt && s.check.sig === checkSig(s);
  const pick = (queue: Question[]) => queue.find((q) => q.key === opts.focus) ?? queue[0] ?? null;

  const stop = stopOf(bid);
  if (stop)
    return {
      ...base,
      stage: "stopped",
      stop,
      phase: 1,
      queue: [],
      current: null,
      must: [],
      checked,
    };

  if (opts.mentorNo && !s.overMentor && !s.read)
    return { ...base, stage: "mentor-no", phase: 1, queue: [], current: null, must: [], checked };

  const readDone = !!s.read?.doneAt;
  if (!readDone)
    return {
      ...base,
      stage: "reading",
      phase: 1,
      queue: [],
      current: null,
      must: mustRows(bid, s),
      checked,
    };

  if (bidDecision(bid, s))
    return {
      ...base,
      stage: "paused",
      phase: 1,
      queue: [],
      current: null,
      must: mustRows(bid, s),
      checked,
    };

  // Phase 2 is not the end of the questions: anything reopened after she
  // started reading is asked in its chat (design 8.4, "Back to you").
  if (s.readOpened) {
    const queue = reopenedQueue(bid, s, parts, checked);
    const all = [...queue, ...holes, ...holds.flatMap((h) => (h.question ? [h.question] : []))];
    const tapped = opts.focus ? (all.find((q) => q.key === opts.focus) ?? null) : null;
    return {
      ...base,
      stage: "read",
      phase: 2,
      queue,
      current: tapped ?? queue[0] ?? null,
      must: mustRows(bid, s),
      checked,
    };
  }

  const mq = mustQueue(bid, s, parts).filter((q) => !s.left[q.key]);
  if (mq.length > 0) {
    const current = pick(mq);
    return {
      ...base,
      stage: "must",
      phase: 1,
      queue: mq,
      current,
      must: mustRows(bid, s, current?.key),
      checked,
    };
  }

  const aq = answerQueue(bid, s, parts).filter((q) => !s.left[q.key]);
  // A hole she tapped is asked even when she left it.
  const tapped = opts.focus
    ? (holes.find((h) => h.key === opts.focus) ?? aq.find((q) => q.key === opts.focus))
    : null;
  if (aq.length > 0 || (tapped && !checked)) {
    const queue = tapped && !aq.includes(tapped) ? [tapped, ...aq] : aq;
    return {
      ...base,
      stage: "answer",
      phase: 1,
      queue,
      current: tapped ?? pick(queue),
      must: mustRows(bid, s),
      checked,
    };
  }

  if (!checked)
    return {
      ...base,
      stage: "checking",
      phase: 1,
      queue: [],
      current: null,
      must: mustRows(bid, s),
      checked,
    };

  // A check that could not finish asks nothing: what it did not check goes to
  // How to send it, for her to check herself (PRD D39).
  const fq = s.check?.failed ? [] : checkQuestions(bid, s);
  if (fq.length > 0 || tapped)
    return {
      ...base,
      stage: "found",
      phase: 1,
      queue: fq,
      current: tapped ?? pick(fq),
      must: mustRows(bid, s),
      checked,
    };

  return {
    ...base,
    stage: "ready",
    phase: 2,
    queue: [],
    current: null,
    must: mustRows(bid, s),
    checked,
  };
}

// ─── The six steps ───

export type StepState = "done" | "now" | "wait" | "paused" | "next" | "opt" | "human";

export interface Step {
  id: "read" | "required" | "answer" | "review" | "mentor" | "complete";
  label: string;
  state: StepState;
  /** Unused by the six steps: no words under a step (Shyam, 7 October 2026). */
  sub?: string;
}

export interface MentorStatus {
  name: string;
  status: "pending" | "responded" | "closed";
}

/** The six steps, kept simple (Shyam, 7 October 2026): no words under any
 *  step, one blue mark where she is, and a step never goes back once it is
 *  ticked. Anything that reopens is asked in the chat; the bar does not move
 *  her backwards. The mentor review is optional: a dashed mark when she does
 *  not use it. "Bid complete" ticks when she has downloaded her bid as it
 *  stands now. */
export function stepsOf(bid: AvaBid, s: BidState, f: Flow, mentor: MentorStatus | null): Step[] {
  const st = f.stage;
  const steps: Step[] = [
    { id: "read", label: "Reading documents", state: "next" },
    { id: "required", label: "Required details", state: "next" },
    { id: "answer", label: "Answer Ava's questions", state: "next" },
    { id: "review", label: "Review bid", state: "next" },
    { id: "mentor", label: "Mentor review", state: "opt" },
    { id: "complete", label: "Bid complete", state: "next" },
  ];
  const [read, required, answer, review, mentorStep, complete] = steps;
  const here = (step: Step) => {
    for (const x of steps) {
      if (x === step) break;
      if (x.state === "next") x.state = "done";
    }
    step.state = "wait";
  };

  if (st === "stopped" || st === "mentor-no" || st === "reading") here(read);
  else if (st === "must" || st === "paused") here(required);
  else if (st === "answer" || st === "checking" || st === "found") here(answer);
  else if (st === "ready") here(review);
  else {
    // Phase 2: she has the whole bid.
    const sent = !!mentor;
    const downloaded =
      (!!lastWholeDownload(s) && !downloadStale(s) && f.holds.length === 0) || !!s.sentAt;
    const reviewed = sent || !!lastWholeDownload(s);
    if (mentor?.status === "pending") here(mentorStep);
    else if (downloaded) {
      here(complete);
      complete.state = "done";
    } else if (reviewed) here(complete);
    else here(review);
    // A review that came back is ticked; one she did not ask for keeps its
    // dashed mark.
    if (sent && mentor?.status !== "pending") mentorStep.state = "done";
  }
  // After the deadline nothing waits on her: what is left is closed.
  if (daysLeft(bid) < 0 && st !== "stopped")
    for (const step of [review, mentorStep, complete])
      if (step.state !== "done") step.state = "paused";
  return steps;
}

// ─── The header: what Ava is doing now ───

export interface Headline {
  /** One sentence: what Ava is doing now. */
  s: string;
  /** A short line under it. */
  sub: string;
  /** "Needs you: <what>", when something needs her. */
  needs: string | null;
  /** The portrait: working, waiting still, or done. */
  av: "live" | "still" | "done";
}

/** "3 papers, 1 choice, 2 answers": what the open questions are, by kind. */
export function needsWords(qs: Question[]): string | null {
  if (qs.length === 0) return null;
  if (qs.length === 1) {
    const q = qs[0];
    if (q.kind === "price") return "approve your price";
    if (q.kind === "staffing") return "your staffing plan";
    if (q.kind === "decision") return "1 choice";
    if (q.kind === "promise") return "1 promise";
    if (q.kind === "fix") return "1 question";
    if (q.kind === "clar") return "a question for the buyer";
    return q.title.length > 48
      ? q.proof === "copy"
        ? "1 paper"
        : "1 answer"
      : lowerFirst(q.title);
  }
  // Every question falls in exactly one group, so the words add up to the
  // count beside them (one fact, one owner: D-E4).
  const group = (q: Question): number => {
    if (q.kind === "price") return 6;
    if (q.proof === "copy") return 0;
    if (q.proof === "choose" || q.kind === "decision") return 1;
    if (q.proof === "type") return 3;
    if (q.proof === "there") return 4;
    if (q.proof === "later") return 5;
    return 2;
  };
  const names: [string, string][] = [
    ["paper", "papers"],
    ["choice", "choices"],
    ["yes or no", "yes or no"],
    ["typed answer", "typed answers"],
    ["visit", "visits"],
    ["thing for later", "things for later"],
    ["your price", "your price"],
  ];
  const counts = names.map((_, i) => qs.filter((q) => group(q) === i).length);
  const words = counts.flatMap((n, i) =>
    n === 0 ? [] : [i === 6 ? "your price" : `${n} ${n === 1 ? names[i][0] : names[i][1]}`],
  );
  if (words.length <= 3) return words.join(", ");
  const shown = counts.flatMap((n, i) => (n === 0 ? [] : [i])).slice(0, 2);
  const rest = qs.filter((q) => !shown.includes(group(q))).length;
  return `${words.slice(0, 2).join(", ")} and ${rest} more`;
}

export function headlineOf(
  bid: AvaBid,
  s: BidState,
  f: Flow,
  opts: { mentor: MentorStatus | null; mentorName: string; pending: boolean; late?: boolean },
): Headline {
  const w = buyerWord(bid);
  const files = bid.files.filter((x) => !x.supersededBy).length;
  // A reply to a sources sought is not a bid (5.7).
  const noun = bid.kind === "reply" ? "reply" : "bid";
  switch (f.stage) {
    case "stopped": {
      const main = bid.files.find((x) => x.role === "main");
      if (f.stop === "no-files")
        return {
          s: "This notice came with no files.",
          sub: "The buyer posted no files and no notice text. Check the notice on SAM.gov.",
          needs: null,
          av: "still",
        };
      if (f.stop === "no-main")
        return {
          s: `I need the ${w}'s main file.`,
          sub: "None of your files is the main document that asks for bids.",
          needs: "the main file",
          av: "still",
        };
      return {
        s: `I cannot read ${main?.name ?? "the main file"}.`,
        sub: "It is a scanned picture of the pages. I cannot pick out the words. I need a copy I can read.",
        needs: "a copy I can read",
        av: "still",
      };
    }
    case "mentor-no":
      return {
        s: `${opts.mentorName.split(" ")[0]}, your mentor, said not to pursue this bid.`,
        sub: "I have not started. It is your call.",
        needs: null,
        av: "still",
      };
    case "reading":
      return {
        s: `I am reading the ${w}'s ${files} files.`,
        sub: "You can leave this page. I keep reading.",
        needs: null,
        av: "live",
      };
    case "must": {
      const total = f.must.length;
      const unsure = grantUnsure(bid);
      return {
        s: `Before I build, check the ${count(total, "rule")} that can get your bid rejected.`,
        sub:
          unsure > 0
            ? `Grant could not tell on ${unsure} of them. I check those with you.`
            : `You already meet ${f.must.filter((r) => r.state === "meets").length}.`,
        needs: `${count(f.queue.length, "rule")} to check`,
        av: "live",
      };
    }
    case "paused":
      return {
        s: "I have paused. You cannot meet one of the rules.",
        sub: "Your answers stay saved.",
        needs: null,
        av: "still",
      };
    case "answer": {
      const q = f.current;
      if (q && opts.pending)
        return {
          s: "I read the file you sent. Is this right?",
          sub: q.goes ? `Then I write ${q.goes}.` : "Then I use it in your bid.",
          needs: "confirm your file",
          av: "live",
        };
      if (q?.kind === "price")
        return {
          s: "Your price is ready. It needs your yes.",
          sub: "I never put a price in your bid that you did not approve.",
          needs: "approve your price",
          av: "live",
        };
      if (q?.kind === "decision")
        return {
          s: "One choice is yours.",
          sub: `The ${w}'s files allow either.`,
          needs: needsWords(f.queue),
          av: "live",
        };
      if (q?.kind === "staffing")
        return {
          s: "Your staffing plan sets your price.",
          sub: "Nothing in the files says how many people. I propose a plan; you approve it.",
          needs: needsWords(f.queue),
          av: "live",
        };
      return {
        s: `I am building your bid. ${count(f.queue.length, "thing")} ${f.queue.length === 1 ? "is" : "are"} waiting on you.`,
        sub: "I show you where each one goes.",
        needs: needsWords(f.queue),
        av: "live",
      };
    }
    case "checking":
      return {
        s: "I am checking your whole bid for mistakes.",
        sub: "Every rule, every form, every page limit. I fix what I can myself.",
        needs: null,
        av: "live",
      };
    case "found":
      return {
        s: `I found ${count(f.queue.length, "thing")} only you can answer.`,
        sub: "Then your bid is ready.",
        needs: needsWords(f.queue),
        av: "live",
      };
    case "ready": {
      const r = readyWords(bid, s, f);
      return { s: r.head, sub: r.sub, needs: null, av: "done" };
    }
    case "read": {
      const m = opts.mentor;
      const first = opts.mentorName.split(" ")[0];
      const holds = f.holds;
      if (daysLeft(bid) < 0)
        return {
          s: "The deadline passed.",
          sub: `You can no longer send this ${noun}. Its files still download, for your records.`,
          needs: null,
          av: "still",
        };
      if (f.queue.length > 0) {
        const again = lastWholeDownload(s) ? " again" : "";
        // Her first yes on her price is not a change (review panel, round 2).
        if (f.queue.length === 1 && f.queue[0].kind === "price" && !s.priceApproval)
          return {
            s: "Your price is ready. It needs your yes.",
            sub: `I ask you in the chat. Then you can download your bid${again}.`,
            needs: "approve your price",
            av: "live",
          };
        return {
          s: `${count(f.queue.length, "thing")} changed in your ${noun}. ${f.queue.length === 1 ? "It needs" : "They need"} your answer.`,
          sub: `I ask you in the chat. Then you can download your bid${again}.`,
          needs: needsWords(f.queue),
          av: "live",
        };
      }
      if (holds.some((h) => h.kind === "checking"))
        return {
          s: "I am checking your changes.",
          sub: "It takes a moment. Then you can download your bid.",
          needs: null,
          av: "live",
        };
      if (m?.status === "pending")
        return {
          s: `${opts.mentorName} is reviewing your bid.`,
          sub: `${first} usually replies within 1 business day. You can still change anything.`,
          needs: null,
          av: "done",
        };
      if (holds.length > 0)
        return {
          s:
            holds.length === 1
              ? "One thing must be done before you can send your bid."
              : `${count(holds.length, "thing")} must be done before you can send your bid.`,
          sub: holds[0].text
            .replace(/^No download yet: /, "")
            .replace(/^./, (c) => c.toUpperCase()),
          needs: null,
          av: "still",
        };
      if (s.check?.failed)
        return {
          s: "I could not finish checking your bid.",
          sub: "Check the list in the chat yourself before you send.",
          needs: null,
          av: "still",
        };
      if (f.holes.length > 0)
        return {
          s: `Your ${noun} is built, with ${count(f.holes.length, "part")} left open.`,
          sub: `Fill ${f.holes.length === 1 ? "it" : "them"} in before you send. A mentor can help.`,
          needs: null,
          av: "done",
        };
      if (downloadStale(s))
        return {
          s: `Your ${noun} changed after you downloaded it.`,
          sub: "Download it again before you send.",
          needs: null,
          av: "done",
        };
      if (opts.late && !m && !lastWholeDownload(s))
        return {
          s: `Your bid is due ${daysLeft(bid) <= 0 ? "today" : "tomorrow"}.`,
          sub: "A mentor may not reply in time. Read it through, then send it.",
          needs: null,
          av: "done",
        };
      const todo = stillToDo(bid, s, f);
      // She told Ava she sent it (the demo's last step).
      if (s.sentAt)
        return {
          s: `You sent your ${noun} on ${fullDate(new Date(s.sentAt))}.`,
          sub: "Ava keeps your files here. Come back if the buyer asks you a question.",
          needs: null,
          av: "done",
        };
      // One day to send, the same as How to send it: a day early.
      if (lastWholeDownload(s))
        return {
          s: `You downloaded your ${noun}. Send it by ${sendDay(bid)}, a day early.`,
          sub: todo ?? "Only you can send it. How to send it is in the chat.",
          needs: null,
          av: "done",
        };
      if (m)
        return {
          s: `${first} finished reading your bid.`,
          sub: Object.values(s.edits).some((e) => e.by === "mentor")
            ? "Each change she made is marked in your bid with her name."
            : "Her note is in the chat.",
          needs: null,
          av: "done",
        };
      return {
        s: `Your ${noun} is ready. Read it through.`,
        sub: todo ?? "Change anything you like. Then send it, or ask a mentor first.",
        needs: null,
        av: "done",
      };
    }
  }
}

/** Rules that reject the bid and are still to finish before she sends: a
 *  site visit still ahead, a paper on its way. Null when none. */
function stillToDo(bid: AvaBid, s: BidState, f: Flow): string | null {
  // Her federal registration is its own warning, unless it ends before the
  // due date: then renewing it is something to do before she sends.
  const samRule = samRuleOf(bid);
  const w = samWarning(bid, s);
  const open = f.must.filter((r) => r.state !== "meets" && r.state !== "have");
  const words = open.flatMap((r) => {
    if (samRule && r.rule.id === samRule.id)
      return w?.kind === "before-due" ? ["renew your registration to sell to the government"] : [];
    return [lowerFirst(r.rule.label)];
  });
  if (words.length === 0) return null;
  return `Still to do before you send: ${words.join("; ")}. Missing ${words.length === 1 ? "it" : "one"} gets the bid rejected.`;
}

/** How many rules Grant could not judge. One count, from Grant's rows, for
 *  the header and the chat alike (D-E4). It does not change as she answers. */
export function grantUnsure(bid: AvaBid): number {
  return knockOutRulesStatic(bid).filter((r) => r.grantSays?.startsWith("Grant could not confirm"))
    .length;
}

function knockOutRulesStatic(bid: AvaBid): HardRequirement[] {
  return bid.hardRequirements.filter((r) => (r.neededAt ?? "bid") === "bid");
}

/** One thing left at the milestone, said once: what it is, who does it,
 *  and whether it stops the download (Shyam, 7 October 2026: one list, one
 *  count, nothing twice). */
export interface LeftItem {
  key: string;
  title: string;
  /** Who does it, or what it waits on: "You", "Left for a mentor". */
  who: string;
  /** It must be done before she can download her bid. */
  blocks: boolean;
  /** One more line when there is one: why it matters, or what Ava could not check. */
  note?: string;
}

const OWNER: Record<Ask["owner"], string> = {
  you: "you",
  bookkeeper: "your bookkeeper",
  "insurance-agent": "your insurance agent",
  surety: "your surety",
  references: "your references",
  subcontractor: "the company that does part of the work",
};

/** Everything left at the milestone, each thing once: what holds the
 *  download, what she left or waits on, a rule still ahead (a site visit),
 *  and what Ava could not check. The headline, the chat and the panel all
 *  count this list, so they cannot disagree. */
export function leftList(bid: AvaBid, s: BidState, f: Flow): LeftItem[] {
  const out: LeftItem[] = [];
  const seen = new Set<string>();
  const who = (q?: Question): string => {
    if (!q) return "You";
    const l = s.left[q.key];
    if (l?.for === "mentor") return "Left for a mentor";
    if (l) return "Left for you";
    const a = q.ask ? s.answers[q.ask.id] : undefined;
    if (a?.status === "forwarded" && q.ask) {
      const w = OWNER[q.ask.owner];
      return `Waiting on ${w}`;
    }
    return "You";
  };
  const said = (text: string) =>
    text.replace(/^No download yet: /, "").replace(/^./, (c) => c.toUpperCase());

  for (const h of f.holds) {
    if (h.kind === "checking") continue;
    if (h.question) seen.add(h.question.key);
    out.push({ key: h.key, title: said(h.text), who: who(h.question), blocks: true });
  }
  for (const q of f.holes) {
    if (seen.has(q.key)) continue;
    seen.add(q.key);
    const rule = q.key.startsWith("must:")
      ? bid.hardRequirements.find((r) => `must:${r.id}` === q.key)
      : undefined;
    out.push({
      key: q.key,
      title: q.title,
      who: who(q),
      blocks: false,
      note: rule
        ? `You left the rule open, so I did not check it. Read ${rule.source.short}.`
        : undefined,
    });
  }
  // A rule still ahead of her (a site visit): one line, with what it costs.
  const sam = samRuleOf(bid);
  for (const r of f.must) {
    if (r.state === "meets" || r.state === "have" || r.rule.id === sam?.id) continue;
    const keys = [
      `must:${r.rule.id}`,
      ...[r.rule.askId, ...(r.rule.askIds ?? [])].filter(Boolean).map((a) => `ask:${a}`),
    ];
    if (keys.some((k) => seen.has(k))) continue;
    out.push({
      key: `rule:${r.rule.id}`,
      title: r.rule.label,
      who: "You",
      blocks: false,
      note: "Missing it gets the bid rejected.",
    });
  }
  // What Ava could not check goes on the thing it belongs to.
  for (const fd of exactChecks(bid, s).findings) {
    if (!fd.id.startsWith("file:")) continue;
    const file = bid.files.find((x) => `file:${x.id}` === fd.id);
    const item = out.find((x) => file?.uploadAskId && x.key === `ask:${file.uploadAskId}`);
    const note = "I could not read it, so your bid is not checked against it yet.";
    if (item) item.note = note;
    else
      out.push({
        key: fd.id,
        title: `Check your bid against ${file?.name ?? "one of the buyer's files"} yourself`,
        who: "You",
        blocks: false,
        note: "I could not read it.",
      });
  }
  s.addendumUploads.forEach((u, i) => {
    if (s.fixes[`upload-compared:${i}`] || out.some((x) => x.key === `upload:${i}`)) return;
    out.push({
      key: `upload-check:${i}`,
      title: `Read ${u.fileName} before you send`,
      who: "You",
      blocks: false,
      note: "I have not compared it with your bid.",
    });
  });
  if (s.check?.failed)
    out.push({
      key: "check-failed",
      title: "Check your bid yourself",
      who: "You",
      blocks: false,
      note: "I did not finish checking it. The list is in the chat.",
    });
  return out;
}

/** The milestone in words, for the header and the chat alike. Never "nothing
 *  would get it rejected": Ava says what she checked and what is left
 *  (review panel, 7 October 2026), counted once from leftList. */
export function readyWords(
  bid: AvaBid,
  s: BidState,
  f: Flow,
): { head: string; sub: string; lines: string[] } {
  const noun = bid.kind === "reply" ? "reply" : "bid";
  const left = leftList(bid, s, f);
  if (left.length > 0) {
    const n = left.length;
    const blocking = left.filter((x) => x.blocks).length;
    const head = `Your ${noun} is built. ${count(n, "thing")} ${n === 1 ? "is" : "are"} left.`;
    const sub =
      blocking === 0
        ? "You can read it now."
        : blocking === n
          ? `You can read it now. ${n === 1 ? "It" : "They"} must be done before you can download it.`
          : "You can read it now. Some must be done before you can download it.";
    return {
      head,
      sub,
      lines: [
        `I built and checked everything I can. ${count(n, "thing")} ${n === 1 ? "is" : "are"} left. ${n === 1 ? "It is" : "They are"} on the right.`,
        sub,
      ],
    };
  }
  const risks = Object.keys(s.risks).length;
  const sam = samWarning(bid, s);
  if (risks > 0 || sam) {
    const sub =
      risks > 0
        ? `You chose to go ahead at risk on ${count(risks, "thing")}. It is listed in How to send it.`
        : `${samWords(bid, sam!).title}.`;
    return {
      head: `Your ${noun} is ready to read.`,
      sub,
      lines: [`That was the last thing. Your ${noun} is ready to read.`, sub],
    };
  }
  return {
    head: `Your ${noun} is ready. I checked every rule I can.`,
    sub: "Now read it through, in the middle of the screen.",
    lines: [
      `That was the last thing. Your ${noun} is ready. I checked every rule I can.`,
      "Now read it through. I will put your whole bid in the middle. Change anything you like.",
    ],
  };
}

// ─── The checklist on the left ───

/** The count on the checklist: the rules during "Check you can bid", the
 *  whole list after, nothing while Ava is still reading. */
export function railCount(bid: AvaBid, s: BidState, f: Flow): string {
  if (f.stage === "reading" || f.stage === "mentor-no" || f.stage === "stopped") return "";
  if (f.stage === "must") {
    const met = f.must.filter(
      (r) => r.state !== "asking" && r.state !== "grant-unsure" && r.state !== "open",
    ).length;
    return `${met}/${f.must.length}`;
  }
  const fc = fillCount(complianceItems(bid, s));
  return `${fc.filled}/${fc.total}`;
}

export interface RailRow {
  key: string;
  title: string;
  /** "Upload", "Answer", "Type", "Approve", "Get it". Rows that need her only. */
  act?: string;
  item?: ComplianceItem;
}

const ACT: Record<ProofKind, string> = {
  copy: "Upload",
  word: "Answer",
  there: "Answer",
  later: "Later",
  type: "Type",
  choose: "Choose",
};

/** The checklist, grouped: what needs her on top, then what is done, what
 *  is needed only if she wins, and what Ava already has. */
export function railGroups(
  bid: AvaBid,
  s: BidState,
  f: Flow,
): { h: string; rows: RailRow[]; needs?: boolean }[] {
  if (f.stage === "reading" || f.stage === "mentor-no" || f.stage === "stopped") return [];
  const items = complianceItems(bid, s);
  const needs: RailRow[] = [];
  const seen = new Set<string>();
  const queue = f.stage === "must" ? f.queue : [...f.queue, ...answerQueue(bid, s, f.parts)];
  for (const q of [...queue, ...f.holes]) {
    if (seen.has(q.key)) continue;
    seen.add(q.key);
    needs.push({
      key: q.key,
      title: q.title,
      act: f.holes.includes(q)
        ? s.left[q.key]
          ? "Left open"
          : "On its way"
        : q.kind === "price"
          ? "Approve"
          : ACT[q.proof],
    });
  }
  const askKey = (i: ComplianceItem) => (i.askId ? `ask:${i.askId}` : i.id);
  const done = items.filter((i) => i.status === "have" && i.askId && !seen.has(askKey(i)));
  const later = items.filter((i) => i.kind === "after-award");
  const has = items.filter((i) => i.status === "have" && !i.askId && i.kind !== "after-award");
  const out: { h: string; rows: RailRow[]; needs?: boolean }[] = [];
  if (needs.length > 0) out.push({ h: "Needs you", rows: needs, needs: true });
  if (f.stage === "must")
    out.push({
      h: "Rules to check",
      rows: f.must.map((r) => ({ key: `rule:${r.rule.id}`, title: r.rule.label, act: r.line })),
    });
  if (done.length > 0)
    out.push({ h: "Done", rows: done.map((i) => ({ key: askKey(i), title: i.title, item: i })) });
  if (later.length > 0)
    out.push({
      h: "Only if you win",
      rows: later.map((i) => ({ key: askKey(i), title: i.title, item: i })),
    });
  if (has.length > 0)
    out.push({
      h: "Ava already has these",
      rows: has.map((i) => ({ key: i.id, title: i.title, item: i })),
    });
  return out;
}

// ─── The milestone and phase 2 ───

/** What is built, counted, for the milestone. `done` is false on a line
 *  that is still open, so it never carries a tick (review panel, 7 October
 *  2026). */
export function builtSummary(bid: AvaBid, s: BidState, f: Flow): { text: string; done: boolean }[] {
  const w = buyerWord(bid);
  const out: { text: string; done: boolean }[] = [];
  const rules = f.must.length;
  if (rules > 0) {
    const met = f.must.filter((r) => r.state === "meets").length;
    const open = f.must.filter((r) => r.state !== "meets");
    out.push(
      met === rules
        ? { text: `All ${count(rules, "rule")} that can get your bid rejected: met`, done: true }
        : {
            text: `${met} of ${count(rules, "rule")} that can get your bid rejected: met. Still to finish: ${open.map((r) => lowerFirst(r.rule.label)).join("; ")}`,
            done: false,
          },
    );
  }
  const fc = fillCount(complianceItems(bid, s));
  const left = fc.total - fc.filled;
  out.push({
    text:
      left === 0
        ? `All ${fc.total} things the ${w} asks for`
        : `${fc.filled} of ${fc.total} things the ${w} asks for. ${count(left, "is", "are")} still open`,
    done: left === 0,
  });
  if (bid.price) {
    const approved =
      !!s.priceApproval && !f.holds.some((h) => h.kind === "price") && !staffingOpen(bid, s);
    out.push(
      approved
        ? { text: "Your price, approved", done: true }
        : {
            text: staffingOpen(bid, s)
              ? "Your price waits on your staffing plan"
              : "Your price is not approved yet",
            done: false,
          },
    );
  } else out.push({ text: `No price: the ${w} allows none`, done: true });
  return out;
}

/** One plain line under the tabs, when the bid is not the usual kind: a
 *  reply (5.7), a bid with no price (6.11), or rules that come only from the
 *  notice (7.4). */
export function readNote(bid: AvaBid): string | null {
  if (bid.kind === "reply")
    return "This is not a bid. There is no price and nothing to sign. You reply by email.";
  if (!bid.price)
    return `The ${buyerWord(bid)} allows no price, so your bid has none. I checked that nothing in it states one.`;
  if (bid.files.some((f) => f.role === "main" && /notice on sam/i.test(f.name)))
    return "The rules come from the notice on SAM.gov. The buyer posted no other files.";
  return null;
}

/** Whether a mentor can reply in time. A mentor usually replies within one
 *  business day, so the days are counted as business days: a Friday send for
 *  a Monday deadline is too late (review panel, 7 October 2026). */
export function mentorTooLate(bid: AvaBid, replyDays: number): boolean {
  const left = daysLeft(bid);
  if (left < 0) return false;
  let business = 0;
  for (let d = 1; d <= left; d++) {
    const wd = dayFromNow(d).getUTCDay();
    if (wd !== 0 && wd !== 6) business++;
  }
  return business <= replyDays;
}

/** The day to send it: one business day before it is due. The header and
 *  How to send it both say this day. */
export function sendDay(bid: AvaBid): string {
  return weekdayDate(minusBusinessDays(dayFromNow(bid.deadline.dueDaysFromNow), 1));
}

/** "Thursday 21 May 2026 at 2:00 PM Eastern Time". */
export function dueWords(bid: AvaBid): string {
  const d = bid.deadline;
  return `${weekdayDate(dayFromNow(d.dueDaysFromNow))} at ${d.time}${d.zone ? ` ${d.zone}` : ""}`;
}

/** "Due today at 2:00 PM Eastern Time", "The deadline passed", or null. */
export function dueDayLine(bid: AvaBid): string | null {
  const left = daysFromToday(dayFromNow(bid.deadline.dueDaysFromNow));
  if (left < 0) return "The deadline passed";
  if (left === 0)
    return `Due today at ${bid.deadline.time}${bid.deadline.zone ? ` ${bid.deadline.zone}` : ""}`;
  return null;
}

export { usd };
