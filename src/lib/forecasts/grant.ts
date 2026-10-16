// Grant's read of one forecast — the view model behind the forecast page.
//
// One shape for every forecast, built here by rule from Hunter's scored forecast
// alone. It never claims more than the scored record carries: where a fact is
// missing, the box gets shorter or is not shown (always-on pattern 1). No read is
// written by hand.
//
// v5: each box answers one question, and a fact is written out in one box only.
// Other boxes may name it — a tag, a step title — but never explain it again. The
// shape below follows the boxes, so a fact has one field to live in (v5 §02, D-E4).
//
// The call follows the paths, never the other way round, so the chip and the tiles
// cannot disagree: any Go path means Prepare, any Not yet means Needs review, and
// otherwise Skip (v4 §02).

import type { Pin, RichLine } from "../grant/types";
import { BOUGHT_BEFORE, DETAIL_MORE, REASON, UNKNOWN, UNKNOWN_NOTE, VERDICT } from "./copy";
import {
  FORECASTS_TODAY,
  isInPerson,
  longDate,
  type RegistrationGap,
  type ScoredForecast,
} from "./engine";
import {
  JOB,
  MEET,
  PAGE_CARD,
  PATH_ORDER,
  PROGRAM_PATHS,
  READY,
  REGISTRATION,
  SIZE,
  SOURCE_NAME,
  TAKE,
  TIMELINE,
  UNKNOWN_COPY,
  WIN,
  type Confidence,
  type ForecastCall,
  type PathKey,
  type PathState,
} from "./grantCopy";
import type { ForecastTakeResponse } from "./grantTakeApi";
import { takeSources, takeWinRows } from "./take";
import type { WatchCopyState } from "./watch";
import { WATCH_PROMISE } from "./watchCopy";

// ── Types ───────────────────────────────────────────────────────────────────────

/** Text with **bold** marks. One bold run should carry the consequence (§12.12). */
export type Marked = string;

/** A gap that can be fixed before the bid request names the Get ready step that fixes
 *  it, so the chip always goes somewhere real (D-B5). */
export type CellFix = { kind: "yes"; step: string };

export interface ReadCell {
  kind: "strength" | "blocker" | "risk";
  /** The strength or the gap, stated plainly: "You can do the work". */
  title: string;
  /** One line of proof. A derived cell has only its title. */
  body?: Marked;
  /** Names that match a line in Sources. */
  sources?: string[];
  /** A government term that belongs under the body, small. */
  term?: string;
  fix?: CellFix;
}

export interface ForecastPath {
  key: PathKey;
  state: PathState;
  /** Names the deciding factor in a few words. The boxes below explain it. */
  why: string;
  best?: boolean;
}

/** How an unknown settles. "watch" is a promise, worded per watch state (`unknownChip`). */
export type UnknownHow = keyof typeof UNKNOWN_COPY.how | "watch";

export interface UnknownItem {
  label: string;
  /** What changes either way. Written here only. */
  note?: string;
  how: UnknownHow;
  /** Only an unknown that could change the call stays on a Skip page. */
  couldChangeCall?: boolean;
}

export type WinKey = keyof typeof WIN.rows;

/** One line of How to win it: how the buyer picks, who you compete with, what it takes. */
export interface WinRow {
  key: WinKey;
  body: Marked;
  sources?: string[];
  link?: { label: string; href: string };
  /** A figure we worked out, such as a price per unit from a contract's top value (D-A7). */
  ourRead?: boolean;
  why?: string;
  /** Set only on a row from Grant's take: one entry per counted figure in the body. */
  counted?: TakeCount[];
  /** What this row's counts are over, and that none is about this forecast (ledger A3). */
  countsNote?: string;
}

/** One counted figure of a take row: what it was counted over, and where it comes from. */
export interface TakeCount {
  /** "186 awards counted. Matched on: NAICS 722310. Award years: FY2006–FY2021." */
  basis: string;
  /** "Source: Federal award records, checked 3 days ago." From `resolvePublic`. */
  source: string;
  /** The public-record pin the figure rests on. */
  record: Pin;
}

export type StepOwner = keyof typeof READY.owner;

export type StepAction =
  | { kind: "partners"; label: string; search: Record<string, string> }
  | { kind: "profile"; label: string }
  | { kind: "external"; label: string; href: string }
  | { kind: "rail"; label: string; question?: string; draft?: string };

/** The event an "if" step waits for. When it is seen on a tracked forecast, the step
 *  becomes a counted task and the member is told. */
export type IfTrigger = "notice_posted" | "bid_posted" | "award_named" | "job_posted";

export interface PlanStep {
  id: string;
  /** A task is counted and numbered. An "if" step waits for its event. */
  kind: "task" | "if";
  trigger?: IfTrigger;
  title: string;
  /** How to do it, or how it helps, only when the title and tag are not enough. */
  body?: string;
  owners?: StepOwner[];
  /** Names the box item the step serves. It never repeats that item's reason. */
  forWhat?: { verb: keyof typeof READY.forVerb; what: string };
  action?: StepAction;
  term?: string;
}

export interface PlanPhase {
  id: string;
  name: string;
  when?: string;
  goal?: string;
  steps: PlanStep[];
}

export interface TimelineMark {
  /** Sort key: an ISO date, or the day the mark is counted from. */
  on: string;
  date: string;
  label: string;
  kind: "past" | "today" | "window" | "future" | "unknown";
  ourRead?: boolean;
  /** Why the date is our read. Shown in the tag's tooltip. */
  why?: string;
}

export interface JobFact {
  label: string;
  value: string;
  sub?: string;
  ourRead?: boolean;
  why?: string;
  href?: string;
}

export interface EvidenceRead {
  /** Only what the last bid request adds to the boxes above, and its documents. */
  lastBid?: { work?: string; documents: { label: string; href: string }[]; number: string };
  /** Every source Grant read, with its count and years. Source chips use these names. */
  sources: string[];
}

export interface AnswerEffect {
  when: { equals?: string; above?: number; atMost?: number };
  addLimit?: ReadCell;
  /** A gap the answer settles, by title. It leaves the page with the answer. */
  removeLimit?: string;
  /** A step the answer makes needless, by id. */
  removeStep?: string;
  /** A step moved to the top of the first phase, so it becomes Start here. */
  firstStep?: string;
  path?: ForecastPath;
  /** Other ways in the same answer settles, such as a partner no longer needed. */
  morePaths?: ForecastPath[];
  best?: PathKey;
}

