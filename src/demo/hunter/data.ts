// DEMO (Hunter): the story's opportunities, shaped for the feed.
//
// Nothing here is typed twice. Every fact comes from `src/demo/story/*`. This
// file adds only what the feed needs on top: dates as ISO text, the filter ids
// the drawer sends, and a search text for each opportunity.

import { FOR_YOU, OPPORTUNITIES, type StoryOpportunity } from "../story/opportunities";
import { PLACES } from "../story/places";
import { SET_ASIDES } from "../story/setAsides";
import { stateName } from "../../lib/vocab/usStates";
import { getSavedOpps } from "../state/workspace";
import { deadlineIso, postedIso } from "./dates";
import { naicsDescription } from "./naicsData";
import { VOCAB } from "./vocab";

/** The three tabs of the feed. */
export type FeedTabId = "for_you" | "all" | "saved";

export interface FeedRow {
  o: StoryOpportunity;
  id: string;
  city: string;
  state: string;
  miles: number;
  zip?: string;
  postedAt: string;
  closesAt: string;
  low: number | null;
  high: number | null;
  /** The SAM set-aside code the card shows (story/setAsides.ts), or "". */
  setAside: string;
  /** The ids the drawer's set-aside filter uses. */
  setAsideIds: string[];
  /** The ids the drawer's notice-type filter uses. */
  noticeIds: string[];
  naicsLabel: string;
  /** The federal product and service code. */
  psc: string;
  isDod: boolean;
  /** Lower-case text that the search box looks through. */
  haystack: string;
  /** The words of the haystack, for whole-word matches of short search terms. */
  words: Set<string>;
}

const ZIPS: Record<string, string> = {
  Fayetteville: "28301",
  "Fort Bragg": "28310",
  "Pope Army Airfield": "28308",
  "Hope Mills": "28348",
  Lumberton: "28358",
  Goldsboro: "27530",
  Raleigh: "27601",
  Durham: "27701",
  "Chapel Hill": "27514",
  Wilmington: "28401",
  Jacksonville: "28540",
  Greensboro: "27401",
  Salisbury: "28144",
  Havelock: "28532",
  Charlotte: "28202",
  Norfolk: "23510",
  "Virginia Beach": "23456",
  Charleston: "29401",
  "North Charleston": "29405",
  Augusta: "30901",
};

const NOTICE_IDS: Record<string, string[]> = {
  "Request for Quote": ["rfq", "solicitation"],
  "Request for Proposal": ["rfp", "solicitation"],
  "Invitation for Bid": ["solicitation"],
  Solicitation: ["solicitation"],
  "Combined Synopsis/Solicitation": ["combined", "solicitation"],
  "Sources Sought": ["sources_sought"],
  "Special Notice": ["special"],
};

const SET_ASIDE_WORDS: Record<string, string> = Object.fromEntries(Object.entries(SET_ASIDES).map(([c, s]) => [c, s.words]));

/** The drawer's set-aside ids for a SAM code. */
const SET_ASIDE_IDS: Record<string, string[]> = Object.fromEntries(Object.entries(SET_ASIDES).map(([c, s]) => [c, s.filterIds]));

const DOD = /army|navy|air force|marine/i;

function build(o: StoryOpportunity): FeedRow {
  const place = PLACES[o.place];
  const setAside = o.setAside ?? "";
  const naicsLabel = naicsDescription(o.naics) ?? o.naics;
  const haystack = [
    o.title,
    o.plainTitle,
    o.agency,
    o.office,
    place.city,
    place.state,
    stateName(place.state),
    o.naics,
    naicsLabel,
    setAside ? SET_ASIDE_WORDS[setAside] : "full and open no set-aside",
    o.noticeType,
    o.scope === "fed" ? "federal" : "state local",
    o.summary,
    o.id,
  ]
    .join(" ")
    .toLowerCase();
  return {
    o,
    id: o.id,
    city: place.city,
    state: place.state,
    miles: place.milesFromBase,
    zip: ZIPS[place.city],
    postedAt: postedIso(o.postedDaysAgo),
    closesAt: deadlineIso(o.closesInDays),
    low: o.valueLow,
    high: o.valueHigh,
    setAside,
    setAsideIds: SET_ASIDE_IDS[setAside] ?? ["FULL_OPEN"],
    noticeIds: NOTICE_IDS[o.noticeType] ?? ["solicitation"],
    naicsLabel,
    psc: VOCAB.pscFor(o.naics),
    isDod: DOD.test(o.agency),
    haystack,
    words: new Set(haystack.split(/[^a-z0-9]+/).filter(Boolean)),
  };
}

let cache: FeedRow[] | null = null;

/** Every opportunity in the story, in story order. */
export function allRows(): FeedRow[] {
  // Dates are built once per page view; the clock does not move inside a view.
  cache ??= OPPORTUNITIES.map(build);
  return cache;
}

const BY_ID = (): Map<string, FeedRow> => new Map(allRows().map((r) => [r.id, r]));

export function rowById(id: string): FeedRow | undefined {
  return BY_ID().get(id);
}

/** The "Opportunities for you" tab, in Hunter's order. */
export function forYouRows(): FeedRow[] {
  return FOR_YOU.map((o) => rowById(o.id)!).filter(Boolean);
}

/**
 * The member's saved opportunities that the feed can draw, most recently saved
 * first. A saved key that is not a story opportunity (a forecast, a small
 * order) belongs to another page and stays out of this list.
 */
export function savedRows(): FeedRow[] {
  const keys = getSavedOpps();
  const rows: FeedRow[] = [];
  for (let i = keys.length - 1; i >= 0; i -= 1) {
    const row = rowById(keys[i]);
    if (row) rows.push(row);
  }
  return rows;
}

/** The rows that one tab starts from, before any filter. */
export function universe(tab: FeedTabId): FeedRow[] {
  if (tab === "for_you") return forYouRows();
  if (tab === "saved") return savedRows();
  return allRows();
}

/** Whole days since the notice was posted. */
export function postedAgo(row: FeedRow): number {
  return row.o.postedDaysAgo;
}
