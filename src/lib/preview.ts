import { API_BASE_URL, apiFetch, buildApiError } from "./api";
import type { ServerFilters, ServerSort } from "./discoverApi";
import type { CardOpportunity, Dibbs, OppCategory } from "./mock/opportunities";
import { WORK_TYPES } from "./vocab/trades";
import { SET_ASIDES } from "./vocab/filterOptions";
import { stateName } from "./vocab/usStates";
import { NA, formatLocationNa } from "./naDisplay";
import { valueEstimate } from "./money";
import { daysUntil } from "./format";

export interface PreviewAnswers {
  naics: string[];
  states: string[];
  setAsides: string[];
  /** WORK_TYPES ids touched by the wizard's step-1 selection (optional; persisted for rehydration). */
  trades?: string[];
  /** Explicit city picks from step 2; bare city names (production city-id contract). */
  cities?: { city: string; state: string }[];
  /** Service-area rung chosen in step 2. */
  serviceArea?: "metro" | "nearby" | "state" | "state_plus_neighbors" | "national";
  /** Precise SAM set-aside/sole-source codes from step 3's level-2 picks. */
  setAsideCodes?: string[];
}

export interface PreviewOpportunityDto {
  id: string;
  solNumber?: string;
  title: string;
  scope: "fed" | "sled";
  agency: { name: string };
  noticeType: string;
  responseDeadline: string;
  postedDate: string;
  setAside: string;
  naicsCode: string;
  classificationCode: string;
  placeOfPerformance: { state?: string; city?: string; zip?: string };
  valEstLow: number | null;
  valEstHigh: number | null;
  quickSummary: string | null;
  category?: OppCategory;
  dibbs?: Dibbs;
}

export interface PreviewResponse {
  opportunities: PreviewOpportunityDto[];
  previewReady: boolean;
  page: number;
  limit: number;
  total: number;
}

export interface NaicsSearchResult {
  code: string;
  description: string;
}

/** Where "add your capability statement" sends a member: the ROADMAP, which is
 *  where uploading one actually happens. It previously pointed at its own
 *  menu-link (f0b947ba-…, the business-profile page), which is not where the
 *  upload lives — a member who followed the CTA could not complete the task it
 *  asked for, and the preview gate never lifted.
 *
 *  Deliberately delegates to {@link roadmapUrl} rather than keeping a second id:
 *  one destination, one constant to change if the menu-link is ever re-issued. */
export function capabilityStatementUrl(locationId: string): string {
  return roadmapUrl(locationId);
}

/** GHL custom-menu-link id for the Success Center's business-profile page
 *  (used by Hunter's "complete your business profile" prompt to deep link out
 *  to the real profile editor instead of the internal route). */
const BUSINESS_PROFILE_MENU_LINK_ID = "fd379a59-2793-4d35-bec4-4541260e12cc";

/** Builds the GHL Success Center URL for the business-profile custom menu
 *  link, scoped to the given location. */
export function businessProfileUrl(locationId: string): string {
  return `https://app.govpreneurs.com/v2/location/${locationId}/custom-menu-link/${BUSINESS_PROFILE_MENU_LINK_ID}`;
}

/** GHL custom-menu-link id for the Success Center's Roadmap page (used by the
 *  "Resolve on Roadmap" gate CTAs to deep link out to the real roadmap, which
 *  lives in a separate app — the v2 /roadmap route was removed). NOTE: this is
 *  currently the same menu-link as the business profile; if the roadmap gets
 *  its own custom-menu-link, only this id changes. */
const ROADMAP_MENU_LINK_ID = "fd379a59-2793-4d35-bec4-4541260e12cc";

/** Builds the GHL Success Center URL for the Roadmap custom menu link, scoped
 *  to the given location. The app runs inside the GHL iframe, so callers open
 *  this with target="_blank" to break out to a new tab rather than nesting GHL
 *  inside our iframe. */
export function roadmapUrl(locationId: string): string {
  return `https://app.govpreneurs.com/v2/location/${locationId}/custom-menu-link/${ROADMAP_MENU_LINK_ID}`;
}
/** Show the preview only to a member with nothing real to show: no live match,
 *  and no profile vector. An embedded member whose matches have all closed gets
 *  an honest empty feed instead, never the preview. Unknown (null/undefined)
 *  never shows the preview, and matches-generating takes precedence. */
export function shouldShowPreview(args: {
  hasLiveMatches: boolean | null | undefined;
  hasProfileVector: boolean | undefined;
  profileIndexing: boolean;
}): boolean {
  return args.hasLiveMatches === false && args.hasProfileVector !== true && !args.profileIndexing;
}

/** The value estimate (lib/money.ts `valueEstimate`), or NA when neither end is real. */
function formatValue(low: number | null, high: number | null): string {
  return valueEstimate(low, high) ?? NA;
}

/** Whole days until the deadline. NaN when there is no deadline on file, and
 *  negative once the deadline has passed — the card reads 0 as "Closes today",
 *  so an expired or missing deadline must never map to 0. The Saved feed keeps
 *  expired opportunities, so this case is common there. */
function daysUntilClose(iso: string, now: Date): number {
  const days = daysUntil(iso, now);
  // `daysUntil` rounds up, so a deadline that passed hours ago is -0.
  return new Date(iso).getTime() < now.getTime() ? Math.min(days, -1) : days;
}

/** Maps an unscored preview DTO to a card with NEUTRAL match signal — no tier,
 *  zero score, no eligibility flag — so the preview card shows no verdict. */