export interface RailQuestion {
  id: string;
  /** The noun said back on confirmation: "Health report". */
  noun: string;
  /** Holds what the member needs to answer it, so it stands on its own in the chat. */
  ask: string;
  input: "choice" | "money";
  options?: string[];
  effects: AnswerEffect[];
}

/** What the page allows on each way in, from facts, never from an answer (§10.2).
 *  "closed": always No-go. "not_go": never Go. "open": the read decides. */
export type Eligibility = "open" | "closed" | "not_go";

export interface ForecastRead {
  eligibility?: Record<PathKey, Eligibility>;
  call: ForecastCall;
  /** Set when the read cannot judge yet: the detail it is waiting on. */
  waiting?: string;
  confidence: Confidence;
  paths: ForecastPath[];
  /** One line under the path tiles, e.g. that a program set-aside is the buyer's plan. */
  pathsNote?: string;
  /** Grant's call in one sentence. It goes with a mentor request; the page does not show it. */
  summary: Marked;
  strengths: ReadCell[];
  limits: ReadCell[];
  unknowns: UnknownItem[];
  win: WinRow[];
  plan: PlanPhase[];
  /** Shown under Today on the timeline, or null when there is nothing to prepare. */
  prepare: string | null;
  timeline: TimelineMark[];
  /** An empty summary shows no summary line: the record's own text is in B13. */
  job: { summary: string; summaryOurRead?: string; facts: JobFact[] };
  evidence: EvidenceRead;
  rail: {
    /** What Grant took from My Business, said in the chat so it can be corrected. */
    assumed?: string;
    questions: RailQuestion[];
    starters: { ask: string; answer: string }[];
    /** A draft email, one entry per line; {company} and {hq} are filled at render. */
    drafts?: Record<string, { title: string; lines: string[] }>;
  };
}

// ── Small helpers ───────────────────────────────────────────────────────────────

/** "Price **alone** decided it" → segments, for the Grant primitives. */
export function rich(text: Marked): RichLine {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part },
    );
}

function monthYearOf(iso: string): string {
  return longDate(iso).replace(/^\d+ /, "");
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function sentence(text: string): string {
  const t = text.trim();
  return /[.?!]$/.test(t) ? t : `${t}.`;
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.?!])\s+/)[0] ?? text;
}

const LEVELS: Confidence[] = ["low", "medium", "high"];

// ── The derived read ────────────────────────────────────────────────────────────

type ReasonKind = "place" | "size" | "work";

function reasonKind(text: string): ReasonKind {
  if (text === REASON.inArea || text === REASON.noPlace || text.includes("outside")) return "place";
  if (text === REASON.rightSize || text === REASON.tooBig || text.startsWith("A small job"))
    return "size";
  return "work";
}

/** A tile names the deciding factor. The limit card below says the reason in full. */
function factorOf(text: string): string {
  if (text.includes("outside")) return "Outside the states you serve.";
  if (text === REASON.noPlace) return "The place is not known.";
  if (text === REASON.tooBig) return "Too big for now.";
  if (text.startsWith("A small job")) return "Too small to be worth it.";
  return "Not your kind of work.";
}

/** The first detail a read that cannot judge yet is waiting on. */
function missingDetail(f: ScoredForecast): string {
  const r = f.record;
  if (!f.statesKnown) return TAKE.waitingOn.states;
  if (!f.place.concrete) return TAKE.waitingOn.place;
  if (!r.hgText || r.hgText === r.hgTitle) return TAKE.waitingOn.work;
  if (r.valHigh == null) return TAKE.waitingOn.size;
  if (!f.sizeKnown) return TAKE.waitingOn.pastJobs;
  return TAKE.waitingOn.more;
}

interface DerivedPaths {
  paths: ForecastPath[];
  waiting: string | null;
  /** One line under the path tiles, when the rule that decided has one. */
  note?: string;
}

