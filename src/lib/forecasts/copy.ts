// The words a member reads on Forecasts, in one place (D-E4). The tabs, the card
// chips, the forecast page and Hunter's answers all read from here, so the four time
// definitions cannot drift apart.
//
// Rules this file is held to: scripts/check-plain-english.ts. Government terms only
// ever appear in a `term` slot, under a plain sentence that says what they mean.

import { money } from "../money";

import type { UnsupportedFilter, UnsupportedFilterKey } from "./hunterFilters";
// DEMO: the code example uses the member's own trade (D85).
import { byMember } from "../../demo/member";
const CODE_EXAMPLE = byMember({ caterer: "7223 does not show 722310.", agency: "5418 does not show 541810." });

const DAY_MS = 24 * 60 * 60 * 1000;

export type CaptureStatus = "act_now" | "start_capture" | "position_early" | "watch";

/** Capture Status — the clock, and nothing else (Hunter Match Score PRD §11.1).
 *  `when` is shown wherever the status is. `advice` is shown only on the tabs: on a
 *  single forecast Hunter's verdict gives the advice, and a generic "Get ready now"
 *  under a weak fit would contradict him. */
export const CAPTURE_STATUS: Record<
  CaptureStatus,
  { label: string; when: string; advice: string }
> = {
  act_now: { label: "Act now", when: "Opens within 45 days", advice: "Get ready now." },
  start_capture: {
    label: "Start capture",
    when: "Opens in 46 to 120 days",
    advice: "Meet the buyer. Find partners.",
  },
  position_early: {
    label: "Position early",
    when: "Opens in 121 to 365 days",
    advice: "Get your papers and past jobs ready.",
  },
  watch: {
    label: "Watch",
    when: "More than a year away, or no date yet",
    advice: "Nothing to do yet. Track it to keep it on your saved list.",
  },
};

export const CAPTURE_ORDER: CaptureStatus[] = [
  "act_now",
  "start_capture",
  "position_early",
  "watch",
];

export const LIST_COPY = {
  loading: "Loading",
  /** Fixed, so no backend detail reaches the page. The failure is ours, not her filters'. */
  loadError: "We could not load forecasts. The problem is on our side, not your filters.",
  title: "Forecasts",
  intro: "Work the government plans to buy. Hunter checks each one against your business.",
  question: "When will they ask for bids?",
  all: { label: "All", when: "Every forecast", advice: "Best match first" },
  searchPlaceholder: "Search by work, place or buyer",
  searchLabel: "Search forecasts",
  laneQuestion: "Who is buying?",
  hunterLine:
    "I rank these for your business. Some titles are my plain words. Where the buyer gave a title, it is on the forecast page.",
  noResults: "No forecasts match your search. Try a shorter word.",
  clearSearch: "Clear the search",
  views: { forYou: "Forecasts for you", all: "All forecasts", saved: "Saved" },
  moreInAll: (n: number) =>
    `${n} more ${n === 1 ? "forecast is" : "forecasts are"} in All forecasts.`,
  moreWhy: "Hunter has not matched them to your business, or it rates them a weak fit.",
  seeAll: "See all forecasts",
  noSaved: "You have not saved a forecast yet. Tap the bookmark on one to save it.",
  loadingMore: "Loading more forecasts",
  /** Fixed, like `loadError`. The forecasts already on the page stay. */
  moreError: "We could not load more forecasts. The problem is on our side.",
};

