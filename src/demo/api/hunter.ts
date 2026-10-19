// DEMO API area: The Hunter feed (Opportunities page).
// Owns: POST /opportunities/discover/v2 (feed), /discover/v2/counts, /discover/v2/scores, /opportunities/filters/*, /opportunities/preview*, /opportunities/all, /opportunities/saved, /hunters-take/*, /hunter-chat/* (chat, profile, enrichment, profile-update), /naics/*, /psc/*.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.
//
// Every list here comes from the story (`src/demo/story/opportunities.ts`) through
// `src/demo/hunter/*`. The filters, the sort, the search and the page are applied
// in `src/demo/hunter/query.ts`, so each control on the page changes the cards.

import type {
  DiscoverV2ResponseDto,
  FilterDefaultsDto,
  ScoresResponseDto,
  ServerFilters,
} from "../../lib/discoverApi";
import { PERSONA } from "../story/persona";
import type { DemoRouteDef } from "../runtime/router";
import { demoResponse } from "../runtime/router";
import { citiesOf, facetCounts } from "../hunter/facets";
import { forYouRows, savedRows, universe, allRows, type FeedTabId } from "../hunter/data";
import { toDiscoverDto, toPreviewDto } from "../hunter/dto";
import { getFeedContext } from "../hunter/feedContext";
import { runFeed } from "../hunter/query";
import { takesFor } from "../hunter/takes";
import { naicsDescriptions, searchNaics, searchPsc } from "../hunter/naicsData";
import { completePayload, enrichmentState } from "../hunter/enrichment";
import { MEMBER_CODES } from "../hunter/facts";
import { VOCAB } from "../hunter/vocab";
import { handleHunterMessage, resetChat } from "../hunter/chat/engine";
import { confirmProposal, rejectProposal } from "../hunter/chat/profile";
import { STATES } from "../../lib/vocab/usStates";
import { numParam } from "./util";

const lanes = (rows: ReturnType<typeof forYouRows>) => ({
  all: rows.length,
  bid: rows.filter((r) => r.o.hunter.tier === "priority" || r.o.hunter.tier === "strong").length,
  lean: rows.filter((r) => r.o.hunter.tier === "stretch").length,
  pass: rows.filter((r) => r.o.hunter.tier === "low").length,
});

/** The tab that the open feed page shows, for calls that carry no tab. */
function openTab(): FeedTabId {
  const t = getFeedContext().tab;
  // The Saved tab ignores facet filters, so the drawer counts the ranked list.
  return t === "all" ? "all" : "for_you";
}

