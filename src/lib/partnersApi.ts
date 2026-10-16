import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import { stateName } from "./vocab/usStates";

/**
 * Partners API — the company lens on the award record.
 *
 * Serves a PRECOMPUTED ranking. Building it groups awards by awardee across a 33M
 * row collection, so it is a batch job; this endpoint is a point lookup against the
 * result. That is why the response carries `pending` — the answer may not exist yet.
 *
 * Identity is the authenticated GHL session, resolved server-side.
 */

export type PartnerTier = "strong" | "good" | "stretch";
export type PartnerVerdict = "partner_play" | "competitor" | "recompete_watch";

/**
 * Plain-English verdict labels. A first-time federal bidder reads at about a
 * sixth-grade level, so these replace jargon rather than glossing it — a tooltip
 * means the primary text failed.
 */
export const VERDICT_LABEL: Record<PartnerVerdict, string> = {
  partner_play: "Good match",
  competitor: "They bid against you",
  recompete_watch: "Jobs coming up again",
};

export interface RankReason {
  signal: string;
  /** One short sentence. Shown to the member as-is. */
  text: string;
  /** What the sentence is derived from — no unsourced claim reaches a member. */
  /** Omitted when no plain-English label resolved — never a NAICS code (item 7). */
  evidence?: string;
}

export interface PartnerBench {
  /**
   * Render as "at least N", NEVER an exact figure — public subcontract filings are
   * incomplete, so the true number is always higher than what we can see.
   */
  distinctSubs: number;
  repeatSubs: number;
  trend: "growing" | "steady" | "declining" | "unknown";
}

export interface PrimeCandidate {
  awardeeKey: number;
  uei: string | null;
  name: string;
  cageCode: string | null;
  website: string | null;
  /** True when the company cleared every gate — the ranked-feed population. A
   *  company opened by key can be false: it still opens, on real facts. */
  isCandidate?: boolean;
  /** One plain-English line per failed gate. Empty when `isCandidate` is true. */
  gateFailureReasons?: string[];
  bench: PartnerBench;
  trade: { proximity: "direct" | "adjacent" | "tangential"; naicsCodes: string[] };
  geography: {
    /** Null = not measured (e.g. a nationwide member) — never "everywhere" (1)
     *  or "nowhere" (0). Render accordingly rather than treating null as 0. */
    inStateAwardShare: number | null;
    statesPerformed: string[];
    /**
     * Karthik feedback (Sep 2026) — up to five cities this company has
     * actually performed work in, most-frequent first. Raw as HigherGov sends
     * it (uppercase, e.g. "ANN ARBOR") — title-cased for display in
     * `whereTheyWork()`, never here. Empty on a rollup that predates the city
     * fold; `whereTheyWork()` degrades to states-only in that case.
     */
    topCitiesByCount: { city: string; count: number }[];
    /** Displayed only. Reachability comes from where the WORK is, never HQ. */
    hqState: string | null;
  };
  economics: {
    maxAwardUsd: number;
    /** Null when the rollup has no median sample yet. */
    medianAwardUsd: number | null;
    totalAwardedUsd: number;
    awardCount: number;
    momentum: number | null;
    recompeteMonthsOut: number | null;
    numberOfOffersAvg: number | null;
  };
  tier: PartnerTier;
  verdict: PartnerVerdict;
  /** Internal ordering only — never rendered. A bare number means nothing to a human. */
  score: number;
  /**
   * Per-signal contribution to `score`. Ordering input only — like `score`, it is
   * NEVER rendered to a member; the reason sentences are the explanation.
   */
  scoreBreakdown: Record<string, number>;
  reasons: RankReason[];
  flags: { id: string; text: string }[];
  asOf: string;
  /** D10 — the largest scoreBreakdown delta vs. the next-ranked company, in plain
   *  English. Null for the last company (no next one to compare against). */
  whyAboveNext: string | null;
}

export interface PartnersFeedResponse {
  partners: PrimeCandidate[];
  computedAt: string | null;
  /** Never computed yet — say "we're finding your partners", not "none found". */
  pending: boolean;
  /** The stored ranking predates the member's current profile. */
  stale: boolean;
  /** No trade on file, so there is no lane to rank against. */
  needsProfile: boolean;
}

/** GET /partners — the member's precomputed ranking. */
export async function fetchPartners(signal?: AbortSignal): Promise<PartnersFeedResponse> {
  const response = await apiFetch(`${API_BASE_URL}/partners`, { signal });
  if (!response.ok) {
    return await buildApiError(response, "Failed to load partners");
  }
  return response.json() as Promise<PartnersFeedResponse>;
}

