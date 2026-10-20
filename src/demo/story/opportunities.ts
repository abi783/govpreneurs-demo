// THE STORY: every opportunity in the demo, in one place.
//
// Hunter's feed, the opportunity page, Grant, Ava, the Pipeline, Mentor
// Reviews, Tasks and search all read from this list. No screen keeps its own
// copy of a title, a value, a date or a status, so no two screens can
// disagree.
//
// Rules (enforced by story.test.ts):
// 1. Every phrase Hunter uses to justify a pick (`fit[].says`) appears in his
//    line, and every fit fact is true of the member in persona.ts.
// 2. Every date is relative: `postedDaysAgo` and `closesInDays` count from the
//    day the demo opens (clock.ts). Nothing closes in 6 days or fewer, because
//    production treats 5 days or fewer as too late to bid.
// 3. Hunter never uses Bid / No-bid words and never promises a win. Grant's
//    call is Grant's alone.
// 4. No real company is named as a bidder, incumbent or partner. Government
//    buyers are real; companies are fictional.

import type { PastPerformanceId } from "./persona";
import type { PlaceKey } from "./places";
import { MEMBER, type MemberId } from "../member";
import * as agency from "../members/agency/opportunities";
import * as caterer from "../members/caterer/opportunities";
import * as construction from "../members/construction/opportunities";
import * as consulting from "../members/consulting/opportunities";
import * as it from "../members/it/opportunities";
import * as trucking from "../members/trucking/opportunities";
import * as janitorial from "../members/janitorial/opportunities";

// Every member's opportunities. Static imports, not a glob: the QA specs load
// this file outside Vite. A new member adds one line here.
const MEMBER_FILES: Record<
  MemberId,
  { HERO_IDS: { readonly hero: string; readonly twin: string; readonly teamUp: string }; OPPORTUNITIES: StoryOpportunity[] }
> = { agency, caterer, construction, consulting, it, trucking, janitorial };
const member = MEMBER_FILES[MEMBER];

export type NoticeType =
  | "Solicitation"
  | "Combined Synopsis/Solicitation"
  | "Request for Quote"
  | "Sources Sought"
  | "Invitation for Bid"
  | "Request for Proposal"
  /** A notice that asks for nothing to price: a notice of intent, a mandatory-source notice. */
  | "Special Notice";

/** SAM set-aside codes used in the story (setAsides.ts says what each means). null = open to all. */
export type SetAside = "WOSB" | "SBA" | "SDVOSBC" | "HZC" | "8A" | null;

export type HunterTier = "priority" | "strong" | "stretch" | "low";

export type FitFact =
  | { kind: "naics"; code: string; says: string }
  | { kind: "setAside"; code: NonNullable<SetAside>; says: string }
  | { kind: "valueInRange"; says: string }
  | { kind: "valueAboveRange"; says: string }
  | { kind: "distance"; says: string }
  | { kind: "pastPerformance"; id: PastPerformanceId; says: string }
  | { kind: "targetAgency"; says: string }
  | { kind: "noticeType"; says: string }
  | { kind: "clearanceGap"; says: string }
  /** The work names one provider's own platform or crew (opportunity `exclusiveProvider`). */
  | { kind: "providerLock"; says: string }
  /** Set aside for a group the member is not in. */
  | { kind: "setAsideGap"; says: string }
  /** Only some firms may bid: holders of a contract vehicle, approved carriers, a mandatory source (opportunity `lockedTo`). */
  | { kind: "lockedOut"; says: string };

export type GrantVerdict = "bid" | "review" | "no_bid";

export interface GrantCall {
  verdict: GrantVerdict;
  /** Go / no-go as prime contractor. */
  prime: "go" | "no_go";
  /** Go / no-go as a subcontractor; null when teaming is not relevant. */
  sub: "go" | "no_go" | null;
  /** Grant's call in one sentence, in his voice, to the member. */
  oneLine: string;
  /** True when the full review is written by hand (grant/authored/*). */
  authored?: boolean;
}

/** Pipeline stages, as production's board names them (lib/mock/bids.ts). */
export type PursuitStage =
  | "saved"
  | "reviewing"
  | "with_mentor"
  | "drafting"
  | "submitted"
  | "won"
  | "not_awarded"
  | "declined";

export interface Pursuit {
  stage: PursuitStage;
  /** The card's context line on the Pipeline board. */
  note: string;
  /** The card's next move. `to` is an in-app route. */
  next: { label: string; to: string };
  lastActivityDaysAgo: number;
}

