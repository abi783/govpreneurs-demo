// The words on Grant's side of a forecast page, in one place (D-E4). The forecast
// page mirrors the Grant page on Opportunities, so these follow its labels wherever
// the meaning is the same, and say something new only where a forecast differs.
//
// v5: every box answers one question, and each heading says which one. A fact is
// written out in one box only (v5 §02), so there is no copy here that repeats a box.
//
// Rules this file is held to: scripts/check-plain-english.ts. Government terms sit
// in a `term` slot, under the plain words that say what they mean.

export type ForecastCall = "prepare" | "review" | "skip" | "closed";
export type PathKey = "prime" | "teaming" | "subcontract";
export type PathState = "go" | "not_yet" | "not_needed" | "no_go";
export type Confidence = "high" | "medium" | "low";

/** The call, in the same chip as Bid on Opportunities. A forecast cannot be bid yet,
 *  so the words say what to do with the time instead. */
export const CALL: Record<ForecastCall, { word: string; tone: "ok" | "warn" | "skip" | "quiet" }> =
  {
    prepare: { word: "Prepare", tone: "ok" },
    review: { word: "Needs review", tone: "warn" },
    skip: { word: "Skip", tone: "skip" },
    // Live, the only way a forecast leaves "open" is its expected date passing.
    closed: { word: "Expected date passed", tone: "quiet" },
  };

export const PATH: Record<PathKey, { term: string; plain: string }> = {
  prime: { term: "Prime path", plain: "You lead" },
  teaming: { term: "Teaming path", plain: "You lead, with a partner" },
  subcontract: { term: "Subcontract path", plain: "Another company leads" },
};

export const PATH_ORDER: PathKey[] = ["prime", "teaming", "subcontract"];

/** The path tiles when a forecast is planned for a program set-aside she does not hold
 *  (rule 7a). A forecast is the buyer's plan, so the words say "today" and the note says
 *  the plan can change. The states stay No-go: no read opens a way the facts close. */
export const PROGRAM_PATHS = {
  prime: (program?: string) => `The buyer plans this for ${program ?? "certified"} firms today.`,
  teaming: (program?: string) =>
    program ? `You cannot lead without ${program}.` : "You cannot lead without the certificate.",
  subcontract: "A certified company could lead. None is known yet.",
  note: "A forecast is a plan. The buyer can change who may bid before it posts. Today your way in is as a subcontractor to a certified company.",
};

export const PATH_STATE: Record<PathState, string> = {
  go: "Go",
  not_yet: "Not yet",
  not_needed: "Not needed",
  no_go: "No-go",
};

export const CONFIDENCE_WORD: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Grant's read: the call, the two columns, Still unknown and How to win it. */
export const TAKE = {
  label: "Grant's read",
  call: "Grant's call",
  confidence: "Confidence",
  raise: "Answer Grant's questions to raise it",
  answerQuestions: "Answer Grant's questions",
  bestWayIn: "Best way in",
  noDate: "No date yet",
  likes: "What works for you",
  limits: "What holds you back",
  noLikes: "Nothing stands out as a strength yet.",
  noLimits: "Nothing is holding this one back yet.",
  canFix: "Can fix",
  step: (n: number) => `Get ready step ${n}`,
  /** A read that cannot judge yet names the one detail it is waiting on. */
  waiting: (detail: string) => `Waiting on ${detail}.`,
  weighGap: "Read what holds you back, then decide.",
  /** A starter answer when Grant waits on a detail only the customer can add. */
  fillIn: (detail: string) =>
    `Fill in ${detail.replace(", in My Business", "")} in My Business. Then I can judge this one.`,
  waitingOn: {
    buy: "what they will buy",
    who: "who may bid",
    certs: "your certificates, in My Business",
    small: "whether you are small for this work, in My Business",
    states: "the states you serve, in My Business",
    place: "where the work will happen",
    work: "what the work includes",
    size: "how big the job is",
    pastJobs: "your past job sizes, in My Business",
    more: "more details from the buyer",
  },
  stepLabel: (n: number) => `Go to Get ready step ${n}`,
};

/** The "watch" chip and the track line are promises, so their words live in
 *  watchCopy.ts's WATCH_PROMISE, one set per watch state (grant.ts `unknownChip`). */
