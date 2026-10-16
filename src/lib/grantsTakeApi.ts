import { apiFetch, buildApiError, API_BASE_URL } from "./api";

/**
 * grantsTakeApi.ts — client for POST /grants-take/opportunity, the single-opp
 * Grant's Take for the detail page. Shapes mirror the backend GrantTake
 * (backend/src/grants-take/grants-take.types.ts). `take` is null when there's no
 * score record yet — the FE shows the "Grant is still analyzing" state.
 */

export type GrantRecommendation = "bid" | "lean_bid" | "pass";
export type GrantStatus = "good" | "warn" | "bad";
export type GrantDataCompleteness = "full" | "partial" | "sparse";

export type GrantFieldKey =
  | "eligibility"
  | "scope_fit"
  | "location"
  | "contract_size"
  | "proposal_readiness"
  | "your_edge";

export interface GrantFieldTake {
  status: GrantStatus;
  line: string;
}

export interface GrantTake {
  oppKey: string;
  recommendation: GrantRecommendation;
  // TEMP FIX: Hunter's fit-only verdict. Grant may override `recommendation`
  // downward, which makes this card disagree with the feed (Hunter's) for the
  // same opp. The chip renders `hunter_verdict` so the two surfaces agree. Drop
  // this back to `recommendation` once Grant/Hunter divergence is resolved.
  hunter_verdict: GrantRecommendation;
  /**
   * One-sentence rationale for the verdict — the "statement" shown beside the
   * verdict chip (the Review section). Optional: takes cached before this field
   * existed won't carry it, so the card falls back to the confidence caption.
   */
  verdict_summary?: string;
  next_step: string;
  fields: Record<GrantFieldKey, GrantFieldTake>;
  data_completeness: GrantDataCompleteness;
}

export interface GrantsTakeResponse {
  take: GrantTake | null;
}

/** POST /grants-take/opportunity — the six-field Grant's Take for one opp. */
export async function fetchGrantsTake(oppKey: string): Promise<GrantTake | null> {
  const response = await apiFetch(`${API_BASE_URL}/grants-take/opportunity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oppKey }),
  });
  if (!response.ok) {
    return buildApiError(response, "Failed to load Grant's Take");
  }
  const body = (await response.json()) as GrantsTakeResponse;
  return body.take ?? null;
}
