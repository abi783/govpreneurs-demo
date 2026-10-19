// DEMO API area: Awards.
// Owns: /awards*.
//
// The award record is src/demo/explore/awardsData.ts. The visitor's saved awards
// live in the demo store under `explore.awards.saved`.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { readDemoState, updateDemoState } from "../runtime/store";
import { isoDaysFromNow } from "../story/clock";
import { PERSONA } from "../story/persona";
import { allAwardRecords, findAwardRecord } from "../explore/awardsData";
import {
  DEFAULT_AWARD_FILTERS,
  type AwardFilterId,
  type AwardListRequest,
  type AwardRecord,
  type AwardSort,
  type SavedAward,
} from "@/lib/awardsApi";
import { byMember } from "../member";
import { STORY_SAVED_AWARD_IDS as AGENCY_SAVED_AWARD_IDS } from "../members/agency/market/awards";

const SAVED_KEY = "explore.awards.saved";
const PAGE_SIZE = 10;

/** The same size band the live product uses for "My size". */
const SIZE_MIN_USD = 500_000;
const SIZE_MAX_USD = 25_000_000;

const MY_STATES = PERSONA.serviceStates as readonly string[];
const MY_TRADE_CODES = new Set<string>([PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)]);

/** Amira has already saved the two awards that tell her story: Fort Bragg dining and her own Womack job. */
function initialSaved(): SavedAward[] {
  // DEMO: each member starts with two awards saved (D85).
  const ids = byMember<readonly string[]>({
    caterer: ["W91247-19-C-0021", "W81K04-24-P-0187"],
    agency: AGENCY_SAVED_AWARD_IDS,
  });
  return ids.map((awardId, i) => ({ awardId, sourceTag: "from Awards", savedAt: isoDaysFromNow(i === 0 ? -3 : -6, i === 0 ? 14 : 11) }));
}

const saved = (): SavedAward[] => readDemoState<SavedAward[]>(SAVED_KEY, initialSaved);

function passes(a: AwardRecord, id: AwardFilterId): boolean {
  switch (id) {
    case "trade":
      return a.naicsCode !== null && MY_TRADE_CODES.has(a.naicsCode);
    case "area":
      return a.location.state !== null && MY_STATES.includes(a.location.state);
    case "size":
      return a.obligated !== null && a.obligated >= SIZE_MIN_USD && a.obligated <= SIZE_MAX_USD;
    case "justAwarded":
      return a.recency.justAwarded === true;
    case "comingUpAgain":
      return a.recency.comingUpAgain;
  }
}

function matchesQuery(a: AwardRecord, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = [a.winner.name, a.title, a.agency.name, a.agency.abbrev, a.location.city, a.workType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}

/** The "Best match" score: just awarded, up for bid again, right size, then recent. */
function relevance(a: AwardRecord): number {
  const months = (a.recency.daysSinceAward ?? 0) / 30;
  const size = a.obligated !== null && a.obligated >= SIZE_MIN_USD && a.obligated <= SIZE_MAX_USD;
  return (
    (a.recency.justAwarded ? 45 : 0) +
    (a.recency.comingUpAgain ? 30 : 0) +
    (size ? 15 : 0) +
    Math.max(0, 12 - months)
  );
}

function sorted(list: AwardRecord[], sort: AwardSort): AwardRecord[] {
  const out = list.map((a, i) => ({ a, i }));
  if (sort === "recent") {
    out.sort((x, y) => (x.a.recency.daysSinceAward ?? 9e9) - (y.a.recency.daysSinceAward ?? 9e9) || x.i - y.i);
  } else if (sort === "largest") {
    out.sort((x, y) => (y.a.obligated ?? 0) - (x.a.obligated ?? 0) || x.i - y.i);
  } else {
    out.sort((x, y) => relevance(y.a) - relevance(x.a) || x.i - y.i);
  }
  return out.map((x) => x.a);
}

export const routes: DemoRouteDef[] = [
  {
    method: "POST",
    path: "/awards",
    handler: ({ body }) => {
      const req = (body ?? {}) as AwardListRequest;
      const filters = req.filters ?? DEFAULT_AWARD_FILTERS;
      const sort = req.sort ?? "relevant";
      const limit = Math.min(Math.max(1, Number(req.limit) || PAGE_SIZE), 50);
      const page = Math.max(1, Number(req.page) || 1);
      const q = typeof req.q === "string" ? req.q : "";

      const matched = sorted(
        allAwardRecords().filter((a) => filters.every((f) => passes(a, f)) && matchesQuery(a, q)),
        sort,
      );
      const start = (page - 1) * limit;
      return {
        awards: matched.slice(start, start + limit),
        page,
        limit,
        hasMore: start + limit < matched.length,
        appliedFilters: filters,
      };
    },
  },
  {
    method: "GET",
    path: "/awards/saved",
    handler: () => ({
      awards: [...saved()].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    }),
  },
  {
    method: "GET",
    path: "/awards/:awardId",
    handler: ({ params }) =>
      findAwardRecord(params.awardId) ?? demoResponse(404, { message: "That award is not in your market." }),
  },
  {
    method: "POST",
    path: "/awards/saved",
    handler: ({ body }) => {
      const awardId = String(body?.awardId ?? "");
      if (!awardId) return demoResponse(400, { message: "Missing award" });
      updateDemoState<SavedAward[]>(SAVED_KEY, initialSaved, (prev) =>
        prev.some((s) => s.awardId === awardId)
          ? prev
          : [...prev, { awardId, sourceTag: String(body?.sourceTag ?? "from Awards"), savedAt: new Date().toISOString() }],
      );
      return { ok: true };
    },
  },
  {
    method: "DELETE",
    path: "/awards/saved/:awardId",
    handler: ({ params }) => {
      updateDemoState<SavedAward[]>(SAVED_KEY, initialSaved, (prev) => prev.filter((s) => s.awardId !== params.awardId));
      return { ok: true };
    },
  },
];