export function mapPreviewToCard(dto: PreviewOpportunityDto): CardOpportunity {
  const { city, state } = dto.placeOfPerformance;
  const location = formatLocationNa(city, state);
  const category = dto.category ?? "contract";
  // PRD CAT-4: product buys are always RFQ.
  const noticeType = category === "product_buy" ? "RFQ" : dto.noticeType || null;
  return {
    id: dto.id,
    title: dto.title,
    agency: dto.agency.name,
    agencyAbbrev: dto.agency.name,
    workType: noticeType ?? dto.noticeType,
    naicsCode: dto.naicsCode || undefined,
    setAside: dto.setAside || undefined,
    value: formatValue(dto.valEstLow, dto.valEstHigh),
    valEstLow: dto.valEstLow,
    valEstHigh: dto.valEstHigh,
    location,
    postedAt: dto.postedDate,
    daysUntilClose: daysUntilClose(dto.responseDeadline, new Date()),
    closeDateAbsolute: dto.responseDeadline
      ? new Date(dto.responseDeadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    matchTier: "longshot",
    matchScore: 0,
    hunterReasoning: null,
    aiSummary: dto.quickSummary || undefined,
    eligibilityFlag: null,
    noticeType,
    mode: "prime",
    scope: dto.scope,
    category,
    dibbs: dto.dibbs,
  };
}

export async function fetchPreview(
  locationId: string,
  opts?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: ServerFilters;
    sort?: ServerSort;
    signal?: AbortSignal;
  },
): Promise<PreviewResponse> {
  const url = `${API_BASE_URL}/opportunities/preview`;
  const { signal, ...body } = opts ?? {};
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) return await buildApiError(response, "Failed to fetch preview");
  return response.json() as Promise<PreviewResponse>;
}

export async function storePreviewAnswers(
  locationId: string,
  answers: PreviewAnswers,
): Promise<void> {
  const url = `${API_BASE_URL}/opportunities/preview/answers`;
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  if (!response.ok) await buildApiError(response, "Failed to save answers");
}

export async function searchNaics(q: string): Promise<NaicsSearchResult[]> {
  if (!q.trim()) return [];
  const url = `${API_BASE_URL}/naics/search?q=${encodeURIComponent(q)}`;
  const response = await apiFetch(url);
  if (!response.ok) return await buildApiError(response, "Failed to search NAICS");
  return response.json() as Promise<NaicsSearchResult[]>;
}

/** GET /naics/descriptions?codes=a,b,c — bulk description lookup (≤100 codes/call). */
export async function fetchNaicsDescriptions(codes: string[]): Promise<NaicsSearchResult[]> {
  if (codes.length === 0) return [];
  const url = `${API_BASE_URL}/naics/descriptions?codes=${encodeURIComponent(codes.join(","))}`;
  const response = await apiFetch(url);
  if (!response.ok) return await buildApiError(response, "Failed to fetch NAICS descriptions");
  return response.json() as Promise<NaicsSearchResult[]>;
}

/** GET /opportunities/preview/answers — stored wizard answers for rehydration, or null. */
export async function fetchPreviewAnswers(): Promise<PreviewAnswers | null> {
  const url = `${API_BASE_URL}/opportunities/preview/answers`;
  const response = await apiFetch(url);
  if (!response.ok) return await buildApiError(response, "Failed to fetch stored answers");
  const body = (await response.json()) as { answers: PreviewAnswers | null };
  return body.answers ?? null;
}

/** True when every filter-driving field on a stored answers blob is empty —
 *  i.e. the user hit "Explore without personalizing" (§4.4). Distinguishes the
 *  "answered but chose nothing" state from "hasn't answered yet" (which is
 *  `null`, handled separately by callers). */
export function isSkippedAnswers(answers: PreviewAnswers): boolean {
  return (
    (answers.naics?.length ?? 0) === 0 &&
    (answers.states?.length ?? 0) === 0 &&
    (answers.setAsides?.length ?? 0) === 0
  );
}

const WORK_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  WORK_TYPES.map((w) => [w.id, w.label]),
);

const SET_ASIDE_LABEL: Record<string, string> = Object.fromEntries(
  SET_ASIDES.map((s) => [s.id, s.label]),
);

/** Builds the personalized preview-banner summary from stored answers:
 *  up to 3 parts — trade, place, set-aside — joined by " · ". Never throws;
 *  falls back gracefully on old/partial blobs (missing `trades` → NAICS count). */
export function summarizePreviewAnswers(answers: PreviewAnswers): string {
  const parts: string[] = [];

  // 1. Trade summary.
  const trades = answers.trades ?? [];
  if (trades.length > 0) {
    const first = WORK_TYPE_LABEL[trades[0]] ?? trades[0];
    parts.push(trades.length > 1 ? `${first} +${trades.length - 1} more` : first);
  } else if ((answers.naics?.length ?? 0) > 0) {
    const n = answers.naics.length;
    parts.push(`${n} NAICS code${n === 1 ? "" : "s"}`);
  }

  // 2. Place summary — prefer an explicit city, else fall back to state(s).
  const cities = answers.cities ?? [];
  const states = answers.states ?? [];
  if (cities.length > 0) {
    const { city, state } = cities[0];
    parts.push(`near ${city}, ${state}`);
  } else if (states.length > 0) {
    const first = stateName(states[0]);
    parts.push(states.length > 1 ? `in ${first} +${states.length - 1} more` : `in ${first}`);
  }

  // 3. Set-aside summary (optional, first token only).
  const setAsides = answers.setAsides ?? [];
  if (setAsides.length > 0) {
    const label = SET_ASIDE_LABEL[setAsides[0]] ?? setAsides[0];
    parts.push(label);
  }

  return parts.join(" · ");
}