export const UNKNOWN_COPY = {
  title: "Still unknown",
  how: {
    posts: "Shown in the bid request",
    ask_office: "Ask the office",
    ask_them: "Ask them",
    ask_contact: "Ask your contact",
    grant_checks: "Grant checks",
  },
};

/** How to win it: the only box about rivals and the price to beat (v5 box 8). */
export const WIN = {
  title: "How to win it",
  rows: {
    pick: "How they pick",
    rivals: "Who you compete with",
    takes: "What it takes",
    won: "Who has won work like this",
    paid: "What work like this was worth",
    office: "This office's record",
  },
  seeContract: "See the contract",
};

/** The B8 rows Grant's take adds: figures counted over public records, each with its
 *  basis and its source. A count is never a fact about this forecast (ledger A3), and
 *  nothing here says who will bid. */
export const TAKE_COPY = {
  unit: {
    awards: (n: number) => (n === 1 ? "award" : "awards"),
    firms: (n: number) => (n === 1 ? "firm" : "firms"),
    forecasts: (n: number) => (n === 1 ? "forecast" : "forecasts"),
  },
  won: (n: number) =>
    n === 1
      ? "**1 firm** has won comparable awards."
      : `**${n} firms** have won comparable awards.`,
  topFirms: (names: string, one: boolean) =>
    `${one ? "The firm" : "The firms"} with the most of these awards: ${names}.`,
  /** `m` is the median as printed, such as "4" or "1.5"; only "1" is singular. */
  offers: (m: string) => `These awards got a median of ${m} ${m === "1" ? "offer" : "offers"}.`,
  paid: (median: string) => `Comparable awards had a median value of **${median}**.`,
  band: (low: string, high: string) => `The middle half ran from ${low} to ${high}.`,
  compare: {
    below: "The buyer's estimate is below the middle half of these awards.",
    inside: "The buyer's estimate is inside the middle half of these awards.",
    above: "The buyer's estimate is above the middle half of these awards.",
    overlaps: "The buyer's estimate overlaps the middle half of these awards.",
    spans: "The buyer's estimate spans the whole middle half of these awards.",
  },
  compareWhy: (estimate: string, n: number, band: string) =>
    `Compares the buyer's estimate, ${estimate}, with the middle half of ${n} comparable awards, ${band}. Neither is a price paid.`,
  range: (low: string, high: string) => (low === high ? low : `${low} to ${high}`),
  // The office's awards are read in no date order, so this never says "the last". When
  // the read stopped at its scan cap, E is what was read, and the office holds more.
  setAside: (s: number, e: number, capped: boolean) =>
    capped
      ? `**${s} of ${e}** awards read for this office carried a set-aside. The office has at least ${e} awards on record.`
      : `**${s} of ${e}** ${e === 1 ? "award" : "awards"} on record for this office carried a set-aside.`,
  upcoming: (n: string, naics: string | null, bold: boolean) => {
    const count = bold ? `**${n}**` : n;
    const other = n === "1" ? "other active forecast" : "other active forecasts";
    return `This office has ${count} ${other} ${naics ? `in NAICS ${naics}` : "in this trade"}.`;
  },
  atLeast: (n: number) => `at least ${n}`,
  basis: (count: string, matchedOn: string, years: string | null) =>
    `${count} counted. Matched on: ${matchedOn}.${years ? ` Award years: ${years}.` : ""}`,
  /** The register's own lag note, when it names one, goes after the date. */
  source: (origin: string, asOf: string, lag?: string) =>
    `Source: ${origin}, ${asOf}.${lag ? ` ${lag}` : ""}`,
  /** What a row's counts are over (ledger A3). Each note is true only of its own count. */
  note: {
    awards: "These counts are over past award records, not over this forecast.",
    setAside: "The set-aside count is over this office's past awards, not over this forecast.",
    forecasts: "The forecast count is over this office's other active forecasts, not this one.",
  },
};

/** The registration gap, from the member's government registration (FAR 52.204-7). */
export const REGISTRATION = {
  title: {
    not_registered: "No active registration found",
    lapsed: "Registration has lapsed",
    unknown_end: "Registration end date not known",
    ends_soon: "Registration ends too soon",
  },
  notRegistered: "You need an **active registration** to send a price. Check SAM.gov to be sure.",
  lapsed: "**Renew it** before you send a price. Check SAM.gov to be sure.",
  unknownEnd: "We could not read when it ends. **Check SAM.gov** before you send a price.",
  endsSoon: (on: string) =>
    `It ends **${on}**. It must be active when you send a price and at award.`,
  endsSoonFar: (on: string) => `It ends **${on}**. Renew it every year until the contract ends.`,
  term: "SAM.gov",
};

