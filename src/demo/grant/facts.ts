// DEMO: the facts Grant and the opportunity page work from.
//
// Every number and name here is derived from the story (persona, places,
// opportunities, clock). Nothing is typed twice: if the story changes, the page,
// the documents and Grant's analysis change with it.

import { byMember } from "@/demo/member";
import { deadlineDate, deadlineIso, postedDate, postedIso } from "./calendar";
import {
  getOpportunity,
  OPPORTUNITIES,
  type SetAside,
  type StoryOpportunity,
} from "@/demo/story/opportunities";
import { SET_ASIDES } from "@/demo/story/setAsides";
import {
  KEY_PARTNER,
  MENTOR,
  PAST_PERFORMANCE, findPastPerformance,
  PAST_PERFORMANCE_ROLES,
  PERSONA,
  type PastPerformance,
} from "@/demo/story/persona";
import { PLACES, type Place } from "@/demo/story/places";

// ── The member's own record, read from the story ─────────────────────────

const pp = (id: PastPerformance["id"]): PastPerformance => {
  const found = findPastPerformance(id);
  if (!found) throw new Error(`No past performance ${id} in the story`);
  return found;
};

/** The four past jobs, by name. */
export const PP = {
  county: pp(PAST_PERFORMANCE_ROLES.county),
  cdg: pp(PAST_PERFORMANCE_ROLES.cdg),
  church: pp(PAST_PERFORMANCE_ROLES.church),
  womack: pp(PAST_PERFORMANCE_ROLES.womack),
};

/** The customer's name without the agency tail: "Womack Army Medical Center". */
export const customerShort = (p: PastPerformance): string => p.customerName.split(",")[0].replace(/ \(prime\)$/, "");

// The caterer's trade facts below (meals, guests, cooks, certificates) are read only
// by caterer content. Words the generator shares between members are in vocab.ts.

/** Meals a day the kitchen has cooked, from the persona: 1100. */
export const MEALS_PER_DAY = Number(
  (/([\d,]+) meals a day/.exec(PERSONA.differentiators[0]) ?? [, "1100"])[1].replace(/,/g, ""),
);

/** "80 to 400 guests", from the church job. */
export const EVENT_RANGE = ((m) => (m ? `${m[1]} to ${m[2]} guests` : "events of many sizes"))(
  /from (\d+) to (\d+) guests/.exec(PP.church.scopeDescription),
);

export const MENTOR_FIRST = MENTOR.firstName;
export const MENTOR_NAME = MENTOR.name;
export const PARTNER = KEY_PARTNER;

/** Staff on the payroll. */
export const STAFF = PERSONA.employeesW2;
/** Holders of a food-handler certificate, and how many cooks she has. A trade with no such certificate has no gap. */
export const COOKS = STAFF;
export const CERTIFIED = PERSONA.foodHandlerCertified ?? 0;
export const UNCERTIFIED = PERSONA.foodHandlerCertified === undefined ? 0 : COOKS - CERTIFIED;

// ── Money, dates and words ───────────────────────────────────────────────

/** 660000 → "$660K", 2000000 → "$2M", 1150000 → "$1.15M". */
export function usd(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${Number.isInteger(m) ? m : Number(m.toFixed(2))}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `$${Number.isInteger(k) ? k : Number(k.toFixed(1))}K`;
  }
  return `$${Math.round(n)}`;
}

/** A rounded amount for "about" sentences: 161667 → "$160K", 2.04M → "$2M", 733333 → "$730K". */
export function usdAbout(n: number): string {
  if (n >= 1_000_000) return usd(Math.round(n / 100_000) * 100_000);
  if (n >= 100_000) return usd(Math.round(n / 10_000) * 10_000);
  if (n >= 10_000) return usd(Math.round(n / 1_000) * 1_000);
  return usd(n);
}

