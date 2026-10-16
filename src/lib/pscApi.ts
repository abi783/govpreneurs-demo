// GET /psc/search — keyword lookup over the federal Product/Service Code
// taxonomy the backend holds (feature 11's `PscSearchController`). Shape copied
// from lib/naicsApi.ts, its NAICS sibling: a thin adapter over `apiFetch`, so
// the authenticated call carries the X-GHL-Token header the route requires.
//
// The taxonomy is 2,344 codes. It is looked up, never shipped — a client-side
// copy is a copy that goes stale, which is what this replaces.

import { apiFetch, buildApiError, API_BASE_URL } from "./api";

/** One row of the PSC register: the code, and the register's words for it. */
export interface PscSearchResult {
  code: string;
  description: string;
}

/**
 * GET /psc/search?q= — the PSC rows matching a keyword or code (the endpoint
 * caps the list at 20). An empty query never reaches the network; the endpoint
 * answers `[]` for one, so there is nothing to ask. Throws `ApiError` on a
 * failed response — `useDebouncedSearch` owns the degradation.
 */
export async function searchPsc(q: string, signal?: AbortSignal): Promise<PscSearchResult[]> {
  const settled = q.trim();
  if (!settled) return [];
  const params = new URLSearchParams({ q: settled });
  const response = await apiFetch(`${API_BASE_URL}/psc/search?${params}`, { signal });
  if (!response.ok) return await buildApiError(response, "Failed to search PSC codes");
  // Narrowed to the two fields the picker renders. The row also carries
  // `segment`/`groupCode`/`groupTitle`, which nothing here shows.
  const body = (await response.json()) as PscSearchResult[];
  return body.map((row) => ({ code: row.code, description: row.description }));
}
