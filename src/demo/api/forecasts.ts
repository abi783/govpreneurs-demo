// DEMO API area: Forecasts.
// Owns: /forecasts*, including grant take, chat, session, reply, watch and card takes.
//
// The data lives in src/demo/explore/forecastData.ts (47 forecasts, dates from today).
// The page reads the list through the production rules: this handler uses the
// page's own filter, search and sort functions, so the counts, the tabs and the
// drawer always agree with the rows. Tracking a forecast is the shared saved list
// (src/demo/state/workspace.ts); the watch only reports on forecasts that are in it.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { readDemoState, updateDemoState } from "../runtime/store";
import { isoDaysFromNow } from "../story/clock";
import { OWN } from "../story/setAsides";
import { calendarDay, dayToIso } from "../explore/dates";
import { getSavedOpps, registerSavedResolver } from "../state/workspace";
import { numParam } from "./util";
import type {
  ForecastCaptureCounts,
  ForecastFacetsDto,
  ForecastListResponseDto,
  ForecastView,
} from "@/lib/forecastsApi";
import {
  cityOptions,
  filtersFromSearch,
  matchesFilters,
  naicsOptions,
  readFilterSearch,
  sortForecasts,
  stateOptions,
  type ForecastSort,
} from "@/lib/forecasts/filters";
import { byBestFit, isPastGrace, matchesSearch, FORECASTS_TODAY } from "@/lib/forecasts/engine";
import type { ForecastWatchEvent, ForecastWatchForecast } from "@/lib/forecasts/watch";
import type { ForecastGrantMessage } from "@/lib/forecasts/grantChatApi";
import {
  FORECAST_MEMBER,
  SCORED_ROWS,
  forecastFiles,
  forecastRecord,
  isForecastKey,
  toListRow,
  type ScoredRow,
} from "../explore/forecastData";
import { cardTakeLine, forecastGrantReply } from "../explore/forecastChat";
import { buildForecastTake } from "../explore/forecastTakes";
import {
  FORT_BRAGG_FORECAST_KEY,
  POPE_FORECAST_KEY,
} from "../explore/forecastLocalSeeds";

// ── The saved list: how a tracked forecast looks on the Pipeline and in the feed ──

registerSavedResolver((oppKey) => {
  const r = forecastRecord(oppKey);
  if (!r) return null;
  return {
    oppKey,
    title: r.hunter.plainTitle ?? r.hgTitle ?? "Forecast",
    agency: r.agencyName,
    dueDate: r.dueOn ? dayToIso(r.dueOn) : null,
    sourceType: r.lane === "sled" ? "sled_forecast" : "forecast",
  };
});

// ── The list ─────────────────────────────────────────────────────────────────────

const LIMIT_MAX = 50;

/** A forecast stays on For you and All until six months after its window ends. */
function withinGrace(row: ScoredRow): boolean {
  return !isPastGrace(row.scored.timing.end, FORECASTS_TODAY);
}

/** For you: the member's match rows above "low", not held back, still in grace. */
function inForYou(row: ScoredRow): boolean {
  return (
    row.match != null &&
    row.match.tier !== "low" &&
    row.scored.heldBack === null &&
    withinGrace(row)
  );
}

function trackedKeys(): Set<string> {
  return new Set(getSavedOpps().filter(isForecastKey));
}

function inView(row: ScoredRow, view: ForecastView, tracked: Set<string>): boolean {
  if (view === "saved") return tracked.has(row.record.oppKey);
  if (view === "all") return withinGrace(row);
  return inForYou(row);
}

/** A forecast that is open (not stale) and in the capture tab. */
function inTab(row: ScoredRow, tab: string | null): boolean {
  if (!tab || tab === "all") return true;
  return row.scored.lifecycle === "open" && row.scored.status === tab;
}

function sortOf(view: ForecastView, raw: string | null): ForecastSort {
  const sorts: ForecastSort[] = ["match", "soonest", "newest", "value"];
  if (raw && (sorts as string[]).includes(raw) && !(raw === "match" && view !== "for_you")) {
    return raw as ForecastSort;
  }
  return view === "for_you" ? "match" : "soonest";
}

