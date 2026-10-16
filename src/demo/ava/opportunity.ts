// DEMO: Ava's view of an opportunity, read from the story.
//
// The prototype read a mock opportunity list (lib/mock/opportunities) and
// Grant's mock (lib/mock/grantAnalysis). The demo has one list of
// opportunities: src/demo/story/opportunities.ts. This file turns a story
// opportunity into the few fields Ava reads, so no Ava file types a title, a
// buyer, a value or a date of its own.

import { DEMO_TODAY } from "../story/clock";
import {
  AVA_BIDS as STORY_AVA_BIDS,
  OPPORTUNITIES,
  getOpportunity,
  type NoticeType,
  type StoryOpportunity,
} from "../story/opportunities";
import { PLACES } from "../story/places";

export type OppScope = "fed" | "sled";

export interface AvaOpportunity {
  noticeId: string;
  /** The title as the buyer posted it. */
  title: string;
  /** Hunter's plain-English title. */
  plainTitle: string;
  agency: string;
  subAgency?: string;
  closesAt: string;
  scope: OppScope;
  mode: "prime";
  noticeType: NoticeType;
  /** True for a sources sought: an information request, not a bid. */
  informational: boolean;
  category: "contract";
  setAside: string | null;
  valueLow: number | null;
  valueHigh: number | null;
  /** "Fort Bragg, NC". */
  location: string;
  closesInDays: number;
  /** Grant's call, in the words the prototype used. */
  grantCall: "Bid" | "Review" | "No Bid";
  /** Grant's one sentence. */
  grantLine: string;
}

/** Midnight at the start of day `n`, counted in calendar days from today. Not
 *  `n` times 24 hours: a clock change (on 1 November) makes a day 23 or 25
 *  hours long, and the date would move by one. The Hunter feed and the
 *  opportunity page count the same way, so every page says the same "N days
 *  left". The lead's `deadlineIso` in src/demo/story/clock.ts does the same
 *  on the main branch. */
export function deadlineIso(n: number): string {
  const t = DEMO_TODAY;
  return new Date(t.getFullYear(), t.getMonth(), t.getDate() + n, 0, 0, 0).toISOString();
}

const dueIso = deadlineIso;

const CALL = { bid: "Bid", review: "Review", no_bid: "No Bid" } as const;

function toAva(o: StoryOpportunity): AvaOpportunity {
  const place = PLACES[o.place];
  return {
    noticeId: o.id,
    title: o.title,
    plainTitle: o.plainTitle,
    agency: o.agency,
    subAgency: o.office,
    closesAt: dueIso(o.closesInDays),
    scope: o.scope,
    mode: "prime",
    noticeType: o.noticeType,
    informational: o.noticeType === "Sources Sought",
    category: "contract",
    setAside: o.setAside,
    valueLow: o.valueLow,
    valueHigh: o.valueHigh,
    location: `${place.city}, ${place.state}`,
    closesInDays: o.closesInDays,
    grantCall: CALL[o.grant.verdict],
    grantLine: o.grant.oneLine,
  };
}

const cache = new Map<string, AvaOpportunity>();

/** The opportunity with this notice number, or undefined. */
export function findOpportunity(noticeId: string): AvaOpportunity | undefined {
  const hit = cache.get(noticeId);
  if (hit) return hit;
  const o = getOpportunity(noticeId);
  if (!o) return undefined;
  const a = toAva(o);
  cache.set(noticeId, a);
  return a;
}

/** Every opportunity in the story, as Ava reads it. */
export const OPPS: AvaOpportunity[] = OPPORTUNITIES.map((o) => findOpportunity(o.id)!);

/** The bids Ava is building, soonest due first (the story's own list). */
export const STORY_BID_IDS: string[] = STORY_AVA_BIDS.map((o) => o.id);

/** The calendar days from today to the due day of an opportunity. */
export function daysToClose(o: AvaOpportunity): number {
  const due = new Date(o.closesAt);
  const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const b = Date.UTC(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate());
  return Math.round((a - b) / 86_400_000);
}