/** The Filters menu and the Sort control on the list, in the Opportunities shape. */
export const FILTERS = {
  button: "Filters",
  open: "Open filters",
  refine: "Refine",
  title: "Filters",
  close: "Close filters",
  sortLabel: "Sort",
  sortAria: "Sort forecasts",
  sort: {
    match: "Best match",
    soonest: "Opening soonest",
    newest: "Newly posted",
    value: "By value",
  },
  sections: {
    what: { label: "Kind of work", sub: "What the buyer wants done" },
    where: { label: "Where", sub: "The states you serve, or the states and cities you choose" },
    fit: { label: "Who may bid and size", sub: "Who can bid, and how big the job is" },
    timing: {
      label: "Timing and history",
      sub: "When the buyer published it and expects to post it, bought before, and open or closed",
    },
  },
  labels: {
    work: "Kind of work",
    place: "Place",
    who: "Who may bid",
    size: "Estimated value",
    bought: "Bought before",
    status: "Status",
    expected: "Expected posting date",
    valueRange: "Exact value range",
    states: "States",
    cities: "Cities",
    naics: "NAICS codes",
    postedWithin: "Posted by the buyer",
  },
  work: {
    food: "Food and catering",
    building: "Building and repairs",
    sites: "Running sites and events",
    other: "Other work, or not shared",
  },
  workGloss: "Grouped from the industry code the buyer chose.",
  naicsGloss:
    "NAICS is the industry code the buyer chose for the work. A forecast is shown only when its code is exactly one you choose.",
  naicsNote:
    `While you choose a code, a forecast with no industry code is not shown. A code matches exactly, so ${CODE_EXAMPLE} These codes and Kind of work both apply.`,
  naicsSearch: "Search a code or an industry",
  noNaics: "No forecast carries an industry code",
  place: { any: "Anywhere", served: "States you serve" },
  placeGloss: "Your states come from My Business.",
  statesGloss: "The state where the work will happen, as the buyer names it.",
  citiesGloss:
    "The city where the work will happen, as the buyer names it. If you choose states, only the cities in those states are shown.",
  placeNote:
    "While you choose a state or a city, a forecast that names no place is not shown. If you choose states and cities, a city counts only inside a chosen state. These and States you serve all apply.",
  statesSearch: "Search a state",
  citiesSearch: "Search a city",
  noStates: "No forecast names a state",
  noCities: "No forecast names a city here",
  forecastCount: (n: number) => `${n} ${n === 1 ? "forecast" : "forecasts"}`,
  /** A state, city or NAICS list while the counts for the current choices load. */
  optionsPending: "Counting the forecasts for these choices.",
  /** A state, city or NAICS list after the counts for the current choices failed. */
  optionsFailed: "The counts for these choices did not load.",
  who: {
    small: "Small businesses only",
    undecided: "Not decided yet",
    program: "Kept for a small business program",
    not_shared: "Not shared",
  },
  whoGloss: "Some work is kept for one kind of business, like women-owned businesses.",
  size: {
    any: "Any size",
    under_250k: "Under $250K",
    "250k_1m": "$250K to $1M",
    "1m_5m": "$1M to $5M",
    over_5m: "Over $5M",
  },
  sizeGloss: "The top of the buyer's estimate. A forecast with no estimate is not shown.",
  valueRangeGloss:
    "Whole dollars. A forecast is shown when the buyer's estimate overlaps this range. If the estimate has one figure, that figure is used.",
  valueRangeNote:
    "While a range is set, a forecast with no estimate is not shown. This range and Estimated value both apply.",
  bought: { any: "Any", again: "Bought again", new: "New work" },
  boughtGloss: "Bought again means another company does this work for them now.",
  status: { any: "Include closed", open: "Open only" },
  expected: {
    this_week: "In the next 7 days",
    "2_weeks": "In the next 14 days",
    "30_days": "In the next 30 days",
    "60_plus": "In 60 days or more",
  },
  expectedGloss:
    "The date the buyer expects to post the request for bids. If a forecast has no expected date, or its date has passed, it is not shown.",
  postedWithin: {
    any: "Any date",
    days: (n: number) => `Last ${n} ${n === 1 ? "day" : "days"}`,
  },
  postedWithinGloss: "The day the buyer published this forecast record.",
  postedWithinNote:
    "While a choice is set, a forecast with no posted date is not shown. This is the day the buyer published the record, not the day bids open.",
  clearAll: "Clear all",
  noMatch: "No forecasts match these filters.",
  show: (n: number) => `Show ${n} ${n === 1 ? "forecast" : "forecasts"}`,
  /** The Show button while the count for the new choices is not back yet. */
  showPending: "Show forecasts",
};

export type Lane = "all" | "federal" | "sled";

export const LANE_LABEL: Record<Lane, string> = {
  all: "All buyers",
  federal: "Federal",
  sled: "State and local",
};

export type FitTier = "best" | "good" | "possible" | "weak" | "cannot_bid";

