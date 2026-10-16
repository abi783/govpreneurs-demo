import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import type { GrantAnalysis } from "./grant/types";

/**
 * grantAnalysisApi.ts — client for POST /grants-take/analysis, the live Grant v2
 * surface (the full GrantAnalysis object). Gated to the grant_v2 cohort on the
 * backend; the frontend only calls it when `session.grantV2` is true.
 *
 * `analysis` is null when there's no score record yet — the caller then falls
 * back to the local synthesize. A non-ok response throws (buildApiError), which
 * the loader treats the same as a null: fall back, never a broken card.
 */
export async function fetchGrantAnalysis(oppKey: string): Promise<GrantAnalysis | null> {
  const response = await apiFetch(`${API_BASE_URL}/grants-take/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oppKey }),
  });
  if (!response.ok) {
    return buildApiError(response, "Failed to load Grant analysis");
  }
  const body = (await response.json()) as { analysis: GrantAnalysis | null };
  return body.analysis ?? null;
}