/** Size: a small-business or program set-aside needs her to be small for its code. */
export const SIZE = {
  title: "Check you are small for this work",
  body: (naics: string | null) =>
    `Size limits depend on the industry code${naics ? ` ${naics}` : ""}. Use your **average yearly sales over 5 years**, or average workers over 24 months. Count linked companies.`,
  term: "SBA size standards",
};

/** Cards the page adds to every read, like the registration and size cards. */
export const PAGE_CARD = {
  partner: {
    title: "A partner can cost you this job",
    body: "It is kept for small businesses. A partner that does the main work can **cost you your small business status**. A small business of the same kind does not.",
    term: "Limitations on subcontracting",
  },
  cyber: {
    title: "Defense buyers may need a cyber check",
    body: "Many Defense contracts need a **basic cyber security self-check, posted in SPRS**, before award. Ask the office if this one does.",
    term: "CMMC Level 1",
  },
  bonds: {
    title: "This building job needs bonds",
    body: "Federal building jobs over $150,000 need **payment and performance bonds**. Talk to a surety company now.",
    term: "Miller Act bonds",
  },
};

/** Source names. A chip and the Sources line use the same words (B15). */
export const SOURCE_NAME = {
  agencyForecast: "The agency forecast",
  lastContract: "The last contract",
  registration: "Your registration",
  myBusiness: "My Business",
  awardRecords: "Federal award records",
  officeRecord: "Contracting office award history",
  officeForecasts: "The office's other forecasts",
};

export const READY = {
  title: "Get ready",
  askGrant: "Ask Grant",
  done: (d: number, n: number) => `${d} of ${n} done`,
  start: "Start here",
  ifStep: "If",
  mark: (title: string) => `Mark done: ${title}`,
  unmark: (title: string) => `Mark not done: ${title}`,
  notCounted: "Not counted until it happens",
  owner: {
    you: "You",
    grant_help: "Grant can help",
    grant_drafts: "Grant drafts it",
    you_send: "You send it",
  },
  forVerb: { for: "For:", fixes: "Fixes:", tests: "Tests:" },
};

export const JOB = {
  fact: {
    value: "Estimated value",
    place: "Place",
    whoMayBid: "Who may bid",
    contact: "Contact",
    office: "Office that buys it",
    boughtBefore: "Bought before",
  },
  replaces: "Yes. It replaces a current contract.",
};

export const TIMELINE = {
  title: "Timeline",
  today: "Today",
  prepare: (span: string) => `${span} to prepare`,
  /** When the date is the buyer's and may be the award or start, not the bid request. */
  untilDate: (span: string) => `${span} until the buyer's date`,
  bidLikely: "Bid request likely",
  /** From the buyer's own forecast record. */
  bidExpected: "Bid request expected",
  bidWasExpected: "Bid request was expected",
  awardExpected: "Award expected",
  /** A date we estimated. The buyer gave none. */
  estimatedDate: "Estimated date",
  mayBeOut: "The bid request may already be out",
  untilBid: (span: string) => `${span} until the bid request they expect`,
  untilEstimate: (span: string) => `${span} until this estimate`,
  asap: "as soon as you can",
  forecastUpdated: "Forecast last updated",
  buyersDate: "The buyer's date",
  canRunUntil: "Current contract can run until",
  contractStarts: "Current contract starts",
  months: (n: number) => `About ${n} months`,
  weeks: (n: number) => `About ${n} ${n === 1 ? "week" : "weeks"}`,
};

/** What a member can search a publisher's site for. */
export type SearchWhat = "title" | "number" | "both";

function searchWhat(what: SearchWhat): string {
  if (what === "both") return "their title or this number";
  return what === "title" ? "their title" : "this number";
}