/** The ways in, by rules that run in this order. The first that holds decides. */
function derivePaths(f: ScoredForecast): DerivedPaths {
  const open = f.lifecycle === "open";
  const all = (state: PathState, prime: string): ForecastPath[] =>
    PATH_ORDER.map((key) => ({ key, state, why: key === "prime" ? prime : "Same reason." }));
  const done = (paths: ForecastPath[]): DerivedPaths => ({ paths, waiting: null });
  const wait = (detail: string): DerivedPaths => ({
    paths: all("not_yet", TAKE.waiting(detail)),
    waiting: detail,
  });

  // 1 · Not open. A forecast that went stale by its date has no note of its own.
  if (!open)
    return done(
      all(
        "no_go",
        sentence(
          f.facts.lifecycle?.note ?? (f.lifecycle === "stale" ? VERDICT.stale : VERDICT.closed),
        ),
      ),
    );
  // 2 · A named place outside her states, for work done in person. It closes every way
  // in, on a direct award and on a thin local record too.
  if (outsideInPerson(f)) return done(all("no_go", "Outside the states you serve."));
  // 3 · A direct award: no other company can bid, whether or not Hunter could rate it.
  if (f.facts.directAward)
    return done([
      { key: "prime", state: "no_go", why: "No other company can bid." },
      { key: "teaming", state: "no_go", why: "Same reason." },
      // A program that wins directly, such as a blind-vendor agency, may hire a partner.
      { key: "subcontract", state: "not_yet", why: "The chosen party could hire a partner." },
    ]);
  // 4 · The buyer's own record: not competed, or only a contract's holders may bid.
  if (f.whoMayBid.kind === "not_competed")
    return done([
      { key: "prime", state: "no_go", why: "Not open to bids." },
      { key: "teaming", state: "no_go", why: "Same reason." },
      { key: "subcontract", state: "not_yet", why: "The chosen company could hire you." },
    ]);
  if (f.whoMayBid.kind === "vehicle_only")
    return done([
      { key: "prime", state: "no_go", why: "Only companies on that contract can bid." },
      { key: "teaming", state: "no_go", why: "Same reason." },
      { key: "subcontract", state: "not_yet", why: "A company on that contract could hire you." },
    ]);
  // 5 · Too thin for Hunter to rate (a local record whose text says too little).
  if (!f.published) return wait(TAKE.waitingOn.buy);

  // 4 · Hunter reads the work as not hers. Hunter's extraction must have read something.
  const wrongWork = f.facts.scopeFit < 0.3 && f.facts.extraction !== "none";
  if (wrongWork)
    return done([
      { key: "prime", state: "no_go", why: "Not your kind of work." },
      { key: "teaming", state: "no_go", why: "A partner would do the main work." },
      { key: "subcontract", state: "no_go", why: "Same reason." },
    ]);

  // 6 · Kept for a program she does not hold, or planned for one chosen company.
  if (f.whoMayBid.kind === "program")
    return {
      ...done([
        { key: "prime", state: "no_go", why: PROGRAM_PATHS.prime(f.whoMayBid.program) },
        { key: "teaming", state: "no_go", why: PROGRAM_PATHS.teaming(f.whoMayBid.program) },
        { key: "subcontract", state: "not_yet", why: PROGRAM_PATHS.subcontract },
      ]),
      note: PROGRAM_PATHS.note,
    };
  if (f.whoMayBid.kind === "program_one_held")
    return done([
      {
        key: "prime",
        state: "not_yet",
        why:
          f.whoMayBid.program === "8(a)"
            ? "Tell the office and your SBA specialist you are certified."
            : "Tell the office you are certified.",
      },
      { key: "teaming", state: "not_yet", why: "Same reason." },
      { key: "subcontract", state: "not_yet", why: "The chosen company could hire you." },
    ]);
  if (f.whoMayBid.kind === "program_unknown") return wait(TAKE.waitingOn.certs);
  if (f.whoMayBid.kind === "program_one")
    return done([
      { key: "prime", state: "no_go", why: "Planned for one chosen company." },
      { key: "teaming", state: "no_go", why: "Same reason." },
      { key: "subcontract", state: "not_yet", why: "The chosen company could hire you." },
    ]);

  // 7 · A set-aside code we cannot read: never read as open to all.
  if (f.whoMayBid.kind === "unlisted") return wait(TAKE.waitingOn.who);
  // 8 · Kept for small businesses, and My Business does not say she is one.
  if (f.whoMayBid.kind === "small_business" && !f.smallKnown) return wait(TAKE.waitingOn.small);

  // 8 · A weak fit names its deciding factor.
  if (f.fit === "weak") {
    const bad = f.reasons.find((r) => !r.ok)?.text;
    return done([
      { key: "prime", state: "no_go", why: bad ? factorOf(bad) : "Not your kind of work." },
      { key: "teaming", state: "no_go", why: "A partner would not change the fit." },
      { key: "subcontract", state: "no_go", why: "Same reason." },
    ]);
  }

  // 9 · Much bigger than her past jobs.
  // On work kept for small businesses, a partner doing the main work can cost her the job.
  if (f.partnerRoute)
    return done([
      { key: "prime", state: "not_yet", why: "Too big to lead alone." },
      {
        key: "teaming",
        state: "not_yet",
        why: f.partnerRules
          ? "Only with a small partner of the same kind."
          : "A bigger partner could share it.",
      },
      {
        key: "subcontract",
        state: "not_yet",
        why: !f.partnerRules
          ? "A bigger company could lead."
          : f.whoMayBid.kind === "small_business"
            ? "A bigger small business could lead."
            : "A bigger certified company could lead.",
      },
    ]);

  // 10 · A best or good fit, in a named place, with both sizes known.
  if ((f.fit === "best" || f.fit === "good") && f.place.concrete && f.sizeKnown && f.statesKnown)
    return done([
      { key: "prime", state: "go", why: "You can do it all yourself.", best: true },
      { key: "teaming", state: "not_needed", why: "No partner needed." },
      { key: "subcontract", state: "not_needed", why: "Leading it is the simpler way in." },
    ]);

  // 11 · A possible fit with a gap on record is not waiting on the buyer: the gap in
  // What holds you back is the thing to weigh. The tile points there, not repeats it.
  const doubt = f.fit === "possible" && f.reasons.some((r) => !r.ok);
  if (doubt && f.place.concrete && f.statesKnown && f.sizeKnown)
    return done(all("not_yet", TAKE.weighGap));

  // 12 · Anything else waits, and names what for. Unknown data never reads as Go (D-C4).
  return wait(missingDetail(f));
}

function outsideInPerson(f: ScoredForecast): boolean {
  return f.place.concrete && f.statesKnown && !f.inArea && isInPerson(f) === true;
}

/** What each way in allows, from facts alone. Any answer
 *  is held to it: a closed way stays No-go, and a way that cannot be Go stays Not yet. */
export function eligibilityOf(f: ScoredForecast): Record<PathKey, Eligibility> {
  const set = (prime: Eligibility, teaming: Eligibility, subcontract: Eligibility) => ({
    prime,
    teaming,
    subcontract,
  });
  if (f.lifecycle !== "open" || outsideInPerson(f)) return set("closed", "closed", "closed");
  if (f.facts.directAward) return set("closed", "closed", "open");
  switch (f.whoMayBid.kind) {
    case "not_competed":
    case "vehicle_only":
    case "program":
    case "program_one":
      return set("closed", "closed", "open");
    case "program_one_held":
      return set("not_go", "not_go", "open");
    case "program_unknown":
    case "unlisted":
      return set("not_go", "not_go", "not_go");
  }
  // Unknown data never reads as Go (D-C4), on any read.
  const unknown =
    !f.statesKnown ||
    (!f.place.concrete && f.inPerson !== false) ||
    !f.sizeKnown ||
    (f.whoMayBid.kind === "small_business" && !f.smallKnown);
  return unknown ? set("not_go", "not_go", "not_go") : set("open", "open", "open");
}

/** Holds paths to what the facts allow. The derived path supplies the reason. */
function clampPaths(
  paths: ForecastPath[],
  eligibility: Record<PathKey, Eligibility>,
  derived: ForecastPath[],
): ForecastPath[] {
  return paths.map((p) => {
    const e = eligibility[p.key];
    const d = derived.find((x) => x.key === p.key) as ForecastPath;
    if (e === "closed" && p.state !== "no_go")
      return { key: p.key, state: "no_go", why: d.state === "no_go" ? d.why : "Same reason." };
    if (e === "not_go" && p.state === "go")
      return { key: p.key, state: "not_yet", why: d.state === "not_yet" ? d.why : "Not yet." };
    return p;
  });
}