/**
 * GET /partners/company/:awardeeKey — one company, found even when it is not in
 * the member's ranked feed (an award winner who fails a gate, or whose feed has
 * not been computed yet). 404s when we hold no rollup for that key at all.
 */
export async function fetchPartnerCompany(
  awardeeKey: number,
  signal?: AbortSignal,
): Promise<{ company: PrimeCandidate; inMatches: boolean } | null> {
  const response = await apiFetch(`${API_BASE_URL}/partners/company/${awardeeKey}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) {
    return await buildApiError(response, "Failed to load that company");
  }
  return response.json() as Promise<{ company: PrimeCandidate; inMatches: boolean }>;
}

// ── presentation helpers ────────────────────────────────────────────────────

export function usd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  // Round, and group. Obligated figures carry cents, so the raw value rendered
  // as "$420.97" — false precision on a number a member only reads for scale.
  // Seen in production on a market median.
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Bench size is always a floor. See PartnerBench.distinctSubs. */
export function atLeastSubs(bench: PartnerBench): string {
  return `at least ${bench.distinctSubs} ${bench.distinctSubs === 1 ? "firm" : "firms"}`;
}

/**
 * Title-cases a place name stored uppercase, e.g. HigherGov's
 * "ANN ARBOR" -> "Ann Arbor". Distinct from `titleCaseCity` in
 * businessProfile.tsx, which title-cases a LOWERCASE portal value — applying
 * that here would leave every letter after the first of each word uppercase
 * ("ANN ARBOR" -> "ANN ARBOR", unchanged). A city NAME is not the register
 * prose CLAUDE.md's no-re-casing rule protects (that rule is about
 * `award_description_original`, which carries part numbers and MIL specs);
 * "Ann Arbor" is safe and correct.
 */
function titleCasePlace(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Full state names for up to three codes, e.g. ["CA", "TX"] -> "California, Texas". */
function stateNames(codes: string[]): string {
  return codes.slice(0, 3).map(stateName).join(", ");
}

/**
 * Where they work, in plain words, naming real places — never a vague "near
 * you" with nothing behind it. Falls back to the states themselves rather
 * than claiming a distance we cannot compute — we have no city centroids, so
 * "12 miles away" would be invented.
 *
 * `topCitiesByCount` is empty on a rollup that predates the city fold (a
 * rebuild is mid-flight as of Sep 2026), which is the common case today —
 * this degrades to the states-only sentence in that case, not to nothing.
 */
export function whereTheyWork(p: PrimeCandidate): string {
  const states = p.geography.statesPerformed.filter(Boolean);
  if (states.length === 0) return "We do not know where they work.";

  const cities = p.geography.topCitiesByCount.filter((c) => c.city);
  const fraction = p.geography.inStateAwardShare;
  const topCity = cities[0];

  if (topCity) {
    const place = titleCasePlace(topCity.city);
    // Null = not measured (e.g. a nationwide member) — name the place without
    // a comparative "near you" claim we never actually computed.
    if (fraction === null) return `Their most common job site is ${place}.`;
    const share = Math.round(fraction * 100);
    if (share >= 80)
      return `Almost all their work is in ${place} and nearby, in ${stateNames(states)}.`;
    if (fraction >= 0.4) return `A good share of their jobs are near you, including in ${place}.`;
    if (share > 0)
      return `Some of their jobs are near you. Their most common job site is ${place}.`;
    return `Their most common job site is ${place}, in ${stateNames(states)}.`;
  }

  // No city rollup yet — states-only, with full names instead of codes.
  if (fraction === null) return `They work in ${stateNames(states)}.`;
  const share = Math.round(fraction * 100);
  if (share >= 80) return `Almost all their work is in ${stateNames(states)}.`;
  if (fraction >= 0.4) return "A good share of their jobs are near you.";
  if (share > 0) return "Some of their jobs are near you.";
  return `They work in ${stateNames(states)}.`;
}

// ── pipeline ────────────────────────────────────────────────────────────────

/**
 * The outreach stages, named as a member would say them. Ernie's eight, in order
 * — see partners-prd.md §5.1 and deltas-2026-08.md D6. Must match the backend's
 * `PIPELINE_STAGES` in `partner-pipeline.service.ts`.
 */
export const PIPELINE_STAGES = [
  "saved",
  "researching",
  "contacted",
  "following_up",
  "on_their_bench",
  "teaming",
  "active_partner",
  "worked_together",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/** Ernie's plain-English labels — what the member reads on the board. */
export const STAGE_LABEL: Record<PipelineStage, string> = {
  saved: "Saved",
  researching: "Researching",
  contacted: "Contacted",
  following_up: "Follow-up",
  on_their_bench: "On their vendor list",
  teaming: "Teaming discussion",
  active_partner: "Working together",
  worked_together: "Finished a job for them",
};

/**
 * The stage's official term, shown secondary under the plain label — same pattern
 * the profile uses on `jobs_done`. Only two stages carry government jargon worth
 * naming; every other stage has no separate term.
 */
export const STAGE_TERM: Partial<Record<PipelineStage, string>> = {
  on_their_bench: "Qualified",
  worked_together: "Past performance",
};

/**
 * The next real event, in her words — first person and past tense. Used for the
 * forward arrow's accessible name: "They put me on their vendor list. Moves
 * Barnhill Contracting to On their vendor list." With eight columns a bare
 * direction is not enough to say where you land. See deltas-2026-08.md §D6.
 */
export const STAGE_NEXT_ACTION: Partial<Record<PipelineStage, string>> = {
  saved: "I am looking into them",
  researching: "I contacted them",
  contacted: "I am waiting to hear back",
  following_up: "They put me on their vendor list",
  on_their_bench: "We are talking about a job",
  teaming: "We are working together now",
  active_partner: "I finished a job for them",
};

export interface PipelineEntry {
  awardeeKey: number;
  companyName: string;
  stage: PipelineStage;
  sourceTag: string;
  savedAt: string;
  updatedAt: string;
}

// ── the market strip ────────────────────────────────────────────────────────

export interface MarketEvent {
  awardId: string;
  title: string;
  agency: string;
  winner: { name: string; awardeeKey: number | null };
  obligated: number | null;
  /** A FLOOR on when the work existed — render as "around", never "on". */
  awardedAt: string | null;
  city: string | null;
  state: string | null;
}

export interface MarketSummary {
  totalAwardedUsd12mo: number;
  awardCount12mo: number;
  medianAwardUsd: number;
  events: MarketEvent[];
  /**
   * Which KIND of empty, when it is empty. `no_trade` (nothing on file to total)
   * and `quiet_market` (we looked, the lane bought nothing) both come back as
   * zero but need different sentences — "$0" answers neither honestly.
   */
  state: "ok" | "no_trade" | "quiet_market";
}

/** GET /partners/market — totals for the member's lane, plus the recent wins. */
export async function fetchMarket(signal?: AbortSignal): Promise<MarketSummary> {
  const response = await apiFetch(`${API_BASE_URL}/partners/market`, { signal });
  if (!response.ok) {
    return await buildApiError(response, "Failed to load your market");
  }
  return response.json() as Promise<MarketSummary>;
}

/** GET /partners/pipeline */
export async function fetchPipeline(signal?: AbortSignal): Promise<PipelineEntry[]> {
  const response = await apiFetch(`${API_BASE_URL}/partners/pipeline`, { signal });
  if (!response.ok) {
    return await buildApiError(response, "Failed to load your partners list");
  }
  const body = (await response.json()) as { entries: PipelineEntry[] };
  return body.entries;
}

/** POST /partners/pipeline — idempotent. */
export async function addToPipeline(
  awardeeKey: number,
  companyName: string,
  sourceTag: string,
): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/partners/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ awardeeKey, companyName, sourceTag }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to save that company");
  }
}

/** PATCH /partners/pipeline/:awardeeKey — stages may move backwards. */
export async function setPipelineStage(awardeeKey: number, stage: PipelineStage): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/partners/pipeline/${awardeeKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to update that company");
  }
}

/** DELETE /partners/pipeline/:awardeeKey — idempotent. */
export async function removeFromPipeline(awardeeKey: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/partners/pipeline/${awardeeKey}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to remove that company");
  }
}

// ── "not right for me" (D11) ────────────────────────────────────────────────

/**
 * POST /partners/suppress — hides a company from this member's ranked feed from
 * now on. Idempotent.
 */
export async function suppressPartner(awardeeKey: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/partners/suppress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ awardeeKey }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to hide that company");
  }
}

/** DELETE /partners/suppress/:awardeeKey — idempotent. */
export async function unsuppressPartner(awardeeKey: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/partners/suppress/${awardeeKey}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to undo that");
  }
}