export const FIT_LABEL: Record<FitTier, string> = {
  best: "Best fit",
  good: "Good fit",
  possible: "Possible fit",
  weak: "Weak fit",
  cannot_bid: "You cannot bid",
};

export const LIFECYCLE_LABEL = {
  /** A forecast past its expected date. It is not closed: the bid request may still post. */
  passed: "Expected date passed",
};

/** The top block of the card, lifted from the Hunter opportunity card. */
export const KICKER = {
  fits: "Why Hunter thinks this fits",
  take: "Hunter's take",
};

/** The card's fit chip: the tier of her match row, in three verdict groups. */
export const FIT_CHIP: Record<"bid" | "lean" | "pass", string> = {
  bid: FIT_LABEL.good,
  lean: FIT_LABEL.possible,
  pass: FIT_LABEL.weak,
};

/** The fact grid on the card. Every label carries a plain definition on tap. */
export const GRID = {
  buyer: { label: "Buyer", gloss: "The government office that plans to buy this." },
  value: {
    label: "Estimated value",
    gloss: "What the buyer expects to spend. It is an estimate, not a price.",
  },
  place: { label: "Place", gloss: "Where the work will happen." },
  expected: {
    label: "Expected",
    gloss: "The date the buyer gave. It can be when bids open, or when the work starts.",
  },
  whoMayBid: {
    label: "Who may bid",
    gloss: "Some work is kept for one kind of business, like women-owned businesses.",
  },
  boughtBefore: {
    label: "Bought before",
    gloss: "If they bought this before, another company does this work for them now.",
  },
  foundIn: { label: "Found in", gloss: "The public record where this plan was found." },
};

export const NOT_SHARED = "Not shared";

export const WHO_MAY_BID = {
  undetermined: { text: "Not decided yet", term: "Set-aside: TBD" },
  notShared: { text: "Not shared", term: null },
  local: { text: "Not shared", note: "Local buyers rarely say this early." },
  smallBusiness: { text: "Small businesses only", term: "Set-aside: total small business" },
  smallBusinessPart: {
    text: "Partly kept for small businesses",
    term: "Set-aside: partial small business",
  },
  program: {
    text: (who: string) => `Kept for ${who}. You do not hold that certificate.`,
    term: (name: string) => `Set-aside: ${name}`,
  },
  programOneCompany: {
    text: (who: string) => `Planned for one chosen company among ${who}`,
    term: (name: string) => `Set-aside: ${name} sole source`,
  },
  held: {
    text: (who: string) => `Kept for ${who}, and you hold that certificate`,
    term: (name: string) => `Set-aside: ${name}`,
  },
  programOneHeld: {
    text: (who: string) =>
      `Planned for one chosen company among ${who}. You hold that certificate.`,
  },
  programUnknown: {
    text: (who: string) =>
      `Kept for ${who}. Add your certificates to My Business to see if you qualify.`,
  },
  /** The buyer's own record says the work will not be competed. */
  notCompeted: {
    text: (incumbent: string | null) =>
      incumbent
        ? `Not open to bids. The buyer plans to give it to ${incumbent}.`
        : "Not open to bids. The buyer plans to give it to one company.",
    term: "Competition: no",
  },
  /** The buyer's own record names a contract only its holders can order under. */
  vehicleOnly: {
    text: (vehicle: string) => `Only companies on the ${vehicle} contract can bid`,
    term: "Contract vehicle",
  },
  /** An undecided set-aside whose last contract was 8(a). */
  likely: (text: string) => `Likely ${text.charAt(0).toLowerCase()}${text.slice(1)}`,
  likelyWhy: "The last contract was 8(a). Work stays in 8(a) unless SBA releases it.",
  unlisted: {
    text: "Kept for some businesses. Ask the office which.",
    term: (code: string) => `Set-aside code: ${code}`,
  },
};

export const BOUGHT_BEFORE = {
  again: { text: "Yes, bought again", term: "Recompete" },
  isNew: { text: "The agency marks this as new", term: null },
  notShared: { text: "Not shared", term: null },
};