export function callFromPaths(paths: ForecastPath[], open: boolean): ForecastCall {
  if (!open) return "closed";
  if (paths.some((p) => p.state === "go")) return "prepare";
  if (paths.some((p) => p.state === "not_yet")) return "review";
  return "skip";
}

/** The name of the record a derived read came from, as B15 lists it. */
function forecastSource(f: ScoredForecast): string {
  return f.lane === "sled" ? (f.foundIn ?? f.record.agencyName) : SOURCE_NAME.agencyForecast;
}

/** The registration gap, on every read, full or derived (D-C3). */
function registrationCell(f: ScoredForecast): ReadCell | null {
  const gap = f.registration.gap;
  if (!gap) return null;
  const ends = f.registration.endsOn ? longDate(f.registration.endsOn) : "";
  return {
    kind: "risk",
    title: REGISTRATION.title[gap],
    body:
      gap === "not_registered"
        ? REGISTRATION.notRegistered
        : gap === "lapsed"
          ? REGISTRATION.lapsed
          : gap === "unknown_end"
            ? REGISTRATION.unknownEnd
            : f.registration.far
              ? REGISTRATION.endsSoonFar(ends)
              : REGISTRATION.endsSoon(ends),
    term: REGISTRATION.term,
    sources: [SOURCE_NAME.registration],
    fix: { kind: "yes", step: registrationStep(gap) },
  };
}

function registrationStep(gap: RegistrationGap): string {
  return gap === "not_registered"
    ? "register"
    : gap === "unknown_end"
      ? "check_registration"
      : "renew";
}

/** The size check, on every small-business or program set-aside, full or derived. */
function sizeCell(f: ScoredForecast): ReadCell | null {
  if (!f.sizeCheck) return null;
  return {
    kind: "risk",
    title: SIZE.title,
    body: SIZE.body(f.record.naicsCode),
    term: SIZE.term,
    sources: [forecastSource(f)],
  };
}

const DEFENSE =
  /Department of Defense|\bArmy\b|\bNavy\b|Air Force|Marine Corps|\bDefense\b|\bDLA\b|Military Sealift|\bMICC\b|\bNAVFAC\b/i;

/** Warnings the page owns and adds to every read, full or derived (§10.2). */
function pageCells(f: ScoredForecast): ReadCell[] {
  const cells: ReadCell[] = [];
  const registration = registrationCell(f);
  if (registration) cells.push(registration);
  const size = sizeCell(f);
  if (size) cells.push(size);
  const source = forecastSource(f);
  const biddable =
    f.lane === "federal" &&
    f.lifecycle === "open" &&
    !f.facts.directAward &&
    f.whoMayBid.kind !== "not_competed" &&
    f.whoMayBid.kind !== "vehicle_only";
  if (f.partnerRules) cells.push({ kind: "risk", ...PAGE_CARD.partner, sources: [source] });
  if (biddable && DEFENSE.test(`${f.record.sourceName ?? ""} ${f.record.agencyName}`))
    cells.push({ kind: "risk", ...PAGE_CARD.cyber, sources: [source] });
  if (biddable && /^23/.test(f.record.naicsCode ?? "") && (f.record.valHigh ?? 0) > 150000)
    cells.push({ kind: "risk", ...PAGE_CARD.bonds, sources: [source] });
  return cells;
}

const PAGE_CARD_TITLES = new Set<string>([
  ...Object.values(REGISTRATION.title),
  SIZE.title,
  PAGE_CARD.partner.title,
  PAGE_CARD.cyber.title,
  PAGE_CARD.bonds.title,
]);
const REGISTRATION_STEPS = new Set(["register", "renew", "check_registration"]);
const MANDATORY_UNKNOWNS = new Set<string>([UNKNOWN.blindVendors, UNKNOWN.abilityOne]);

function deriveCells(f: ScoredForecast): { strengths: ReadCell[]; limits: ReadCell[] } {
  const strengths: ReadCell[] = [];
  const limits: ReadCell[] = [];
  const source = forecastSource(f);
  for (const r of f.reasons) {
    // A place nobody has shared is an open fact, so it lives in Still unknown only.
    if (r.text === REASON.noPlace && f.unknowns.includes(UNKNOWN.place)) continue;
    if (r.ok) {
      strengths.push({ kind: "strength", title: r.text, sources: [source] });
    } else {
      // A direct award stops every bid. Otherwise a record too thin to rate gives
      // guesses, not facts, so nothing on it is a blocker.
      const kind = reasonKind(r.text);
      const hard =
        r.text === f.facts.directAward ||
        (f.published && (kind === "work" || r.text.includes("outside") || f.fit === "cannot_bid"));
      // The job's value is in The opportunity, so the size reason does not repeat it.
      const title = r.text.startsWith("A small job") ? "A small job" : r.text;
      limits.push({ kind: hard ? "blocker" : "risk", title, sources: [source] });
    }
  }
  for (const text of f.facts.requirements ?? []) {
    const title = firstSentence(text).replace(/[.?!]$/, "");
    const rest = text.slice(firstSentence(text).length).trim();
    limits.push({ kind: "risk", title, body: rest || undefined, sources: [source] });
  }
  limits.push(...pageCells(f));
  return { strengths, limits };
}

/** How each derived unknown settles. Every unknown the engine can raise is here, so no
 *  unknown ever gets a default promise (D-A4). */
const UNKNOWN_HOW: Record<(typeof UNKNOWN)[keyof typeof UNKNOWN], UnknownHow> = {
  [UNKNOWN.whoMayBid]: "watch",
  [UNKNOWN.date]: "watch",
  [UNKNOWN.work]: "posts",
  [UNKNOWN.contact]: "posts",
  [UNKNOWN.place]: "posts",
  // A federal estimate is rarely published in a bid request, but a forecast update can show it.
  [UNKNOWN.value]: "watch",
  [UNKNOWN.lastContract]: "grant_checks",
  [UNKNOWN.blindVendors]: "ask_office",
  [UNKNOWN.abilityOne]: "ask_office",
  [UNKNOWN.onSite]: "ask_office",
};

/** How an unknown settles on this forecast. A chip is only a promise a source can keep:
 *  a local record never carries a set-aside to watch, and an unreadable code is asked. */
