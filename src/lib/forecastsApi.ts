import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import type { HigherGovForecast } from "./forecasts/records";
import type { CaptureStatus } from "./forecasts/copy";

/**
 * Forecasts API — the forecasts in `opportunities` and the member's own facts.
 * Identity is the authenticated GHL session resolved server-side; no
 * locationId is sent from the client. The backend contract is
 * `backend/src/forecasts/forecasts.types.ts`.
 */

/** What the matching engine holds for this member and this forecast. */
export interface ForecastHunterRead {
  plainTitle: string | null;
  /** How well the described work fits, 0 to 1, from the embeddings. Null when unknown. */
  semanticFit: number | null;
  /** The industry-code fit from the NAICS taxonomy, 0 to 1. Null when there is no match. */
  categoryFit: number | null;
}

/** One forecast: the HigherGov record, plus Hunter's read of it for this member. */
export interface ForecastRecordDto extends HigherGovForecast {
  hunter: ForecastHunterRead;
}

/** The member's facts that the forecast rules read. */
export interface ForecastMemberDto {
  naics: string[];
  states: string[];
  certs: string[];
  certsKnown: boolean;
  isSmall: boolean | null;
  registration: { status: "active" | "not_registered"; endsOn: string | null };
  biggestPastJob: number | null;
  smallestTarget: null;
  businessName: string | null;
  address: string | null;
}

/** `GET /forecasts/:oppKey`. */
export interface ForecastResponseDto {
  member: ForecastMemberDto;
  forecast: ForecastRecordDto;
}

// ── The paged list: `GET /forecasts?view=…` ────────────────────────────────────
// Contract: ARCHITECTURE-forecasts-paginated.md, sections 3 and 4. The request
// keys are the list page's URL keys (`ForecastsSearch`), plus `page` and `limit`.

/** The three views of the list. */
export type ForecastView = "for_you" | "all" | "saved";

/** The tier of the member's `matches` row. */
export type ForecastMatchTier = "priority" | "strong" | "stretch" | "low";

/** This member's `matches` row for a forecast. */
export interface ForecastMatchRead {
  tier: ForecastMatchTier;
  finalScore: number;
}

/** One row of the paged list: the record, and the member's match row or null. */
export interface ForecastListRowDto extends ForecastRecordDto {
  match: ForecastMatchRead | null;
}

/** Counts per capture status. `all` includes stale forecasts; the others count open ones. */
export type ForecastCaptureCounts = { all: number } & Record<CaptureStatus, number>;

/** Counts per view, with the lane, the search and the drawer applied, and no capture tab. */
export type ForecastViewCounts = Record<ForecastView, number>;

/** One drawer option and the rows it would show, with the other choices kept. */
export interface ForecastFacetOption {
  value: string;
  count: number;
}

/** The drawer's data-driven options. */
export interface ForecastFacetsDto {
  states: ForecastFacetOption[];
  cities: ForecastFacetOption[];
  naics: ForecastFacetOption[];
}

/** `GET /forecasts` (paged). The optional fields come on page 1 only. */
export interface ForecastListResponseDto {
  member: ForecastMemberDto;
  forecasts: ForecastListRowDto[];
  page: number;
  limit: number;
  /** True when a later page holds at least one row. */
  hasMore: boolean;
  total?: number;
  captureCounts?: ForecastCaptureCounts;
  viewCounts?: ForecastViewCounts;
  facets?: ForecastFacetsDto;
}

/** Raised when the forecast does not exist, so the page can say so. */
export class ForecastNotFoundError extends Error {
  constructor() {
    super("We cannot find this forecast.");
    this.name = "ForecastNotFoundError";
  }
}

const NOT_FOUND = 404;

/** The view the server serves when a request names none. */
const DEFAULT_VIEW: ForecastView = "for_you";

/**
 * One page of the list (`GET /forecasts?view=…`). Build `params` with
 * `forecastListParams` (lib/forecasts/listQuery.ts). The view is always sent, so
 * the request says which view it asks for.
 */
export async function fetchForecastList(
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<ForecastListResponseDto> {
  const query = new URLSearchParams(params);
  if (!query.has("view")) query.set("view", DEFAULT_VIEW);
  const res = await apiFetch(`${API_BASE_URL}/forecasts?${query.toString()}`, { signal });
  if (!res.ok) return await buildApiError(res, "Failed to load forecasts");
  return (await res.json()) as ForecastListResponseDto;
}

/** One forecast, with the member's facts. Throws ForecastNotFoundError on a 404. */
export async function fetchForecast(oppKey: string): Promise<ForecastResponseDto> {
  const res = await apiFetch(`${API_BASE_URL}/forecasts/${encodeURIComponent(oppKey)}`);
  if (res.status === NOT_FOUND) throw new ForecastNotFoundError();
  if (!res.ok) return await buildApiError(res, "Failed to load the forecast");
  return (await res.json()) as ForecastResponseDto;
}