/** The forecast page. */
export const DETAIL = {
  back: "Back to forecasts",
  track: "Track this",
  tracked: "Tracked",
  // The Track tooltip is a promise: WATCH_PROMISE[state].trackTooltip in watchCopy.ts.
  ourRead: "Our read",
  ourReadLegend: "means we worked this out. The buyer did not say it.",
  notFound: "We cannot find this forecast. It may have been removed.",
  notFoundBack: "Back to all forecasts",
  walletError: "Couldn't load your wallet balance — try again",
  loadError: "We could not load this forecast. The problem is on our side.",
  /** Why the mentor control is off. A forecast's date is the expected posting date, not a deadline. */
  mentorTooLate: (leadMs: number) =>
    `The expected posting date is less than ${Math.round(leadMs / DAY_MS)} days away. A mentor cannot review it in time.`,
};

export const PRECISION_NOTE = {
  exact: "The buyer gave this date.",
  month: "The date is the first or last day of a month. We read it as the whole month.",
  quarter: "The date starts or ends a quarter. We read it as the whole quarter.",
  fiscalYear:
    "The date starts or ends a fiscal year. Buyers use such a date when they have no real date. We read it as the whole year.",
  calendarYear:
    "The date starts or ends a calendar year. Buyers use such a date when they have no real date. We read it as the whole year.",
  budgetYear:
    "The date ends a budget year. Buyers use such a date when they have no real date. We read it as the 12 months that end on it.",
  season: "From the buyer's own words. We count from the middle of that time.",
  estimate: "An estimate. The buyer did not give a date.",
  none: "The buyer has not given a date.",
};

export const PLACE_FROM_BUYER =
  "The record gives only the state. The town comes from the buyer's name.";

export const UNKNOWN = {
  whoMayBid: "Who may bid",
  date: "When, and if, a bid request posts",
  work: "What the work includes",
  contact: "Who to contact",
  place: "Where the work will happen",
  value: "How much they will spend",
  lastContract: "Who had the last contract",
  blindVendors: "If a program for blind vendors has first claim",
  abilityOne: "If a program that employs people with disabilities has first claim",
  onSite: "If the work is done on site",
};

/** A note that says what a mandatory source means for the customer. */
export const UNKNOWN_NOTE = {
  mandatory: "If it does, the work can go to that program without a bid.",
};

/** Why-lines under Hunter's verdict. */
export const REASON = {
  inArea: "In a state you serve",
  outOfArea: (state: string) => `${state} is outside your area`,
  outOfAreaMany: (states: string) => `${states} are outside your area`,
  noPlace: "No place shared yet",
  rightSize: "The right size for your business",
  tooBig: "Much bigger than your biggest past job",
  small: (value: string) => `A small job: ${value}`,
};

/** Hunter's reading of a live forecast, worked out from its record and the member's match. */
export const LIVE = {
  work: {
    own: "The kind of work you do",
    close: "Close to the work you do",
    outside: "Not your kind of work",
  },
  /** "But" before the first thing against. A state's name keeps its capital. */
  but: (reason: string) =>
    `But ${/^(No|Much|A|Not|The|Close)\b/.test(reason) ? reason.charAt(0).toLowerCase() + reason.slice(1) : reason}`,
  untitled: "A forecast with no title",
  /** The kind of public record a local forecast came from, from its source type. */
  found: {
    "Agendas / Minutes": "A public meeting's agenda or minutes",
    "Expiring Contract": "A contract that is ending",
  } as Record<string, string>,
};

/** Grant's call on a forecast past its expected date. A forecast is never "closed". */
const EXPECTED_DATE_PASSED =
  "The expected date has passed. The bid request may already be posted, or may not come.";

/** The verdict sentence, fit first and time second. */
export const VERDICT = {
  cannotBid: "You cannot bid on this one.",
  closed: EXPECTED_DATE_PASSED,
  stale: EXPECTED_DATE_PASSED,
  thin: "I cannot judge this one yet. The record says too little.",
  weak: (reason: string) => `Weak fit for you. ${reason}.`,
  timeAnyDay: "It could open any day.",
  timeWeeks: (weeks: number) => `It opens in about ${weeks} ${weeks === 1 ? "week" : "weeks"}.`,
  timeMonthsReady: (months: number) => `You have about ${months} months to get ready.`,
  timeMonths: (months: number) => `It opens in about ${months} months.`,
  timeNone: "The buyer has not given a date.",
};