export function unknownHow(label: string, f?: ScoredForecast): UnknownHow {
  if (label === UNKNOWN.whoMayBid && f) {
    if (f.lane === "sled") return "posts";
    if (f.whoMayBid.kind === "unlisted") return "ask_office";
  }
  // No API field links local records into a trail, so nothing local can be watched.
  if (f?.lane === "sled" && (label === UNKNOWN.date || label === UNKNOWN.value)) return "posts";
  const how = UNKNOWN_HOW[label as keyof typeof UNKNOWN_HOW];
  if (!how) throw new Error(`No settling route for the unknown "${label}"`);
  return how;
}

/** While watching is off, a "watch" unknown names the process that settles it (A4). */
const WATCH_OFF_HOW: Partial<Record<string, Exclude<UnknownHow, "watch">>> = {
  [UNKNOWN.whoMayBid]: "ask_office",
  [UNKNOWN.value]: "ask_office",
  [UNKNOWN.date]: "posts",
};

/** The chip on one unknown: the route it names and its words. */
export interface UnknownChip {
  how: UnknownHow;
  text: string;
}

/**
 * The chip on one unknown, in this watch state. A "watch" chip is a promise, so it shows
 * only while watching is on. While it is off, the chip names a process that exists.
 */
export function unknownChip(u: UnknownItem, tracked: boolean, state: WatchCopyState): UnknownChip {
  if (u.how !== "watch") return { how: u.how, text: UNKNOWN_COPY.how[u.how] };
  const promise = WATCH_PROMISE[state];
  const text = tracked ? promise.chipTracked : promise.chipUntracked;
  if (text != null) return { how: "watch", text };
  const how = WATCH_OFF_HOW[u.label] ?? "ask_office";
  return { how, text: UNKNOWN_COPY.how[how] };
}

/** The line under Still unknown that points to Track this. Null: no line. */
export function watchTrackLine(
  unknowns: UnknownItem[],
  tracked: boolean,
  state: WatchCopyState,
): string | null {
  if (tracked || !unknowns.some((u) => u.how === "watch")) return null;
  return WATCH_PROMISE[state].trackLine;
}

/** Grant's bounds on a forecast, with the tracking promise only while watching is on. */
export function meetBounds(state: WatchCopyState): string {
  const promise = WATCH_PROMISE[state].boundsPromise;
  return promise == null ? MEET.bounds : `${MEET.bounds} ${promise}`;
}

function spanOf(days: number): string {
  return days < 60
    ? TIMELINE.weeks(Math.max(1, Math.round(days / 7)))
    : TIMELINE.months(Math.round(days / 30.44));
}

function derivePrepare(f: ScoredForecast): string | null {
  // The buyer's own solicitation date wins: it is the bid request, not the award.
  const release = f.buyer?.solicitationOn;
  if (release && f.lifecycle === "open")
    return release <= FORECASTS_TODAY
      ? TIMELINE.mayBeOut
      : TIMELINE.untilBid(spanOf(daysFrom(FORECASTS_TODAY, release)));
  const days = f.timing.runwayDays;
  if (days == null) return null;
  const span = spanOf(days);
  // Only a window read from the buyer's words is a bid request date. A record's own date
  // can be the award or the start, so the time is counted to it, not called preparation.
  if (f.facts.timing?.kind === "window") return TIMELINE.prepare(span);
  // A local date we estimated is not the buyer's (D-E5).
  return f.lane === "sled" && f.timing.ourRead
    ? TIMELINE.untilEstimate(span)
    : TIMELINE.untilDate(span);
}

function daysFrom(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) /
      86_400_000,
  );
}

function earliest(...dates: (string | null | undefined)[]): string | null {
  const known = dates.filter((d): d is string => !!d).sort();
  return known[0] ?? null;
}

const PLAN_GOAL = {
  now: "Check the job can work for you",
  before: "Be ready to send a price in days",
};

/** The date Now runs to: 45 days, or sooner for a meeting, a bid request the buyer
 *  expects, or a window close at hand. Null when that date is already here. */
function nowBy(f: ScoredForecast, meetingOn: string | null): string | null {
  const by = earliest(
    addDays(FORECASTS_TODAY, 45),
    meetingOn,
    f.buyer?.solicitationOn,
    f.timing.middle ? addDays(f.timing.middle, -30) : null,
  ) as string;
  return by <= FORECASTS_TODAY ? null : by;
}

/** Renew at least 30 days before the registration ends, and before the bid request. */
function renewBy(f: ScoredForecast): string | null {
  return earliest(
    f.timing.middle ? addDays(f.timing.middle, -30) : null,
    f.buyer?.solicitationOn ? addDays(f.buyer.solicitationOn, -30) : null,
    f.registration.endsOn ? addDays(f.registration.endsOn, -30) : null,
  );
}

function registrationPlanStep(f: ScoredForecast): PlanStep | null {
  const gap = f.registration.gap;
  const s = f.steps.find(
    (x) => x.kind === "renew" || x.kind === "register" || x.kind === "check_registration",
  );
  if (!s || !gap) return null;
  return {
    id: s.kind,
    kind: "task",
    title: s.title,
    owners: ["you"],
    forWhat: { verb: "fixes", what: REGISTRATION.title[gap] },
    term: s.term ?? undefined,
    action: s.link ? { kind: "external", label: s.link.label, href: s.link.href } : undefined,
  };
}

/** Whether the registration step belongs in Now: missing, lapsed or unreadable, or a
 *  renewal whose date has come. */
function registrationIsNow(f: ScoredForecast, now: string | null): boolean {
  if (f.registration.gap !== "ends_soon") return true;
  const by = renewBy(f);
  return !now || !by || by <= now;
}

