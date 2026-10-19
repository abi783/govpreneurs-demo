// DEMO (Hunter): the member's own words, for every Hunter surface.
//
// Hunter's engines (facts, chat, search, the feed's API) are the same for every
// member. What changes is the trade: a caterer works from a kitchen and bids
// meals; an ad agency works from an office and bids campaigns. Each member's
// words live in src/demo/members/<member>/hunter/vocab.ts, and this file picks the
// active member's. No engine types a trade word itself.

import type { ActPayload } from "../../lib/hunterChat";
import type { PastPerformanceId } from "../story/persona";
import { byMember } from "../member";
import { AGENCY_VOCAB } from "../members/agency/hunter/vocab";
import { CATERER_VOCAB } from "../members/caterer/hunter/vocab";
import type { FeedRow } from "./data";

/** A work word the chat turns into a code filter or a search. */
export interface WorkType {
  rx: RegExp;
  naics?: string[];
  search?: string;
  /** How the reply names it: "catering opportunities". */
  noun: string;
}

export interface HunterVocab {
  /** What the member works from, as in "12 miles from your ___". */
  base: string;
  /** A place within 5 miles, in a fit line: "in your hometown", "across town". */
  hometown: string;
  /** The subject of a distance sentence: "The site", "The work". */
  place: string;
  /** Readiness, for a place inside the area but over an hour away. */
  longWay: string;
  /** "your food-service code", by NAICS code. Other codes read "one of your codes". */
  codePhrases: Record<string, string>;
  /** The federal product and service code the member's notices carry. */
  pscFor: (naics: string) => string;
  /** The member's main PSC, first in a PSC search. */
  mainPsc: string;
  /** The past job that best matches a notice, or none. */
  pastJobId: (row: FeedRow) => PastPerformanceId | undefined;
  /** Readiness: a gap she can close before she answers, with the sentence that names it. */
  readinessAct?: (row: FeedRow) => { act: ActPayload; note: string } | undefined;
  /** Readiness, for a job above her range: who to team with. Starts with a space, or is empty. */
  aboveRangeTeam: string;
  profile: {
    /** The profile card's row for the team and the place of work. */
    teamLabel: string;
    /** "… with 5 employees and one kitchen that cooks 1,100 meals a day". */
    intro: string;
    /** A fact she might tell Hunter, offered as a button. */
    chip: string;
  };
  /** What Ava is working on and where to find her, for "can you write my proposal". */
  avaLine: string;
  /** The answer to "how do I get certified". */
  certLine: string;
  /** "Who is my competition": a true example, starting with a space, or empty. */
  competitionExample: string;
  /** The search fallback's hint: "a type of food service". */
  searchHint: string;
  /** Questions the unknown-question rule offers. The first five are the same for every member. */
  canon: string[];
  /** Work words, in the order the chat checks them. */
  workTypes: WorkType[];
  /** The incumbent the story names, if any. */
  incumbent?: { id: string; rx: RegExp; reply: string };
  /** The Forecasts chat: "Your codes: …". */
  forecastCodes: string;
  glossary: {
    /** "You have N on this list now: …" */
    sourcesSought: string;
    psc: string;
    /** Starts with a space. */
    rfqExample: string;
    incumbent: { line: string; chips: string[] };
    primeSub: { line: string; chips: string[] };
    bond: { line: string; chips: string[] };
    clearance: { line: string; chips: string[] };
  };
  api: { trade: string; alliedNaics: string[] };
  /** Example and placeholder text in the feed's own components. */
  ui: {
    quickPicks: string[];
    workTypes: string[];
    searchPlaceholders: string[];
    saveSearchPlaceholder: string;
    naicsGloss: string;
    /** The smart-list builder's work types and its one pre-saved list. Absent: production's. */
    smartList?: {
      workTypes: string[];
      seedName: string;
      seedSetAsides: string[];
      seedValue: [number, number];
    };
  };
}

export const VOCAB: HunterVocab = byMember({ agency: AGENCY_VOCAB, caterer: CATERER_VOCAB });
