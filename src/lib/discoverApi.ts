import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import type { DiscoverV2OpportunityDto } from "./discoverMapper";
import type { Dibbs, OppCategory } from "./mock/opportunities";
import type { SummarySource } from "./summaryProvenance";

export interface ServerFilters {
  naicsCodes?: string[];
  setAsides?: string[];
  location?: { states?: string[]; cities?: string[] };
  noticeTypes?: string[];
  dueWindow?: string[];
  valueRange?: { min: number | null; max: number | null };
  search?: string;
  agencies?: string[];
  scopes?: ("fed" | "sled")[];
  vehicles?: string[];
  psc?: string[];
  popZips?: string[];
  postedWithin?: number;
  dodOnly?: boolean;
  civilianOnly?: boolean;
}

export interface ServerSort {
  field: "match" | "deadline" | "value" | "newest" | "saved";
  order?: "asc" | "desc";
}

export interface DiscoverV2ResponseDto {
  data: DiscoverV2OpportunityDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  scoringEngine: string;
  counts?: { all: number; bid: number; lean: number; pass: number };
  /** True when the user has no pre-computed matches yet — backend fell back to live scoring. */
  profileIndexing?: boolean;
}

export interface DiscoverV2DetailDto {
  id: string;
  title: string;
  scope: "fed" | "sled";
  agency: { name: string };
  noticeType: string;
  postedDate: string | null;
  responseDeadline: string;
  setAside: string;
  naicsCode: string;
  classificationCode?: string;
  solNumber?: string;
  placeOfPerformance: { state?: string; city?: string };
  /** Primary point of contact from the HigherGov notice. Fields may be empty when the notice omits them. */
  pointOfContact?: { name: string; email: string; phone?: string; title?: string };
  /** Secondary point of contact, present only when the notice lists one. */
  secondaryContact?: { name: string; email: string; phone?: string; title?: string };
  status: string;
  quickSummary: string | null;
  /** Which tier produced `quickSummary`; drives the provenance caption. */
  summarySource?: SummarySource;
  /** The backend will rewrite a notice/metadata summary from the documents. */
  summaryRewritePending?: boolean;
  geminiPlainEnglishTitle: string | null;
  category?: OppCategory;
  dibbs?: Dibbs;
  /** Key-date bullets from the RAG summary, e.g. "Questions due: June 16, 2026, 9:00 AM Central". */
  keyDates?: string[];
  /** Structured RAG-summary sections (each a bullet list), keyed by accordion. Null when no summary exists. */
  accordions?: Record<string, string[]> | null;
  /** Estimated contract value range from the HigherGov document. Null when not provided. */
  valEstLow?: number | null;
  valEstHigh?: number | null;
  finalScore: number | null;
  tier: string | null;
  matchReasons: string[];
  matchBreakdown: Record<string, unknown> | null;
  documents?: Array<{ fileName: string; downloadUrl: string; fileSize?: number }>;
  sourcePath?: string | null;
  /** Real mentor-review state for this opp/user, from the backend. */
  mentorReviewStatus?: "discuss" | "reject" | "pursue" | "pending" | null;
  /**
   * The mentor-review id for this opp/user (the `user_mentor_associations._id`
   * hex, which `GET /mentor-reviews/:id` accepts). Null when no review exists.
   * Used to deep-link "View in Mentor" straight to this conversation.
   */
  mentorReviewId?: string | null;
}

/** POST /opportunities/discover/v2 — returns scored opportunity list for a user. */
export async function fetchDiscoverV2(
  userId: string,
  opts?: {
    page?: number;
    limit?: number;
    filters?: ServerFilters;
    sort?: ServerSort;
    signal?: AbortSignal;
  },
): Promise<DiscoverV2ResponseDto> {
  const url = `${API_BASE_URL}/opportunities/discover/v2`;
  const { signal, ...body } = opts ?? {};
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...body }),
    signal,
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch opportunities");
  }
  return response.json() as Promise<DiscoverV2ResponseDto>;
}

/** Profile-derived filter prefills returned by GET /opportunities/filters/defaults. */
export interface FilterDefaultsDto {
  naics: string[];
  setAsides: string[];
  states: string[];
  cities: string[];
  hasCapabilityStatement: boolean;
  /** True when the unfiltered For You feed has a match to show. Null when the
   *  backend could not read it (unknown). Optional: an older backend omits it. */
  hasLiveMatches?: boolean | null;
  /** True when the member has a profile vector. Optional: an older backend omits it. */
  hasProfileVector?: boolean;
  /** The profile's NAICS codes plus the ones the matching engine counts as
   *  related. Optional: a backend that predates the field omits it. */
  alliedNaics?: string[];
}

/** GET /opportunities/filters/defaults — filter facet values from the user's profile. */
export async function fetchFilterDefaults(locationId: string): Promise<FilterDefaultsDto> {
  const url = `${API_BASE_URL}/opportunities/filters/defaults?locationId=${encodeURIComponent(locationId)}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch filter defaults");
  }
  return response.json() as Promise<FilterDefaultsDto>;
}

export interface ScoresResponseDto {
  data: DiscoverV2OpportunityDto[];
  counts: { all: number; bid: number; lean: number; pass: number };
  total: number;
  page: number;
  totalPages: number;
}

/** GET /opportunities/discover/v2/scores — returns pre-computed scored opportunities for a location. */
export async function fetchDiscoverScores(
  locationId: string,
  opts?: { page?: number; limit?: number; sort?: "match" | "deadline" | "newest" },
): Promise<ScoresResponseDto> {
  const params = new URLSearchParams({ locationId });
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.sort) params.set("sort", opts.sort);
  const url = `${API_BASE_URL}/opportunities/discover/v2/scores?${params}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch opportunity scores");
  }
  return response.json() as Promise<ScoresResponseDto>;
}

/** GET /opportunities/discover/v2/:oppKey — returns full detail for one opportunity. */
export async function fetchOpportunityV2(
  oppKey: string,
  locationId?: string,
): Promise<DiscoverV2DetailDto> {
  const params = locationId ? `?locationId=${encodeURIComponent(locationId)}` : "";
  const url = `${API_BASE_URL}/opportunities/discover/v2/${oppKey}${params}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch opportunity");
  }
  return response.json() as Promise<DiscoverV2DetailDto>;
}

/** Per-state city gazetteer entry, with opportunity counts per city. */
export interface CityGroupDto {
  state: string;
  cities: { city: string; count: number }[];
}

/** GET /opportunities/filters/cities — city gazetteer, optionally scoped to one state. */
export async function fetchCities(state?: string): Promise<CityGroupDto[]> {
  const params = state ? `?state=${encodeURIComponent(state)}` : "";
  const url = `${API_BASE_URL}/opportunities/filters/cities${params}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch cities");
  }
  return response.json() as Promise<CityGroupDto[]>;
}

/** Per-facet-value result counts for the filters drawer. */
export type FacetCountsDto = {
  states: Record<string, number>;
  cities: Record<string, number>;
  naics: Record<string, number>;
  setAsides: Record<string, number>;
  valueBuckets: Record<string, number>;
  dueWindow: Record<string, number>;
};

/** POST /opportunities/discover/v2/counts — result counts per facet value for the current filter selection. */
export async function fetchFacetCounts(
  filters: ServerFilters,
  signal?: AbortSignal,
): Promise<FacetCountsDto> {
  const url = `${API_BASE_URL}/opportunities/discover/v2/counts`;
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
    signal,
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch facet counts");
  }
  return response.json() as Promise<FacetCountsDto>;
}
