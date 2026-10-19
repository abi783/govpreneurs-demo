// DEMO (Hunter chat): read what the member asks the feed to change.
// One sentence may hold several changes ("woman-owned under $500K near
// Fayetteville"), so this file reads them all and returns one filter change.

import type { HunterFilterDelta } from "../../../lib/hunterChat";
import { money } from "../../../lib/money";
import { PERSONA } from "../../story/persona";
import { OPPORTUNITIES } from "../../story/opportunities";
import { PLACES } from "../../story/places";
import { stateName } from "../../../lib/vocab/usStates";
import { VOCAB } from "../vocab";

export interface ParsedFilters {
  delta: HunterFilterDelta;
  /** Nouns for the reply: "woman-owned (WOSB) set-asides". */
  nouns: string[];
  /** Phrases that follow the noun: "under $500K", "in Virginia". */
  mods: string[];
  /** A set-aside the member asked for but does not hold. */
  notHers?: string;
}

/** "Showing woman-owned (WOSB) set-asides under $500K in Virginia." */
export function describeParsed(p: Pick<ParsedFilters, "nouns" | "mods">): string {
  const noun = p.nouns.length > 0 ? p.nouns.join(" and ") : "opportunities";
  return `Showing ${noun}${p.mods.length > 0 ? ` ${p.mods.join(" ")}` : ""}.`;
}

// ── Money ───────────────────────────────────────────────────────────────────

const AMOUNT = String.raw`\$?\s*(\d+(?:\.\d+)?)\s*(k|m|mm|million|mil|thousand|grand|g)?\b`;

/** "500k" → 500000. "1.5 million" → 1500000. "$750,000" is written "750000" by `normalize`. */
export function amountOf(num: string, unit?: string): number {
  const n = Number(num);
  const u = (unit ?? "").toLowerCase();
  if (u === "k" || u === "thousand" || u === "grand" || u === "g") return Math.round(n * 1_000);
  if (u === "m" || u === "mm" || u === "million" || u === "mil") return Math.round(n * 1_000_000);
  // A bare small number after a money word is thousands ("under 500" is rare); keep as written.
  return Math.round(n);
}

function valueDelta(
  norm: string,
): { range: { min: number | null; max: number | null }; text: string } | null {
  if (
    /\b(my|right|good) (size|range)\b|in my range|my sweet spot|jobs my size|size range/.test(norm)
  ) {
    return {
      range: { min: PERSONA.targetValueMin, max: PERSONA.targetValueMax },
      text: `in your ${money(PERSONA.targetValueMin)} to ${money(PERSONA.targetValueMax)} range`,
    };
  }
  const between = norm.match(
    new RegExp(String.raw`\b(?:between|from)\s+${AMOUNT}\s*(?:and|to|-)\s*${AMOUNT}`),
  );
  if (between) {
    const second = amountOf(between[3], between[4] ?? between[2]);
    const first = amountOf(between[1], between[2] ?? between[4]);
    const [min, max] = first <= second ? [first, second] : [second, first];
    return { range: { min, max }, text: `worth ${money(min)} to ${money(max)}` };
  }
  const max = norm.match(
    new RegExp(
      String.raw`\b(?:under|below|less than|up to|upto|at most|no more than|max|maximum|cheaper than|smaller than|not over|lower than|capped at)\s+${AMOUNT}`,
    ),
  );
  if (max) {
    const v = amountOf(max[1], max[2]);
    return { range: { min: null, max: v }, text: `under ${money(v)}` };
  }
  const min = norm.match(
    new RegExp(
      String.raw`\b(?:over|above|more than|at least|minimum|min|bigger than|larger than|greater than|starting at|exceeding)\s+${AMOUNT}`,
    ),
  );
  if (min) {
    const v = amountOf(min[1], min[2]);
    return { range: { min: v, max: null }, text: `over ${money(v)}` };
  }
  if (/\b(small|smaller|little) (jobs?|contracts?)\b|\bsmall ones\b/.test(norm)) {
    return { range: { min: null, max: 250_000 }, text: `under ${money(250_000)}` };
  }
  return null;
}

// ── Places ──────────────────────────────────────────────────────────────────