/** "June 14, 2026". */
export function longDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** "Jun 14". */
export function shortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const numWord = (n: number): string => NUMBER_WORDS[n] ?? String(n);

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Whole days from now to an ISO time, rounded up. The page counts days this way. */
export function liveDaysTo(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ── Set-asides ───────────────────────────────────────────────────────────

export const SET_ASIDE_LABEL: Record<NonNullable<SetAside>, string> = Object.fromEntries(
  Object.entries(SET_ASIDES).map(([c, s]) => [c, s.label]),
) as Record<NonNullable<SetAside>, string>;

export const SET_ASIDE_SHORT: Record<NonNullable<SetAside>, string> = Object.fromEntries(
  Object.entries(SET_ASIDES).map(([c, s]) => [c, s.short]),
) as Record<NonNullable<SetAside>, string>;

// ── Term of the contract ─────────────────────────────────────────────────

const WORD_TO_N: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

/** Years in the contract, base plus options, read from the buyer's own summary. */
export function parseTermYears(opp: StoryOpportunity): number {
  if (opp.noticeType === "Sources Sought") return 0;
  const m =
    /(?:base year|one(?:-| )(?:school )?year(?: contract)?)[^.]*?\b(one|two|three|four|five)\b (?:option|renewal)/i.exec(
      opp.summary,
    );
  if (m) return 1 + WORD_TO_N[m[1].toLowerCase()];
  if (/\b(?:12|twelve) months\b|\bnext school year\b/i.test(opp.summary)) return 1;
  if (/\btwo years\b/i.test(opp.summary)) return 2;
  return 3;
}

export function termText(years: number): string {
  if (years <= 1) return "one year";
  const opts = years - 1;
  return `a base year and ${numWord(opts)} option year${opts === 1 ? "" : "s"}`;
}

// ── Contracting officers (fictional) ─────────────────────────────────────
//
// One person works for one office. A buyer's team is chosen by the buyer, never
// by the opportunity alone, so the same name never shows for the Army on one
// page and the Navy on the next. Where the Government Buyers page names an
// office's people, the same people appear here (src/demo/explore/buyersData.ts).

interface Person {
  name: string;
  title: string;
}

/** Army buyers. The order is fixed: the three hero opportunities pick from it. */
const ARMY_TEAM: Person[] = [
  { name: "Denise Harrow", title: "Contracting Officer" },
  { name: "Martin Whitfield", title: "Contract Specialist" },
  { name: "Beatrice Calhoun", title: "Contracting Officer" },
  { name: "Terrence Boyle", title: "Contract Specialist" },
  // The agency's owner is Dana Okafor, so its Army buyer must not share her name.
  { name: byMember({ pack: "Janelle Ostrander", caterer: "Janelle Okafor" }), title: "Contracting Officer" },
  { name: "Gregory Lindqvist", title: "Contract Specialist" },
];

const FEDERAL_TEAMS: { match: RegExp; team: Person[] }[] = [
  {
    match: /Navy/i,
    team: [
      { name: "Dolores Ainsley", title: "Contracting Officer" },
      { name: "Colleen Pruitt", title: "Contracting Officer" },
      { name: "Isaiah Greer", title: "Contract Specialist" },
      { name: "Tobias Sandoval", title: "Contract Specialist" },
    ],
  },
  {
    match: /Air Force/i,
    team: [
      { name: "Harlan Vance", title: "Contracting Officer" },
      { name: "Priscilla Odom", title: "Contract Specialist" },
      { name: "Warren Teague", title: "Contract Specialist" },
    ],
  },
  {
    match: /Veterans/i,
    team: [
      { name: "Lorraine Dubois", title: "Contracting Officer" },
      { name: "Walter Nakamura", title: "Contracting Officer" },
      { name: "Kevin Adeyemi", title: "Contract Specialist" },
    ],
  },
  {
    match: /General Services/i,
    team: [
      { name: "Dale Harmon", title: "Contracting Officer" },
      { name: "Jun Tanaka", title: "Contract Specialist" },
    ],
  },
];

/** State and local buyers that the Government Buyers page already names. */
const LOCAL_TEAMS: Record<string, Person[]> = {
  "City of Fayetteville, NC": [
    { name: "Dominic Reyes", title: "Contracting Officer" },
    { name: "Ayesha Khan", title: "Contract Specialist" },
  ],
  "Cumberland County, NC": [
    { name: "Calvin Moore", title: "Contracting Officer" },
    { name: "Joy Mathis", title: "Contract Specialist" },
  ],
  "Cumberland County Schools, NC": [
    { name: "Gordon Yates", title: "Contracting Officer" },
    { name: "Tamika Bell", title: "Small-Business Liaison" },
  ],
  "North Carolina National Guard": [
    { name: "Beth Anne Parrish", title: "Contracting Officer" },
    { name: "Curtis Lowe", title: "Small-Business Liaison" },
  ],
  "Public Schools of Robeson County, NC": [
    { name: "Terrence Bullard", title: "Contracting Officer" },
    { name: "Patricia Lowry", title: "Small-Business Liaison" },
  ],
  "Durham County, NC": [
    { name: "Edward Kincaid", title: "Contracting Officer" },
    { name: "Monica Alvarez", title: "Small-Business Liaison" },
  ],
};

const LOCAL_FIRST = [
  "Patricia", "Howard", "Angela", "Samuel", "Lorraine", "Vernon", "Marisol", "Desmond", "Rosalie", "Everett", "Nadine",
  "Clifton", "Imani", "Warren", "Delphine", "Raymond", "Joanna", "Lamar", "Cecilia", "Boyd", "Tessa", "Alvin",
];
const LOCAL_LAST = [
  "Dunmore", "Kessler", "Pruitt", "Oyelaran", "Beaudry", "Whitlock", "Espinoza", "Garrity", "Thornton", "Abernathy", "Castellano",
  "Hollis", "Mbeki", "Sturgis", "Lavoie", "Penrose", "Valdez", "Rutledge", "Kimura", "Fontaine", "Ashworth", "Delacroix",
];
const LOCAL_TITLES = ["Purchasing Manager", "Procurement Officer", "Buyer III", "Procurement Specialist"];

/** The agencies of the story that no team names yet, in story order. Each gets two people of its own. */
function otherLocalAgencies(): string[] {
  const seen: string[] = [];
  for (const o of OPPORTUNITIES) {
    if (o.scope === "sled" && !LOCAL_TEAMS[o.agency] && !seen.includes(o.agency)) seen.push(o.agency);
  }
  return seen;
}

function teamFor(opp: StoryOpportunity): Person[] {
  if (opp.scope === "fed") return FEDERAL_TEAMS.find((t) => t.match.test(opp.agency))?.team ?? ARMY_TEAM;
  const named = LOCAL_TEAMS[opp.agency];
  if (named) return named;
  // 22 first names and 22 last names. A step of 5 through the last names (5 and 22 share no factor) pairs each first name with its own last name.
  const k = Math.max(0, otherLocalAgencies().indexOf(opp.agency));
  const person = (i: number, title: string): Person => ({
    name: `${LOCAL_FIRST[i % LOCAL_FIRST.length]} ${LOCAL_LAST[(i * 5 + 3) % LOCAL_LAST.length]}`,
    title,
  });
  return [person(2 * k, LOCAL_TITLES[k % LOCAL_TITLES.length]), person(2 * k + 1, "Purchasing Agent")];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const AREA_CODE: Record<string, string> = {
  Fayetteville: "910", "Fort Bragg": "910", "Pope Army Airfield": "910", "Hope Mills": "910",
  "Camp Mackall": "910", Lumberton: "910", Wilmington: "910", Jacksonville: "910",
  Goldsboro: "919", Raleigh: "919", Durham: "919", "Chapel Hill": "919",
  Greensboro: "336", Salisbury: "704", Charlotte: "704", Havelock: "252",
  Norfolk: "757", "Virginia Beach": "757", Hampton: "757", Charleston: "843",
  "North Charleston": "843", Augusta: "706", "Fort Stewart": "912",
};

export interface Contact {
  name: string;
  title: string;
  phone: string;
  email: string;
}

function emailDomain(opp: StoryOpportunity): string {
  const slug = opp.agency
    .replace(/,.*$/, "")
    .replace(/^(Department of the|Department of|City of|County of|Public Schools of)\s+/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "agency"}.example`;
}

/** The buying office's contact. Fictional: the name, phone number and email are made up. */
export function contactFor(opp: StoryOpportunity, secondary = false): Contact {
  const pool = teamFor(opp);
  // The first contact is picked by the opportunity. The second is the next person on the same team.
  const base = hash(opp.id) % pool.length;
  const idx = secondary ? (base + (pool.length > 3 ? 3 : 1)) % pool.length : base;
  const p = pool[idx];
  const place = PLACES[opp.place];
  const area = AREA_CODE[place.city] ?? "910";
  const last = String(100 + (hash(`${opp.id}${secondary}`) % 90)).padStart(4, "0");
  const words = p.name.toLowerCase().split(" ");
  return {
    name: p.name,
    title: p.title,
    phone: `(${area}) 555-${last}`,
    email: `${words[0]}.${words[words.length - 1]}@${emailDomain(opp)}`,
  };
}

// ── The facts of one opportunity ─────────────────────────────────────────

export interface OppFacts {
  opp: StoryOpportunity;
  id: string;
  place: Place;
  miles: number;
  placeText: string;
  /** Years in the contract. 0 for a notice that is not a contract (sources sought). */
  years: number;
  mid: number | null;
  /** Yearly value. For a total-value notice this is the total divided by the years. */
  annual: number | null;
  /** Yearly value as a share of the member's yearly revenue. */
  share: number | null;
  valueText: string;
  setAside: SetAside;
  setAsideLabel: string;
  eligibleSetAside: boolean;
  /** Days left on the clock the page uses (rounds up from now). */
  daysLeft: number;
  closesAtISO: string;
  postedAtISO: string;
  closes: Date;
  posted: Date;
  contact: Contact;
  secondContact: Contact;
  isFederal: boolean;
  isSourcesSought: boolean;
  isSealedBid: boolean;
}

export function factsFor(opp: StoryOpportunity): OppFacts {
  const place = PLACES[opp.place];
  const years = parseTermYears(opp);
  const mid = opp.valueLow !== null && opp.valueHigh !== null ? Math.round((opp.valueLow + opp.valueHigh) / 2) : null;
  const annual =
    mid === null ? null : opp.valueBasis === "per_year" ? mid : Math.round(mid / Math.max(years, 1));
  const closesAtISO = deadlineIso(opp.closesInDays);
  const postedAtISO = postedIso(opp.postedDaysAgo);
  const valueText =
    opp.valueLow === null || opp.valueHigh === null
      ? "No value stated"
      : `${usd(opp.valueLow)} to ${usd(opp.valueHigh)}${opp.valueBasis === "per_year" ? " a year" : ""}`;
  return {
    opp,
    id: opp.id,
    place,
    miles: place.milesFromBase,
    placeText: `${place.city}, ${place.state}`,
    years,
    mid,
    annual,
    share: annual === null ? null : annual / PERSONA.annualRevenue,
    valueText,
    setAside: opp.setAside,
    setAsideLabel: opp.setAside ? SET_ASIDE_LABEL[opp.setAside] : "Full and open competition (no set-aside)",
    eligibleSetAside: opp.setAside === null || (PERSONA.setAsideEligibility as readonly string[]).includes(opp.setAside),
    daysLeft: liveDaysTo(closesAtISO),
    closesAtISO,
    postedAtISO,
    closes: deadlineDate(opp.closesInDays),
    posted: postedDate(opp.postedDaysAgo),
    contact: contactFor(opp),
    secondContact: contactFor(opp, true),
    isFederal: opp.scope === "fed",
    isSourcesSought: opp.noticeType === "Sources Sought",
    isSealedBid: opp.noticeType === "Invitation for Bid",
  };
}

export function factsById(id: string): OppFacts | null {
  const opp = getOpportunity(id);
  return opp ? factsFor(opp) : null;
}

/** "about a third of your yearly revenue" and similar, from a share. */
export function shareWords(share: number): string {
  if (share >= 2) return `${Math.round(share * 10) / 10} times your yearly revenue`;
  if (share >= 1.15) return `${Math.round(share * 10) / 10} times your yearly revenue`;
  if (share >= 0.95) return "about the same as your yearly revenue";
  if (share >= 0.7) return "most of your yearly revenue";
  if (share >= 0.55) return "more than half your yearly revenue";
  if (share >= 0.45) return "about half your yearly revenue";
  if (share >= 0.3) return "about a third of your yearly revenue";
  if (share >= 0.2) return "about a quarter of your yearly revenue";
  if (share >= 0.12) return "about a seventh of your yearly revenue";
  return "a small part of your yearly revenue";
}

/** Drive time in words, from miles: "about 55 minutes", "about 2 hours". */
export function driveText(miles: number): string {
  if (miles <= 5) return "a few minutes";
  if (miles <= 20) return `about ${Math.round(miles * 1.4 + 3)} minutes`;
  if (miles <= 60) return `about ${Math.round(miles * 1.15)} minutes`;
  const hours = Math.round((miles / 52) * 2) / 2;
  return `about ${hours} hours`;
}