function listForecasts(query: URLSearchParams): ForecastListResponseDto {
  const view = (["for_you", "all", "saved"].includes(query.get("view") ?? "")
    ? query.get("view")
    : "for_you") as ForecastView;
  const lane = query.get("lane");
  const q = (query.get("q") ?? "").trim().slice(0, 200);
  const tab = query.get("tab");
  const page = Math.max(1, numParam(query.get("page"), 1));
  const limit = Math.min(LIMIT_MAX, Math.max(1, numParam(query.get("limit"), 20)));
  const filters = filtersFromSearch(readFilterSearch(Object.fromEntries(query.entries())));
  const tracked = trackedKeys();

  const byLane = (r: ScoredRow) => !lane || lane === "all" || r.record.lane === lane;
  const bySearch = (r: ScoredRow) => !q || matchesSearch(r.scored, q);
  const base = SCORED_ROWS.filter((r) => byLane(r) && bySearch(r));
  const drawer = (r: ScoredRow) => matchesFilters(r.scored, filters);

  const viewCounts = {
    for_you: base.filter((r) => inView(r, "for_you", tracked) && drawer(r)).length,
    all: base.filter((r) => inView(r, "all", tracked) && drawer(r)).length,
    saved: base.filter((r) => inView(r, "saved", tracked) && drawer(r)).length,
  };

  const inThisView = base.filter((r) => inView(r, view, tracked));
  const afterDrawer = inThisView.filter(drawer);
  const captureCounts: ForecastCaptureCounts = {
    all: afterDrawer.length,
    act_now: 0,
    start_capture: 0,
    position_early: 0,
    watch: 0,
  };
  for (const r of afterDrawer) {
    if (r.scored.lifecycle === "open") captureCounts[r.scored.status] += 1;
  }

  const matching = afterDrawer.filter((r) => inTab(r, tab));
  const sortKey = sortOf(view, query.get("sort"));
  // Best match orders by the member's match score (Hunter's own), then by the engine's fit.
  const ordered: ScoredRow[] =
    sortKey === "match"
      ? [...matching].sort(
          (a, b) => (b.match?.finalScore ?? -1) - (a.match?.finalScore ?? -1) || byBestFit(a.scored, b.scored),
        )
      : (() => {
          const byId = new Map(matching.map((r) => [r.scored.id, r]));
          return sortForecasts(matching.map((r) => r.scored), sortKey).map((s) => byId.get(s.id) as ScoredRow);
        })();
  const pageRows = ordered.slice((page - 1) * limit, page * limit);

  const response: ForecastListResponseDto = {
    member: FORECAST_MEMBER,
    forecasts: pageRows.map(toListRow),
    page,
    limit,
    hasMore: page * limit < ordered.length,
  };
  if (page === 1) {
    const scoredInView = inThisView.map((r) => r.scored);
    const facets: ForecastFacetsDto = {
      states: stateOptions(scoredInView, filters).map((o) => ({ value: o.code, count: o.count })),
      cities: cityOptions(scoredInView, filters).map((o) => ({ value: o.name, count: o.count })),
      naics: naicsOptions(scoredInView, filters).map((o) => ({ value: o.code, count: o.count })),
    };
    response.total = ordered.length;
    response.captureCounts = captureCounts;
    response.viewCounts = viewCounts;
    response.facets = facets;
  }
  return response;
}

// ── Grant's chat ───────────────────────────────────────────────────────────────────

const CHAT_KEY = "explore.forecasts.chat";
type Chats = Record<string, ForecastGrantMessage[]>;

function chatOf(oppKey: string): ForecastGrantMessage[] {
  return readDemoState<Chats>(CHAT_KEY, {})[oppKey] ?? [];
}

function addChat(oppKey: string, messages: ForecastGrantMessage[]): void {
  updateDemoState<Chats>(CHAT_KEY, {}, (prev) => ({ ...prev, [oppKey]: [...(prev[oppKey] ?? []), ...messages] }));
}

// ── The watch ───────────────────────────────────────────────────────────────────────

const SEEN_KEY = "explore.forecasts.seen";

function event(
  id: string,
  kind: ForecastWatchEvent["kind"],
  daysAgo: number,
  fields: Pick<ForecastWatchEvent, "field" | "before" | "after"> & Partial<Pick<ForecastWatchEvent, "decided">>,
  seen: boolean,
): ForecastWatchEvent {
  const observedAt = isoDaysFromNow(-daysAgo, 13);
  return { id, kind, decided: null, notice: null, observedAt, seenAt: seen ? observedAt : null, ...fields };
}