function derivePlan(f: ScoredForecast): PlanPhase[] {
  const now: PlanStep[] = [];
  const before: PlanStep[] = [];
  let meetingOn: string | null = null;
  for (const s of f.steps) {
    if (s.kind === "renew" || s.kind === "register" || s.kind === "check_registration") continue;
    const action: StepAction | undefined = s.link
      ? s.link.external
        ? { kind: "external", label: s.link.label, href: s.link.href }
        : { kind: "partners", label: s.link.label, search: s.link.search ?? {} }
      : undefined;
    if (s.kind === "meeting" && s.on) meetingOn = s.on;
    now.push({
      id: s.kind,
      kind: "task",
      title: s.title,
      body: s.body,
      owners: ["you"],
      term: s.term ?? undefined,
      action,
    });
  }
  const by = nowBy(f, meetingOn);
  const reg = registrationPlanStep(f);
  // A missing, lapsed or unreadable registration comes first. One that ends later waits.
  if (reg) {
    if (registrationIsNow(f, by)) now.unshift(reg);
    else before.push(reg);
  }
  const phases: PlanPhase[] = [];
  if (now.length)
    phases.push({
      id: "now",
      name: "Now",
      when: by ? `by ${longDate(by)}` : TIMELINE.asap,
      goal: PLAN_GOAL.now,
      steps: now,
    });
  if (before.length) {
    const renew = renewBy(f);
    phases.push({
      id: "before",
      name: "Before the bid request",
      when: renew ? `by ${longDate(renew)}` : undefined,
      goal: PLAN_GOAL.before,
      steps: before,
    });
  }
  return phases;
}

function deriveTimeline(f: ScoredForecast): TimelineMark[] {
  const marks: TimelineMark[] = [];
  const a = f.priorAward;
  if (a && a.startOn <= FORECASTS_TODAY)
    marks.push({
      on: a.startOn,
      date: monthYearOf(a.startOn),
      label: TIMELINE.contractStarts,
      kind: "past",
    });
  if (f.record.postedOn)
    marks.push({
      on: f.record.postedOn,
      date: monthYearOf(f.record.postedOn),
      // posted_date is the latest version's date, so a federal forecast says "updated".
      label: f.lane === "sled" ? "Record posted" : TIMELINE.forecastUpdated,
      kind: "past",
    });
  marks.push({ on: FORECASTS_TODAY, date: TIMELINE.today, label: "", kind: "today" });
  const release = f.buyer?.solicitationOn;
  if (release && f.lifecycle === "open")
    marks.push({
      on: release,
      date: longDate(release),
      label: release < FORECASTS_TODAY ? TIMELINE.bidWasExpected : TIMELINE.bidExpected,
      kind: release < FORECASTS_TODAY ? "past" : "future",
    });
  if (f.lifecycle === "open" && f.timing.middle) {
    marks.push({
      on: f.timing.middle,
      date: f.timing.label,
      // Only a window read from the buyer's words is a bid request. A record's own date
      // may be the award or the start, and a local date may be ours alone.
      label:
        f.facts.timing?.kind === "window"
          ? TIMELINE.bidLikely
          : f.buyer
            ? TIMELINE.awardExpected
            : f.lane === "sled" && f.timing.ourRead
              ? TIMELINE.estimatedDate
              : TIMELINE.buyersDate,
      kind: "window",
      ourRead: f.timing.ourRead,
      why: f.timing.ourRead ? f.timing.note : undefined,
    });
  } else if (f.lifecycle === "open") {
    marks.push({
      on: "9999-12-31",
      date: TAKE.noDate,
      label: "A bid request, if any",
      kind: "unknown",
    });
  }
  if (a && a.endOn > FORECASTS_TODAY)
    marks.push({
      on: a.endOn,
      date: longDate(a.endOn),
      label: TIMELINE.canRunUntil,
      kind: "future",
    });
  return marks.sort((x, y) => (x.on < y.on ? -1 : x.on > y.on ? 1 : 0));
}

/** A decided rule about who may bid is a job fact, on every read. */
const JOB_WHO_KINDS = new Set([
  "small_business",
  "program",
  "program_one",
  "held",
  "program_one_held",
  "program_unknown",
  "vehicle_only",
  "not_competed",
]);

function deriveJob(f: ScoredForecast): ForecastRead["job"] {
  const local = f.lane === "sled";
  const r = f.record;
  const text = r.hgText && r.hgText !== r.hgTitle ? r.hgText : null;
  const facts: JobFact[] = [];
  // A fact the buyer has not shared, and Grant cannot work out, is left out (v5 box 2).
  if (f.value)
    facts.push({
      label: JOB.fact.value,
      value: f.value,
      // A local figure often covers more than this job, so its caption is visible.
      sub: local ? DETAIL_MORE.valueLocalShort : undefined,
      ourRead: local,
      why: local ? DETAIL_MORE.valueLocal : undefined,
    });
  if (f.place.label)
    facts.push({
      label: JOB.fact.place,
      value: f.place.label,
      ourRead: f.place.ourRead,
      why: f.place.note ?? undefined,
    });
  // A decided set-aside is a fact about the job. An undecided one is in Still unknown.
  if (JOB_WHO_KINDS.has(f.whoMayBid.kind))
    facts.push({
      label: JOB.fact.whoMayBid,
      value: f.whoMayBid.text,
      ourRead: !!f.whoMayBid.ourRead,
      why: f.whoMayBid.ourRead,
    });
  if (!local && r.contactName)
    facts.push({
      label: JOB.fact.contact,
      value: r.contactRole ? DETAIL_MORE.contactRole(r.contactName, r.contactRole) : r.contactName,
      href: r.contactEmail ? `mailto:${r.contactEmail}` : undefined,
    });
  if (f.boughtBefore && f.boughtBefore.text !== BOUGHT_BEFORE.notShared.text)
    facts.push({ label: JOB.fact.boughtBefore, value: f.boughtBefore.text });
  // The record's own text is quoted in What the record says, so the job card does not
  // lead with it. A record with no text says so here.
  return { summary: text ? "" : DETAIL_MORE.titleOnly, facts };
}

function deriveEvidence(f: ScoredForecast): EvidenceRead {
  return {
    sources: [
      forecastSource(f),
      ...(f.priorAward ? [SOURCE_NAME.lastContract] : []),
      ...(f.registration.gap ? [SOURCE_NAME.registration] : []),
      SOURCE_NAME.myBusiness,
    ],
  };
}

/** How to win it, from the records a derived read has. With no rival known and no
 *  past bid request, the box has nothing true to say, so it is left empty. */
function deriveWin(f: ScoredForecast): WinRow[] {
  const a = f.priorAward;
  if (!a?.awardee) return [];
  const bids =
    a.offers != null
      ? ` Last time, ${a.offers} ${a.offers === 1 ? "company" : "companies"} bid.`
      : "";
  // "Holds it now" needs a current end date still ahead. Unused options can end it early.
  const holds =
    a.currentEndOn && a.currentEndOn >= FORECASTS_TODAY
      ? `**${a.awardee}** holds it now.`
      : a.currentEndOn
        ? `**${a.awardee}** had it through at least ${longDate(a.currentEndOn)}. It may have been extended.`
        : `**${a.awardee}** had the last contract.`;
  return [
    {
      key: "rivals",
      body: `${holds}${bids}`,
      sources: [SOURCE_NAME.lastContract],
      link: a.noticeUrl ? { label: WIN.seeContract, href: a.noticeUrl } : undefined,
    },
  ];
}

