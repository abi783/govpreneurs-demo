import { apiFetch, buildApiError, API_BASE_URL } from './api';

export interface HunterTake {
  oppKey: string;
  line: string;
}

interface HuntersTakeResponse {
  takes: HunterTake[];
}

/**
 * POST /hunters-take/feed — one plain-English "should I bid?" line per opp.
 * The user is taken from the GHL session (X-GHL-Token, attached by apiFetch),
 * so only the opp ids are sent. Capped at 50 per call.
 *
 * Returns a map of oppKey → line. Opps with no line are simply absent (render
 * the card without a take). Best-effort: callers should tolerate a rejection.
 */
export async function fetchHuntersTakes(
  oppKeys: string[],
  concurrency?: number,
): Promise<Map<string, string>> {
  const ids = oppKeys.slice(0, 50);
  if (ids.length === 0) return new Map();

  const res = await apiFetch(`${API_BASE_URL}/hunters-take/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oppKeys: ids, ...(concurrency ? { concurrency } : {}) }),
  });
  if (!res.ok) {
    return await buildApiError(res, 'Failed to fetch Hunter takes');
  }
  const body = (await res.json()) as HuntersTakeResponse;
  return new Map((body.takes ?? []).map((t) => [t.oppKey, t.line]));
}