/** Places the member names as a city. */
const CITY_NAMES: { rx: RegExp; city: string }[] = [
  { rx: /\bfayetteville\b/, city: "Fayetteville" },
  { rx: /\bhope mills\b/, city: "Hope Mills" },
  { rx: /\blumberton\b/, city: "Lumberton" },
  { rx: /\bgoldsboro\b/, city: "Goldsboro" },
  { rx: /\braleigh\b/, city: "Raleigh" },
  { rx: /\bdurham\b/, city: "Durham" },
  { rx: /\bchapel hill\b/, city: "Chapel Hill" },
  { rx: /\bwilmington\b/, city: "Wilmington" },
  { rx: /\bjacksonville\b/, city: "Jacksonville" },
  { rx: /\bgreensboro\b/, city: "Greensboro" },
  { rx: /\bsalisbury\b/, city: "Salisbury" },
  { rx: /\bcharlotte\b/, city: "Charlotte" },
  { rx: /\bnorfolk\b/, city: "Norfolk" },
  { rx: /\bvirginia beach\b/, city: "Virginia Beach" },
  { rx: /\bnorth charleston\b/, city: "North Charleston" },
  { rx: /\bcharleston\b/, city: "Charleston" },
  { rx: /\baugusta\b/, city: "Augusta" },
  { rx: /\bhavelock\b/, city: "Havelock" },
];

/** Places that are a base, not a city. A search on the name finds them. */
const INSTALLATIONS: { rx: RegExp; search: string }[] = [
  { rx: /\bfort bragg\b|\bft bragg\b|\bfort liberty\b/, search: "Fort Bragg" },
  { rx: /\bcamp mackall\b|\bmackall\b/, search: "Camp Mackall" },
  {
    rx: /\bpope army airfield\b|\bpope field\b|\bpope aaf\b|\bpope\b/,
    search: "Pope Army Airfield",
  },
  { rx: /\bcamp lejeune\b|\blejeune\b/, search: "Camp Lejeune" },
  { rx: /\bseymour johnson\b/, search: "Seymour Johnson" },
  { rx: /\bcherry point\b/, search: "Cherry Point" },
  { rx: /\bfort stewart\b/, search: "Fort Stewart" },
  { rx: /\bjoint base charleston\b/, search: "Joint Base Charleston" },
];

/** The cities that are no more than `miles` from the member's base, among the places her notices name. */
export function citiesWithin(miles: number): string[] {
  const used = new Set<string>(OPPORTUNITIES.map((o) => o.place));
  const out = new Set<string>();
  for (const [key, p] of Object.entries(PLACES)) {
    if (used.has(key) && p.milesFromBase <= miles && !/Multiple/.test(p.city)) out.add(p.city);
  }
  return [...out];
}

const NEAR_MILES = 15;

function stateCodes(raw: string, norm: string): string[] {
  const out = new Set<string>();
  const agencyWord = "(?:medical|hospital|health|center|nco|patient|office)";
  for (const [code, name] of [
    ["NC", "north carolina"],
    ["VA", "virginia"],
    ["SC", "south carolina"],
    ["GA", "georgia"],
  ] as const) {
    const wholeName = new RegExp(String.raw`\b${name}\b`);
    if (wholeName.test(norm)) {
      const west = name === "virginia" && /\bwest virginia\b/.test(norm);
      // "Virginia Beach" is a city, not the state.
      const beachOnly =
        name === "virginia" && /virginia beach/.test(norm) && !/\bvirginia\b(?! beach)/.test(norm);
      if (!west && !beachOnly) out.add(code);
      continue;
    }
    // The code, in capitals ("NC", "VA"), or in lower case after "in", "and", "or", "to".
    const caps = new RegExp(
      String.raw`(?:^|[^A-Za-z])${code}(?![A-Za-z])(?!\s+${agencyWord})`,
      "i",
    );
    const typedInCaps = new RegExp(
      String.raw`(?:^|[^A-Za-z])${code}(?![A-Za-z])(?!\s+${agencyWord})`,
    ).test(raw);
    const lower = new RegExp(
      String.raw`\b(?:in|and|or|to|only|for|around|across|within)\s+${code.toLowerCase()}\b(?!\s+${agencyWord})`,
    ).test(norm);
    void caps;
    if (typedInCaps || lower) out.add(code);
  }
  return [...out];
}