/** A mandatory source can take the whole job, so it says so and stays on a Skip page. */
function unknownItem(label: string, f: ScoredForecast): UnknownItem {
  const mandatory = MANDATORY_UNKNOWNS.has(label);
  return {
    label,
    how: unknownHow(label, f),
    note: mandatory ? UNKNOWN_NOTE.mandatory : undefined,
    couldChangeCall: mandatory || undefined,
  };
}

export function deriveRead(f: ScoredForecast): ForecastRead {
  const open = f.lifecycle === "open";
  const { paths, waiting, note: pathsNote } = derivePaths(f);
  const eligibility = eligibilityOf(f);
  const call = callFromPaths(paths, open);
  const { strengths, limits } = deriveCells(f);
  // Grant is sure of a call where every way in is closed, even on a thin record.
  const hard = paths.every((p) => p.state === "no_go");
  // A read that is waiting on a detail cannot be sure of its call.
  const confidence: Confidence = hard ? "high" : !f.published || waiting ? "low" : f.confidence;
  const firstBad = f.reasons.find((r) => !r.ok)?.text;
  const summary =
    call === "closed"
      ? f.verdict
      : call === "skip"
        ? `Skip this one. **${firstBad ? sentence(firstBad) : sentence(paths[0].why)}**`
        : call === "prepare"
          ? `Worth preparing for. **${firstSentence(f.facts.why)}**`
          : waiting
            ? `Too early to judge a bid. **${TAKE.waiting(waiting)}**`
            : `Needs a closer look. **${sentence(firstBad ?? paths[0].why)}**`;
  const plan = derivePlan(f);

  return {
    eligibility,
    call,
    waiting: waiting ?? undefined,
    confidence,
    paths,
    pathsNote,
    summary,
    strengths,
    limits,
    unknowns: open ? f.unknowns.map((u) => unknownItem(u, f)) : [],
    win: deriveWin(f),
    plan,
    prepare: derivePrepare(f),
    timeline: deriveTimeline(f),
    job: deriveJob(f),
    evidence: deriveEvidence(f),
    rail: {
      questions: [],
      // With no plan on the page, "what first" is the one thing the chat can add.
      starters:
        plan.length === 0 && call === "review"
          ? [
              {
                ask: "What should I do first?",
                // A detail only she can add is the first thing to do, not "nothing yet".
                answer: waiting?.includes("My Business") ? TAKE.fillIn(waiting) : f.answers.doFirst,
              },
            ]
          : [],
    },
  };
}

// ── The call's shape, answers and Start here ───────────────────────────────────

/** One place decides what a call leaves on the page (v5 §06). A box with nothing to
 *  add is emptied here, so the page hides it instead of saying "nothing here". */
/** Warnings tied to preparing for this job, which a Skip page does not need. */
const SKIP_DROPS = new Set<string>([
  REGISTRATION.title.ends_soon,
  PAGE_CARD.cyber.title,
  PAGE_CARD.bonds.title,
  PAGE_CARD.partner.title,
]);

function shape(read: ForecastRead): ForecastRead {
  const closed = read.call === "closed";
  const quiet = closed || read.call === "skip";
  const prepare = quiet ? null : read.prepare;
  const plan = quiet ? [] : read.plan;
  // A gap keeps its "Can fix" only while the step that fixes it is on the page (D-B5).
  const onPage = new Set(plan.flatMap((ph) => ph.steps.map((st) => st.id)));
  // "This stops the bid" is only true where a way in is closed, on any read, after answers.
  const closedWay = read.paths.some((p) => p.state === "no_go");
  const limits = read.limits.map((c) => {
    const cell = c.fix && !onPage.has(c.fix.step) ? { ...c, fix: undefined } : c;
    return cell.kind === "blocker" && !closedWay ? { ...cell, kind: "risk" as const } : cell;
  });
  // "Grant can help" only where the chat holds something for the step (D-D2).
  const helped = plan.map((ph) => ({
    ...ph,
    steps: ph.steps.map((s) =>
      s.action?.kind === "rail" ||
      !s.owners?.some((o) => o === "grant_help" || o === "grant_drafts")
        ? s
        : {
            ...s,
            owners: (() => {
              const rest = (s.owners ?? []).filter(
                (o) => o !== "grant_help" && o !== "grant_drafts",
              );
              return rest.length ? rest : (["you"] as StepOwner[]);
            })(),
          },
    ),
  }));
  return {
    ...read,
    prepare,
    strengths: closed ? [] : read.strengths,
    // A Skip page keeps a missing or lapsed registration, which blocks every bid, but not a
    // renewal date tied to this forecast's window.
    limits: closed
      ? []
      : read.call === "skip"
        ? limits.filter((c) => !SKIP_DROPS.has(c.title))
        : limits,
    unknowns: closed
      ? []
      : read.call === "skip"
        ? read.unknowns.filter((u) => u.couldChangeCall)
        : read.unknowns,
    win: quiet ? [] : read.win,
    plan: helped,
    timeline: read.timeline
      .filter((m) => !closed || m.kind === "past" || m.kind === "today")
      .map((m) => (m.kind === "today" ? { ...m, label: prepare ?? "" } : m)),
  };
}

/** Grant's read of a forecast, built by rule. The customer's answers apply before the
 *  call shapes the page, so an answer that moves the call also moves what the page shows
 *  (§5.0). */
export function readForecast(
  f: ScoredForecast,
  answers: Record<string, string> = {},
  take: ForecastTakeResponse | null = null,
): ForecastRead {
  return withTake(readWithoutTake(f, answers), take, f);
}

/** Adds Grant's take to How to win it and Sources, and to nothing else. The rows go
 *  after the read's own rows and follow the call, so a Skip or Closed page hides them
 *  as it hides every B8 row. The take never moves the call, a path or a gap (D-C4). */