/** What the buyer changed on a few forecasts, so the watch box has something true to show. */
function eventsFor(oppKey: string, seen: boolean): ForecastWatchEvent[] {
  const record = forecastRecord(oppKey);
  if (!record) return [];
  if (oppKey === FORT_BRAGG_FORECAST_KEY) {
    return [
      event("fb-1", "date_moved", 3, { field: "expectedOn", before: calendarDay(120), after: record.dueOn }, seen),
    ];
  }
  if (oppKey === POPE_FORECAST_KEY) {
    return [
      event("pope-1", "set_aside_changed", 5, { field: "setAsideCode", before: "TBD", after: OWN, decided: true }, seen),
    ];
  }
  if (oppKey === "ce493b6f89e41ddc4ff5b2b7923301d9") {
    return [event("va-1", "value_changed", 2, { field: "valHigh", before: 800_000, after: 900_000 }, seen)];
  }
  return [];
}

function watchForecasts(): ForecastWatchForecast[] {
  const seenKeys = readDemoState<string[]>(SEEN_KEY, []);
  const out: ForecastWatchForecast[] = [];
  for (const key of trackedKeys()) {
    const seen = seenKeys.includes(key);
    const events = eventsFor(key, seen);
    if (events.length === 0) continue;
    out.push({
      oppKey: key,
      startedAt: isoDaysFromNow(-9, 9),
      unseen: events.filter((e) => e.seenAt === null).length,
      events,
    });
  }
  return out;
}

// ── Routes ──────────────────────────────────────────────────────────────────────────

const notFound = () => demoResponse(404, { message: "We cannot find this forecast." });

export const routes: DemoRouteDef[] = [
  { method: "GET", path: "/forecasts", handler: ({ query }) => listForecasts(query) },
  {
    method: "POST",
    path: "/forecasts/takes",
    handler: ({ body }) => {
      const keys: string[] = Array.isArray(body?.oppKeys) ? body.oppKeys.map(String) : [];
      const takes = keys
        .map((oppKey) => ({ oppKey, line: cardTakeLine(oppKey) }))
        .filter((t): t is { oppKey: string; line: string } => t.line !== null && t.line.length <= 240);
      return { takes };
    },
  },
  {
    method: "GET",
    path: "/forecasts/:oppKey",
    handler: ({ params }) => {
      const record = forecastRecord(params.oppKey);
      if (!record) return notFound();
      return {
        member: FORECAST_MEMBER,
        forecast: {
          ...record,
          files: forecastFiles(record.oppKey),
          checkedOn: calendarDay(0),
        },
      };
    },
  },
  {
    method: "GET",
    path: "/forecasts/:oppKey/grant/take",
    handler: ({ params }) => buildForecastTake(params.oppKey) ?? notFound(),
  },
  {
    method: "GET",
    path: "/forecasts/:oppKey/grant/session",
    handler: ({ params }) => (isForecastKey(params.oppKey) ? { messages: chatOf(params.oppKey) } : notFound()),
  },
  {
    method: "POST",
    path: "/forecasts/:oppKey/grant/reply",
    handler: ({ params, body }) => {
      if (!isForecastKey(params.oppKey)) return notFound();
      const message = String(body?.message ?? "").trim();
      if (!message) return demoResponse(400, { message: "Write a question for Grant." });
      const reply = forecastGrantReply(params.oppKey, message);
      const now = Date.now();
      addChat(params.oppKey, [
        { role: "user", text: message, at: new Date(now).toISOString() },
        { role: "grant", text: reply, at: new Date(now + 1000).toISOString() },
      ]);
      return { reply };
    },
  },
  {
    method: "GET",
    path: "/forecast-watch",
    handler: () => ({ watching: true, notify: false, forecasts: watchForecasts() }),
  },
  {
    method: "POST",
    path: "/forecast-watch/:oppKey/seen",
    handler: ({ params }) => {
      updateDemoState<string[]>(SEEN_KEY, [], (prev) => (prev.includes(params.oppKey) ? prev : [...prev, params.oppKey]));
      return { ok: true };
    },
  },
];