export const routes: DemoRouteDef[] = [
  // ── The feed ──────────────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/opportunities/discover/v2",
    handler: ({ body }) => {
      const rows = forYouRows();
      const page = runFeed("for_you", rows, body ?? {});
      const res: DiscoverV2ResponseDto = {
        data: page.data.map(toDiscoverDto),
        total: page.total,
        page: page.page,
        limit: page.limit,
        totalPages: page.totalPages,
        scoringEngine: "hybrid",
        counts: lanes(rows),
        profileIndexing: false,
      };
      return res;
    },
  },
  {
    method: "POST",
    path: "/opportunities/all",
    handler: ({ body }) => {
      const page = runFeed("all", allRows(), body ?? {});
      return {
        opportunities: page.data.map(toPreviewDto),
        page: page.page,
        limit: page.limit,
        total: page.total,
      };
    },
  },
  {
    method: "POST",
    path: "/opportunities/saved",
    handler: ({ body }) => {
      const page = runFeed("saved", savedRows(), body ?? {});
      return {
        opportunities: page.data.map(toPreviewDto),
        page: page.page,
        limit: page.limit,
        total: page.total,
      };
    },
  },
  {
    method: "POST",
    path: "/opportunities/discover/v2/counts",
    handler: ({ body }) => {
      // Production nests the filters under `filters`. The page sends them bare.
      const raw =
        (body && typeof body === "object" && "filters" in body
          ? (body as { filters: ServerFilters }).filters
          : body) ?? {};
      const filters: ServerFilters = { ...(raw as ServerFilters) };
      const ctx = getFeedContext();
      if (filters.search === undefined && ctx.filters.search) filters.search = ctx.filters.search;
      return facetCounts(filters, openTab());
    },
  },
  {
    method: "GET",
    path: "/opportunities/discover/v2/scores",
    handler: ({ query }) => {
      const rows = forYouRows();
      const sort = query.get("sort");
      const field = sort === "deadline" || sort === "newest" ? sort : "match";
      const page = runFeed("for_you", rows, {
        sort: { field, order: field === "deadline" ? "asc" : "desc" },
        page: numParam(query.get("page"), 1),
        limit: numParam(query.get("limit"), 50),
      });
      const res: ScoresResponseDto = {
        data: page.data.map(toDiscoverDto),
        counts: lanes(rows),
        total: page.total,
        page: page.page,
        totalPages: page.totalPages,
      };
      return res;
    },
  },

  // ── Filter helpers ────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/opportunities/filters/defaults",
    handler: () => {
      const res: FilterDefaultsDto = {
        naics: MEMBER_CODES,
        setAsides: ["WOSB", "SB"],
        states: [...PERSONA.serviceStates],
        cities: [PERSONA.hqCity],
        hasCapabilityStatement: true,
        hasLiveMatches: true,
        hasProfileVector: true,
        alliedNaics: [...MEMBER_CODES, ...VOCAB.api.alliedNaics],
      };
      return res;
    },
  },
  {
    method: "GET",
    path: "/opportunities/filters/cities",
    handler: ({ query }) => {
      const state = (query.get("state") ?? "").toUpperCase();
      if (state) return [{ state, cities: citiesOf(state) }];
      return STATES.map((s) => ({ state: s.id, cities: citiesOf(s.id) })).filter(
        (g) => g.cities.length > 0,
      );
    },
  },

  // ── Preview mode (the page does not reach it; the answers are sensible anyway) ──
  {
    method: "POST",
    path: "/opportunities/preview",
    handler: ({ body }) => {
      const page = runFeed("all", allRows(), body ?? {});
      return {
        opportunities: page.data.map(toPreviewDto),
        previewReady: true,
        page: page.page,
        limit: page.limit,
        total: page.total,
      };
    },
  },
  {
    method: "POST",
    path: "/opportunities/preview/answers",
    handler: () => ({ ok: true }),
  },
  {
    method: "GET",
    path: "/opportunities/preview/answers",
    handler: () => ({
      answers: {
        naics: [...MEMBER_CODES],
        states: [...PERSONA.serviceStates],
        setAsides: ["WOSB", "SB"],
        trades: [VOCAB.api.trade],
        cities: [{ city: PERSONA.hqCity, state: PERSONA.hqState }],
        serviceArea: "state_plus_neighbors",
      },
    }),
  },

  // ── Hunter's take ─────────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/hunters-take/feed",
    handler: ({ body }) => ({
      takes: takesFor(Array.isArray(body?.oppKeys) ? body.oppKeys.map(String) : []),
    }),
  },

  // ── Hunter chat ───────────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/hunter-chat/message",
    handler: ({ body }) => handleHunterMessage(body ?? {}),
  },
  {
    method: "POST",
    path: "/hunter-chat/reset",
    handler: () => {
      resetChat();
      return { ok: true };
    },
  },
  { method: "POST", path: "/hunter-chat/feedback", handler: () => ({ ok: true }) },
  { method: "POST", path: "/hunter-chat/profile", handler: () => ({ ok: true }) },
  { method: "GET", path: "/hunter-chat/profile", handler: () => ({ facts: [] }) },
  { method: "POST", path: "/hunter-chat/profile/answer", handler: () => ({ ok: true }) },
  { method: "GET", path: "/hunter-chat/memory-conflicts", handler: () => ({ conflicts: [] }) },
  { method: "POST", path: "/hunter-chat/memory-conflicts/resolve", handler: () => ({ ok: true }) },
  {
    method: "POST",
    path: "/hunter-chat/profile-update/:proposalId/confirm",
    handler: ({ params }) => {
      const label = confirmProposal(params.proposalId);
      return label
        ? { status: "confirmed", label }
        : demoResponse(200, { status: "gone", message: "That change was already answered." });
    },
  },
  {
    method: "POST",
    path: "/hunter-chat/profile-update/:proposalId/reject",
    handler: ({ params }) => {
      rejectProposal(params.proposalId);
      return { status: "rejected" };
    },
  },

  // ── Profile setup: complete, so no question waits ─────────────────────────
  { method: "GET", path: "/hunter-chat/enrichment/state", handler: () => enrichmentState() },
  {
    method: "POST",
    path: "/hunter-chat/enrichment/enter",
    handler: () => enrichmentState({ active: true, posture: "ENRICHMENT" }),
  },
  {
    method: "POST",
    path: "/hunter-chat/enrichment/pause",
    handler: () => enrichmentState({ active: true, paused: true }),
  },
  { method: "POST", path: "/hunter-chat/enrichment/back", handler: () => completePayload() },
  { method: "GET", path: "/hunter-chat/enrichment/next", handler: () => completePayload() },
  {
    method: "POST",
    path: "/hunter-chat/enrichment/answer",
    handler: () => ({
      kind: "answer",
      acknowledged: "Saved.",
      totalPayoff: { unlocked: 0, sharpened: 0 },
      embedPending: false,
      scoringMode: "hybrid",
      atCheckpoint: false,
      next: completePayload(),
    }),
  },
  {
    method: "POST",
    path: "/hunter-chat/enrichment/skip",
    handler: ({ body }) => ({
      kind: "skip",
      field: String(body?.field ?? ""),
      parked: true,
      atCheckpoint: false,
    }),
  },
  {
    method: "POST",
    path: "/hunter-chat/enrichment/checkpoint",
    handler: ({ body }) =>
      body?.decision === "stop"
        ? enrichmentState({ active: true, paused: true })
        : enrichmentState(),
  },
  { method: "POST", path: "/hunter-chat/enrichment/organic", handler: () => ({ offer: null }) },

  // ── Code lookups ──────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/naics/descriptions",
    handler: ({ query }) =>
      naicsDescriptions(
        (query.get("codes") ?? "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, 100),
      ),
  },
  {
    method: "GET",
    path: "/naics/search",
    handler: ({ query }) => searchNaics(query.get("q") ?? ""),
  },
  { method: "GET", path: "/psc/search", handler: ({ query }) => searchPsc(query.get("q") ?? "") },
];

// `universe` is re-exported for the tests.
export { universe };