/** Next steps. Each names the thing it does (D-E7). */
export type EmailPitch =
  | { kind: "held" }
  | { kind: "certs"; names: string }
  | { kind: "small" }
  | { kind: "unknown" };

/** Certificate names, as the government writes them. */
export const CERT_NAME: Record<string, { term: string }> = {
  "8a": { term: "8(a)" },
  hubzone: { term: "HUBZone" },
  sdvosb: { term: "SDVOSB" },
  vosb: { term: "VOSB" },
  wosb: { term: "WOSB" },
  edwosb: { term: "EDWOSB" },
};

export const STEP = {
  renew: {
    title: "Renew your government registration",
    titleYearly: "Renew your government registration, then every year",
    first: (ends: string) =>
      `renew your government registration. It ends ${ends}, before this is expected to open.`,
    firstLapsed: "renew your government registration. It has lapsed.",
    body: (ends: string) => `It ends ${ends}. Renew it at least 30 days before then.`,
    bodyLapsed: "It has lapsed. Renew it before you send a price.",
    term: "SAM.gov",
    href: "https://sam.gov/",
    cta: "Open SAM.gov",
  },
  register: {
    title: "Register your business to sell to the government",
    first: "register your business to sell to the government. You need it to send a price.",
    body: "You need an active registration before you send a price.",
    term: "SAM.gov",
    href: "https://sam.gov/",
    cta: "Open SAM.gov",
  },
  checkRegistration: {
    title: "Check when your government registration ends",
    first: "check when your government registration ends. We could not read the date.",
    body: "We could not read the date. It must be active when you send a price.",
    term: "SAM.gov",
    href: "https://sam.gov/",
    cta: "Open SAM.gov",
  },
  lastContract: {
    title: "Look at the last contract",
    first: (company: string) => `look at the last contract. ${company} held it.`,
    body: (company: string) => `See ${company}'s award and its top value.`,
    cta: "See the last contract",
  },
  partner: {
    title: "Find a bigger company to work with",
    first: "find a partner. You could do part of the work for a bigger company.",
    body: "You would do part of the work for them.",
    href: "/partners",
    cta: "See companies that win this work",
  },
  emailBuyer: {
    title: (contact: string) => `Email ${contact}, the buyer's contact`,
    /** What to tell the buyer. It names only what My Business records. */
    say: (pitch: EmailPitch) =>
      pitch.kind === "held"
        ? "Say you hold the certificate this work is planned for."
        : pitch.kind === "certs"
          ? `Say you are certified as ${pitch.names}, and can do this work.`
          : pitch.kind === "small"
            ? "Say you are a small business that can do this work."
            : "Say your business can do this work.",
    first: (contact: string, pitch: EmailPitch) =>
      `email ${contact}, the buyer's contact. ${STEP.emailBuyer.say(pitch)}`,
    body: {
      undetermined:
        "They have not decided who may bid. Hearing from businesses like yours helps them decide.",
      not_shared: "They have not shared who may bid. Hearing from businesses helps them decide.",
      held8a:
        "The agency offers it to SBA, which accepts one 8(a) company. Tell the office and your SBA specialist you are certified.",
      heldOther:
        "The office picks one company only when it expects no second certified bidder. Tell them you are certified.",
    },
    specialist: (name: string) => `Copy their small business specialist, ${name}.`,
    cta: (contact: string) => `Email ${contact}`,
  },
  meeting: {
    title: (body: string, on: string) => `Go to the ${body} meeting on ${on}`,
    first: (body: string, on: string) =>
      `the ${body} discusses this on ${on}. The meeting is open to the public.`,
    body: "Public meetings are open to everyone. You can hear how they plan to buy this. After a bid request posts, contact only the buyer it names.",
    bodyElsewhere: (body: string) =>
      `Find this meeting on the ${body} website. After a bid request posts, contact only the buyer it names.`,
    cta: "Open their meetings page",
  },
};

/** The one chip a card shows for its first step. */
export const STEP_CHIP = {
  renew: "Renew your registration first",
  register: "Register to sell to the government first",
  checkRegistration: "Check your registration date first",
  partner: "You would likely need a partner",
  meeting: (on: string) => `Public meeting on ${on}`,
  email_buyer: "Talk to the buyer",
};