function withTake(
  read: ForecastRead,
  take: ForecastTakeResponse | null,
  f: ScoredForecast,
): ForecastRead {
  const quiet = read.call === "skip" || read.call === "closed";
  const rows = quiet ? [] : takeWinRows(take, f);
  if (rows.length === 0) return read;
  const win = [...read.win, ...rows];
  const sources = [...new Set([...read.evidence.sources, ...takeSources(win)])];
  return { ...read, win, evidence: { ...read.evidence, sources } };
}

function readWithoutTake(f: ScoredForecast, answers: Record<string, string>): ForecastRead {
  return shape(applyAnswers(deriveRead(f), answers));
}

function matches(effect: AnswerEffect, value: string): boolean {
  const { equals, above, atMost } = effect.when;
  if (equals !== undefined) return value === equals;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || value.trim() === "") return false;
  if (above !== undefined) return n > above;
  if (atMost !== undefined) return n <= atMost;
  return false;
}

/** Layers the customer's answers onto the read. Nothing is written without an answer,
 *  and "Not sure" changes nothing (inference proposes, authority writes). */
export function applyAnswers(read: ForecastRead, answers: Record<string, string>): ForecastRead {
  const answered = read.rail.questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== "Not sure",
  );
  if (answered.length === 0) return read;

  let paths = read.paths.map((p) => ({ ...p }));
  let limits = [...read.limits];
  let plan = read.plan.map((ph) => ({ ...ph, steps: [...ph.steps] }));

  // Every effect whose condition matches applies, in order.
  for (const [q, effect] of answered.flatMap((q) =>
    q.effects.filter((e) => matches(e, answers[q.id])).map((e) => [q, e] as const),
  )) {
    void q;
    if (effect.addLimit) limits.push(effect.addLimit);
    // An answer cannot remove a warning or a step the page owns.
    if (effect.removeLimit && !PAGE_CARD_TITLES.has(effect.removeLimit))
      limits = limits.filter((c) => c.title !== effect.removeLimit);
    if (effect.removeStep && !REGISTRATION_STEPS.has(effect.removeStep))
      plan = plan.map((ph) => ({
        ...ph,
        steps: ph.steps.filter((s) => s.id !== effect.removeStep),
      }));
    for (const next of [...(effect.path ? [effect.path] : []), ...(effect.morePaths ?? [])])
      paths = paths.map((p) => (p.key === next.key ? { ...next, best: p.best } : p));
    if (effect.best) paths = paths.map((p) => ({ ...p, best: p.key === effect.best }));
    if (effect.firstStep) {
      const id = effect.firstStep;
      const from = plan.find((ph) => ph.steps.some((s) => s.id === id));
      const step = from?.steps.find((s) => s.id === id);
      if (from && step && plan[0]) {
        plan = plan.map((ph) => ({ ...ph, steps: ph.steps.filter((s) => s.id !== id) }));
        plan[0] = { ...plan[0], steps: [step, ...plan[0].steps] };
      }
    }
  }

  // No answer opens a way in that the facts close.
  if (read.eligibility) paths = clampPaths(paths, read.eligibility, read.paths);
  // Confidence rises only when every question has a real answer and, taken together, they
  // moved a way in.
  const pathChanged = paths.some(
    (p, i) => p.state !== read.paths[i].state || !!p.best !== !!read.paths[i].best,
  );
  const answeredIds = new Set(answered.map((q) => q.id));
  const allAnswered = read.rail.questions.every((q) => answeredIds.has(q.id));
  const level = LEVELS.indexOf(read.confidence);
  const confidence =
    allAnswered && pathChanged ? LEVELS[Math.min(LEVELS.length - 1, level + 1)] : read.confidence;
  // A fixed step points nowhere once its gap is gone.
  const titles = new Set(limits.map((c) => c.title));
  plan = plan.map((ph) => ({
    ...ph,
    steps: ph.steps.map((s) =>
      s.forWhat?.verb === "fixes" && !titles.has(s.forWhat.what) ? { ...s, forWhat: undefined } : s,
    ),
  }));

  return {
    ...read,
    paths,
    // The note explains a closed prime path; once an answer opens it, the note goes.
    pathsNote: paths[0]?.state === "no_go" ? read.pathsNote : undefined,
    call: callFromPaths(paths, read.call !== "closed"),
    // Grant stays waiting while every way in that is not closed still waits unchanged.
    waiting:
      read.waiting &&
      paths.some((p) => p.state !== "no_go") &&
      paths
        .filter((p) => p.state !== "no_go")
        .every((p) => {
          const before = read.paths.find((x) => x.key === p.key);
          return before && p.state === before.state && p.why === before.why;
        })
        ? read.waiting
        : undefined,
    limits,
    plan,
    confidence,
  };
}

/** What a customer can see change: the call, the tiles, confidence, waiting, the gaps,
 *  the unknowns and the steps. The chat compares it before and after an answer. */
export function readSignature(read: ForecastRead): string {
  return JSON.stringify([
    read.call,
    read.confidence,
    read.waiting ?? null,
    read.paths.map((p) => [p.key, p.state, p.why, !!p.best]),
    read.limits.map((c) => [c.kind, c.title]),
    read.unknowns.map((u) => u.label),
    read.plan.map((ph) => [ph.id, ph.when, ph.steps.map((s) => s.id)]),
  ]);
}

/** Whether any open question could move a way in, so answering could raise confidence. */
export function canRaiseConfidence(read: ForecastRead, open: RailQuestion[]): boolean {
  return (
    read.call !== "closed" &&
    open.some((q) => q.effects.some((e) => e.path || (e.morePaths?.length ?? 0) > 0 || e.best))
  );
}

export function planSteps(read: ForecastRead): PlanStep[] {
  return read.plan.flatMap((ph) => ph.steps);
}

/** Only real tasks count. An "if" step waits for its event (v4 decision 9). */
export function countedSteps(read: ForecastRead): PlanStep[] {
  return planSteps(read).filter((s) => s.kind === "task");
}

/** Numbers the counted steps 1, 2, 3 across phases, so a limit can point at one. */
export function stepNumbers(read: ForecastRead): Map<string, number> {
  return new Map(countedSteps(read).map((s, i) => [s.id, i + 1]));
}

/** Start here is always the first unfinished step, so the two cannot disagree. */
export function nextMove(read: ForecastRead, done: ReadonlySet<string>): PlanStep | null {
  return countedSteps(read).find((s) => !done.has(s.id)) ?? null;
}