/** Forecast source: who published the forecast, and the one link to open it. */
export const ORIGIN = {
  title: "Forecast source",
  publishedBy: (name: string) => `Published by ${name}`,
  number: (n: string) => `Forecast number ${n}`,
  their: (title: string) => `Their title: ${title}`,
  posted: (on: string) => `Posted ${on}`,
  /** posted_date is the latest version's date on a federal forecast. */
  updated: (on: string) => `Last updated ${on}`,
  open: {
    forecast: "Open the forecast",
    meetings: "Open their meetings page",
    purchase: "Open the purchase record",
  },
  meetingsNote: (meetingOn: string | null) =>
    meetingOn
      ? `The link opens their meetings page, not one file. Look for the meeting of ${meetingOn}.`
      : "The link opens their meetings page, not one file.",
  purchaseNote: "The link opens the state's record of this purchase.",
  noLink: "There is no public link to this forecast.",
  searchHint: (what: SearchWhat, publisher: string) =>
    `Search the ${publisher} website for ${searchWhat(what)}.`,
  /** With a department forecast site: "Search the " + link + " for …". */
  searchSiteBefore: "Search the ",
  siteName: (department: string) => `${department} forecast site`,
  searchSiteAfter: (what: SearchWhat) => ` for ${searchWhat(what)}.`,
  /** The tooltip on a publisher name that links to its department's forecast site. */
  siteTitle: (department: string) => `Open the ${department} forecast site`,
};

export const EVIDENCE = {
  divider: "The details behind my read",
  lastBid: "The last bid request",
  buyerWords: "What the record says",
  documents: "Documents in the record",
  documentsNote: "The files the buyer posted with this record. They are on their meetings page.",
  sources: "Sources",
  lastChecked: (on: string) => `Last checked ${on}`,
  link: {
    bid: "The last bid request",
    contract: "The contract award",
  },
};

export const RAIL = {
  /** Put in a draft where My Business holds no name or address, so she fills it in. */
  yourBusiness: "[your business name]",
  yourAddress: "[your business address]",
  open: "Open Grant",
  ask: "Ask Grant",
  role: "· your bid analyst",
  ready: "ready",
  collapse: "Close Grant",
  assumed: (what: string) => `Your details on My Business say ${what}`,
  correct: "Correct this",
  empty: "I have no questions for you on this one.",
  pick: "Pick a question below.",
  youSaid: (value: string) => `You said: ${value}. Pick again to change it.`,
  gotNoChange: (noun: string, value: string) =>
    `Got it. ${noun}: ${value}. Nothing on the page changes.`,
  reverted: (noun: string) =>
    `That is fine. I took back your earlier answer about ${noun.toLowerCase()}. The page changed back.`,
  change: "Change this answer",
  stillNeed: (nouns: string) => `I still need: ${nouns}. Answer any time to raise my confidence.`,
  /** When no open question can move a way in, answering cannot raise confidence. */
  stillNeedPlain: (nouns: string) => `I would still like to know: ${nouns}.`,
  questionOf: (i: number, n: number) => `Question ${i} of ${n}`,
  skipQuestion: "Skip this question",
  moneyLabel: "Your price, in dollars",
  moneySend: "Send your price",
  got: (noun: string, value: string) => `Got it. ${noun}: ${value}. I updated the page.`,
  notSureReply: "That is fine. Nothing on the page changes.",
  done: "That is everything I need. The page shows my best read.",
  copy: "Copy the email",
  copied: "Copied",
  notSure: "Not sure",
};

/** Grant's free-text chat on a forecast. No value names a deadline, a due date or a close. */
export const RAIL_CHAT = {
  label: "Ask Grant about this forecast",
  placeholder: "Ask Grant about this forecast…",
  send: "Send to Grant",
  thinking: "Grant is thinking…",
  failed: "Grant could not answer — try again",
  intro:
    "I answer only about this forecast, from its record, its files and your My Business details. If I do not know, I say so.",
};

export const MEET = {
  role: "Reads one job end to end. Tells you how to go after it.",
  say: (title: string) =>
    `Hunter, who finds work for you, put ${title} in front of you. I read it with your profile. Where past bid requests and contracts exist, I read those too. Every point names the records it comes from.`,
  /** The tracking promise that may follow is WATCH_PROMISE[state].boundsPromise. */
  bounds:
    "Two things I cannot do. I cannot know who will bid until the bids are in. And a forecast is a plan, not a promise. It can move or be cancelled.",
  cta: "Show me the analysis",
  close: "Close Grant's introduction",
};

export const MENTOR = {
  button: "Review with a Mentor",
  reviewing: "Mentor reviewing · open the review in Mentors",
  responded: "Mentor responded · open the reply in Mentors",
  closed: "Mentor review closed · open the review in Mentors",
};