export const NO_DATE = "No date yet";

export const TAB_NOTE = {
  emptyTab: "No forecasts in this group right now.",
  showAll: "Show all forecasts",
};

export const DETAIL_MORE = {
  valueLocal: "Taken from a budget line. It may cover more than this one purchase.",
  valueLocalShort: "From a budget line, maybe more than this job",
  readRecord: "Read what the record says",
  titleOnly: "The agency has shared only the title so far.",
  quoteCite: "The buyer's words",
  summaryCite: "A summary of the public record, not the buyer's own words",
  meetingOf: (on: string) => `Meeting of ${on}`,
  item: (item: string) => `Item ${item}`,
  contactRole: (name: string, role: string) => `${name}, ${role}`,
};

/** Grant's derived answer to "What should I do first?", built in the engine. */
export const ASK = {
  doNothing: "Nothing yet. Track this forecast to keep it on your saved list.",
};

/** Plain words for the values of the filters that carry ids, not words. A value
 *  that is not here is shown as Hunter sent it. On a forecast, the date is the
 *  expected posting date, so the window words never say "deadline" or "due". */
const FILTER_VALUE_WORDS: Partial<Record<UnsupportedFilterKey, Record<string, string>>> = {
  setAsides: {
    SB: "small business",
    "8A": "8(a)",
    WOSB: "women-owned (WOSB)",
    HUBZone: "HUBZone",
    VOSB: "veteran-owned (VOSB)",
    NATIVE_TRIBAL: "Native American or tribal",
    FULL_OPEN: "open to all",
  },
  dueWindow: {
    this_week: "within 7 days",
    "2_weeks": "within 14 days",
    "30_days": "within 30 days",
    "60_plus": "60 days or more from now",
  },
  categories: {
    contract: "open bids",
    product_buy: "product buys",
    grant: "grants",
  },
  noticeTypes: {
    solicitation: "solicitation",
    rfp: "request for proposal",
    rfq: "request for quote",
    combined: "combined synopsis",
    sources_sought: "sources sought",
    rfi: "request for information",
    presol: "presolicitation",
    special: "special notice",
  },
  vehicles: { idiq: "IDIQ", bpa: "BPA", matoc: "MATOC", future: "future vehicle" },
};

/** The values of one unsupported filter, in plain words. A switch has none. */
function filterValueWords(f: UnsupportedFilter): string | null {
  if (f.key === "dodOnly" || f.key === "civilianOnly") return null;
  if (f.key === "postedWithin") return `last ${f.value} days`;
  if (f.key === "valueRange") {
    const { min, max } = f.value;
    if (min != null && max != null) return `${money(min)} to ${money(max)}`;
    return min != null ? `at least ${money(min)}` : `up to ${money(max as number)}`;
  }
  const words = FILTER_VALUE_WORDS[f.key] ?? {};
  return f.value.map((v) => words[v] ?? v).join(", ");
}

/** The line under Hunter's reply that names the filters this list did not apply.
 *  It has no link: the opportunities feed cannot take filters from a URL. */
export const HUNTER_FILTER_NOTE = {
  label: {
    states: "State",
    cities: "City",
    setAsides: "Set-aside",
    valueRange: "Value",
    dueWindow: "Expected posting date",
    naics: "NAICS code",
    noticeTypes: "Notice type",
    categories: "Type of work",
    vehicles: "Contract vehicle",
    postedWithin: "Posted",
    dodOnly: "Defense buyers only",
    civilianOnly: "Civilian buyers only",
  } satisfies Record<UnsupportedFilterKey, string>,
  /** Names each filter with its values. Empty when every filter applied. */
  line(unsupported: UnsupportedFilter[]): string {
    // sources.test.ts calls every copy function with sample strings to scan its
    // words. A value that is not a list gives no line.
    if (!Array.isArray(unsupported) || unsupported.length === 0) return "";
    const parts = unsupported.map((f) => {
      const words = filterValueWords(f);
      return words
        ? `${HUNTER_FILTER_NOTE.label[f.key]}: ${words}`
        : HUNTER_FILTER_NOTE.label[f.key];
    });
    return (
      `This list did not use these filters: ${parts.join("; ")}. ` +
      "You can set them on the opportunities feed."
    );
  },
};