// ── The whole sentence ──────────────────────────────────────────────────────

const WINDOWS: [RegExp, string, string][] = [
  [
    /\b(this week|next week|7 days|seven days|within a week|in a week)\b/,
    "this_week",
    "closing within 7 days",
  ],
  [
    /\b(2 weeks|two weeks|14 days|fortnight|couple of weeks)\b/,
    "2_weeks",
    "closing within 2 weeks",
  ],
  [
    /\b(30 days|a month|this month|one month|4 weeks|four weeks)\b/,
    "30_days",
    "closing within 30 days",
  ],
  [
    /\b(60 days|two months|2 months|60\+|60 plus|plenty of time|lots of time|long runway)\b/,
    "60_plus",
    "closing in 60+ days",
  ],
];

/**
 * Reads every change the sentence asks for. `parts` names each in plain words.
 * An empty `delta` (and no `notHers`) means the sentence asks for none.
 */
export function parseFilters(raw: string, norm: string): ParsedFilters {
  const delta: HunterFilterDelta = {};
  const nouns: string[] = [];
  const mods: string[] = [];
  let notHers: string | undefined;

  // Set-asides
  if (/\b(sdvosb|veteran|vosb)\b/.test(norm) && !/veterans affairs/.test(norm))
    notHers = "veteran-owned (SDVOSB)";
  else if (/\b8\s?\(?a\)?\b|hubzone|hub zone|tribal|native american/.test(norm)) {
    notHers = /hubzone|hub zone/.test(norm)
      ? "HUBZone"
      : /tribal|native/.test(norm)
        ? "tribal"
        : "8(a)";
  }
  if (/\b(woman|women|wosb|edwosb)\b/.test(norm)) {
    delta.setAsides = ["WOSB"];
    nouns.push("woman-owned (WOSB) set-asides");
  } else if (/\bsmall business (set.?asides?|only|jobs)\b|\bsba set.?aside/.test(norm)) {
    delta.setAsides = ["SB"];
    nouns.push("small-business set-asides");
  } else if (
    /\bno set.?aside|open (competition|to all|to everyone)|full and open|unrestricted/.test(norm)
  ) {
    delta.setAsides = ["FULL_OPEN"];
    mods.push("with no set-aside");
  }

  // Buyer lane
  const search: string[] = [];
  if (
    /\b(state and local|state & local|state or local|sled|local government|municipal|county|school district|state agenc\w+|state (jobs?|work|contracts?|opportunities|buyers?|government))\b/.test(
      norm,
    )
  ) {
    delta.scope = { fed: false, sled: true };
    mods.push("from state and local buyers");
  } else if (/\b(federal|fed)\b/.test(norm) && !/\bnot federal\b/.test(norm)) {
    delta.scope = { fed: true, sled: false };
    mods.push("from federal buyers");
  } else if (/\b(all buyers|both federal and|every buyer|all kinds of buyers)\b/.test(norm)) {
    delta.scope = { fed: true, sled: true };
    mods.push("from all buyers");
  }
  if (/\barmy\b/.test(norm)) {
    search.push("Army");
    mods.push("from the Army");
  } else if (/\bnavy\b|\bmarines?\b/.test(norm)) {
    search.push("Navy");
    mods.push("from the Navy and Marine Corps");
  } else if (/\bair force\b/.test(norm)) {
    search.push("Air Force");
    mods.push("from the Air Force");
  } else if (/\bveterans affairs\b|\bva (hospital|medical|health)\b/.test(norm)) {
    search.push("Veterans Affairs");
    mods.push("from Veterans Affairs");
  }

  // Notice type
  if (/\bsources? sought\b/.test(norm)) {
    delta.noticeTypes = ["sources_sought"];
    nouns.push("Sources Sought notices");
  } else if (
    /\brfqs?\b|request for quotes?|\bquotes?\b(?! ?me)/.test(norm) &&
    /\b(show|only|just|find|filter|give)\b/.test(norm)
  ) {
    delta.noticeTypes = ["rfq"];
    nouns.push("requests for quote (RFQ)");
  } else if (
    /\brfps?\b|request for proposals?/.test(norm) &&
    /\b(show|only|just|find|filter|give)\b/.test(norm)
  ) {
    delta.noticeTypes = ["rfp"];
    nouns.push("requests for proposal (RFP)");
  }

  // Value
  const value = valueDelta(norm);
  if (value) {
    delta.valueRange = value.range;
    mods.push(value.text);
  }

  // Closing window
  if (/\b(clos\w*|due|deadline|deadlines|expir\w*|end\w*)\b/.test(norm)) {
    const hit = WINDOWS.find(([rx]) => rx.test(norm));
    if (hit) {
      delta.dueWindow = [hit[1]];
      mods.push(hit[2]);
    }
  }

  // Posted date
  if (
    /\b(what (has )?changed|any updates?|anything new|something new|what s different)\b/.test(
      norm,
    ) ||
    (/\b(new|newest|fresh|just posted|posted|brand new|latest|recent\w*)\b/.test(norm) &&
      /\b(this week|last week|since last week|past week|7 days|seven days|week|recent\w*|new|newest|fresh|latest|today|yesterday|3 days|three days)\b/.test(
        norm,
      ) &&
      !/\bnew business\b/.test(norm))
  ) {
    const days = /\btoday\b|\byesterday\b|\b1 day\b|\b24 hours\b/.test(norm)
      ? 1
      : /\b3 days\b|\bthree days\b/.test(norm)
        ? 3
        : /\bthis month\b|\b30 days\b|\bpast month\b|\blast month\b/.test(norm)
          ? 30
          : 7;
    delta.postedWithin = days;
    mods.push(
      days === 7
        ? "posted in the last 7 days"
        : days === 1
          ? "posted in the last day"
          : `posted in the last ${days} days`,
    );
  }

  // Places: installations first, then cities, then states
  const within = norm.match(/\bwithin\s+(\d{1,3})\s*(?:miles|mi)\b/);
  // "State and local" names a buyer lane, not a place near her.
  const placeWords = norm.replace(
    /\bstate (and|&|or) local\b|\blocal (government|buyers?)\b/g,
    " ",
  );
  const near =
    /\b(near|nearby|close to|closest|around|local|close by|around me|near me|near my (kitchen|office|studio|place)|short drive)\b/.test(
      placeWords,
    );
  const installation = INSTALLATIONS.find((i) => i.rx.test(norm));
  const cityHits = CITY_NAMES.filter((c) => c.rx.test(norm)).map((c) => c.city);
  if (installation && !(cityHits.includes("Fayetteville") && near)) {
    search.push(installation.search);
    mods.push(`at ${installation.search}`);
  } else if (within) {
    const miles = Number(within[1]);
    delta.cities = citiesWithin(miles);
    mods.push(`within ${miles} miles of your ${VOCAB.base}`);
  } else if (cityHits.length > 0 && near && cityHits.includes("Fayetteville")) {
    delta.cities = citiesWithin(NEAR_MILES);
    mods.push(`within ${NEAR_MILES} miles of your ${VOCAB.base} in ${PERSONA.hqCity}`);
  } else if (cityHits.length > 0) {
    delta.cities = cityHits;
    mods.push(`in ${cityHits.join(" and ")}`);
  } else if (
    near &&
    /\b(me|my kitchen|my office|my studio|my place|my area|my town|my location|close by|nearby|home)\b|^(show|find|give).*\b(near|nearby|local|close)\b/.test(
      placeWords,
    )
  ) {
    delta.cities = citiesWithin(NEAR_MILES);
    mods.push(`within ${NEAR_MILES} miles of your ${VOCAB.base}`);
  }
  const states = stateCodes(raw, norm).filter(() => !installation && !delta.cities);
  if (states.length > 0) {
    delta.states = states;
    mods.push(`in ${states.map((s) => stateName(s)).join(" and ")}`);
  }

  // Work type: the member's own work words, first match wins.
  const work = VOCAB.workTypes.find((w) => w.rx.test(norm));
  if (work) {
    if (work.naics) delta.naics = work.naics;
    if (work.search) search.push(work.search);
    nouns.push(work.noun);
  }

  if (search.length > 0) delta.search = [...new Set(search)].join(" ");
  return { delta, nouns, mods, notHers };
}

/** True when the delta changes nothing. */
export function isEmpty(d: HunterFilterDelta): boolean {
  return Object.keys(d).length === 0;
}