export type AvaKind = "short-response" | "written-proposal" | "bid-package" | "reply";

export interface AvaState {
  kind: AvaKind;
  /** Where Ava's flow starts in the demo (prototype `flow.ts` stage names). */
  stage:
    | "answer my questions"
    | "check you can bid"
    | "read"
    | "ready";
  needsYou: boolean;
  paused: boolean;
  /** Ava's one status line on the bid list card. */
  statusLine: string;
}

export interface StoryOpportunity {
  id: string;
  /** Title as the buyer posted it. */
  title: string;
  /** Hunter's plain-English title (production `geminiPlainEnglishTitle`). */
  plainTitle: string;
  agency: string;
  office: string;
  scope: "fed" | "sled";
  noticeType: NoticeType;
  setAside: SetAside;
  naics: string;
  valueLow: number | null;
  valueHigh: number | null;
  /** How the buyer states the value. Default: total over all years. */
  valueBasis?: "total" | "per_year";
  place: PlaceKey;
  postedDaysAgo: number;
  closesInDays: number;
  /** Time of day the response is due, as the buyer's papers state it. Default 5:00 PM Eastern. */
  dueTime?: string;
  /** What the buyer wants, in two plain sentences. */
  summary: string;
  /** Set when the work needs cleared staff. */
  clearanceRequired?: string;
  /** Set when the work is written around one provider's own platform, crew or data. */
  exclusiveProvider?: string;
  /** Set when only some firms may bid, and the member is not one: who, in plain words, as "Only … can bid" reads ("holders of Fort Bragg's HUBZone construction MATOC"). */
  lockedTo?: string;
  /** True when the agency is one of the member's target buyers. */
  targetAgency?: boolean;
  hunter: {
    tier: HunterTier;
    /** 0–100. Production tiers: priority ≥ 80, strong ≥ 60, stretch ≥ 40. */
    score: number;
    /** Position on the "Opportunities for you" tab. Absent = All tab only. */
    forYouRank?: number;
    /** "Why Hunter thinks this fits" — one sentence, you-voice, ≤ 210 chars. */
    line?: string;
    fit?: FitFact[];
  };
  grant: GrantCall;
  saved?: boolean;
  pursuit?: Pursuit;
  ava?: AvaState;
  /** Mentor review thread about this opportunity (mentorReviews.ts). */
  mentorReviewId?: string;
}


const HEROES = member.HERO_IDS;

/**
 * The three opportunities the story turns on: the hero Grant says to bid, its
 * look-alike twin Grant says not to bid, and the team-up too big to bid alone.
 * Content written for one member imports that member's own ids
 * (src/demo/members/<member>/opportunities.ts), never these.
 */
export const HERO_IDS = HEROES;

export const OPPORTUNITIES: StoryOpportunity[] = member.OPPORTUNITIES;

/** Every other member's records. Never in a feed or a list (see OPPORTUNITIES). */
const OTHER_MEMBER: StoryOpportunity[] = Object.entries(MEMBER_FILES).flatMap(([id, m]) => (id === MEMBER ? [] : m.OPPORTUNITIES));

/**
 * Lookup by id. DEMO: it also finds the other member's records, so content
 * written for one member (a hand-written Grant review, an Ava bid) can still
 * load while the other member is on stage. Nothing lists them: every feed,
 * board and count reads OPPORTUNITIES, and the member scan
 * (demo-storyboard/tools/scan-member.mjs) proves no other-trade words show.
 */
export const OPPORTUNITY_BY_ID: ReadonlyMap<string, StoryOpportunity> = new Map(
  [...OTHER_MEMBER, ...OPPORTUNITIES].map((o) => [o.id, o]),
);

/** The time of day a response is due. Ava's buyer papers and Grant's timeline both use it. */
export function dueTimeOf(o: StoryOpportunity): string {
  return o.dueTime ?? "5:00 PM Eastern";
}

export function getOpportunity(id: string): StoryOpportunity | undefined {
  return OPPORTUNITY_BY_ID.get(id);
}

/** The "Opportunities for you" tab, in Hunter's order. */
export const FOR_YOU: StoryOpportunity[] = OPPORTUNITIES.filter(
  (o) => o.hunter.forYouRank !== undefined,
).sort((a, b) => (a.hunter.forYouRank ?? 0) - (b.hunter.forYouRank ?? 0));

/** Bids Ava is building, soonest due first. */
export const AVA_BIDS: StoryOpportunity[] = OPPORTUNITIES.filter((o) => o.ava).sort(
  (a, b) => a.closesInDays - b.closesInDays,
);
