import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import type { OpportunityFilters } from "./opportunityFilters";

/**
 * User workspace API — saved opportunities and searches. Identity is the
 * authenticated GHL session resolved server-side (no locationId is sent from
 * the client).
 */

/** A saved opportunity resolved to the fields the "My Bids" list needs. */
export interface SavedOppDetail {
  oppKey: string;
  title: string;
  agency: string;
  /** ISO-8601 response deadline, or null when the opportunity has none. */
  dueDate: string | null;
  /** HigherGov source (`sam`, `dibbs`, …). A `dibbs` row is a small order. */
  sourceType: string | null;
}

/** A saved search-filter set. `createdAt` is an ISO-8601 string from the API. */
export interface SavedSearch {
  id: string;
  name: string;
  filters: OpportunityFilters;
  createdAt: string;
}

/** GET /workspace — the user's saved opps and searches. */
export async function fetchWorkspace(): Promise<{
  savedOpps: string[];
  savedSearches: SavedSearch[];
}> {
  const response = await apiFetch(`${API_BASE_URL}/workspace`);
  if (!response.ok) {
    return await buildApiError(response, "Failed to load workspace");
  }
  return response.json() as Promise<{
    savedOpps: string[];
    savedSearches: SavedSearch[];
  }>;
}

/** GET /workspace/saved-opps/details — saved opps resolved to display rows. */
export async function fetchSavedOppDetails(): Promise<SavedOppDetail[]> {
  const response = await apiFetch(`${API_BASE_URL}/workspace/saved-opps/details`);
  if (!response.ok) {
    return await buildApiError(response, "Failed to load saved opportunities");
  }
  return response.json() as Promise<SavedOppDetail[]>;
}

/** POST /workspace/saved-opps — save an opportunity (idempotent). */
export async function addSavedOpp(oppKey: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/workspace/saved-opps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oppKey }),
  });
  if (!response.ok) {
    await buildApiError(response, "Failed to save opportunity");
  }
}

/** DELETE /workspace/saved-opps/:oppKey — un-save an opportunity (idempotent). */
export async function removeSavedOpp(oppKey: string): Promise<void> {
  const response = await apiFetch(
    `${API_BASE_URL}/workspace/saved-opps/${encodeURIComponent(oppKey)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    await buildApiError(response, "Failed to un-save opportunity");
  }
}

/** POST /workspace/saved-searches — save a named filter set; returns the record. */
export async function addSavedSearch(
  name: string,
  filters: OpportunityFilters,
): Promise<SavedSearch> {
  // `prefilled` is a Set, which JSON.stringify serializes to `{}` (losing every
  // member). Convert it to an array here so the tags survive the round trip;
  // `reviveSavedFilters` on the load side turns the array back into a Set.
  const serializable = { ...filters, prefilled: [...filters.prefilled] };
  const response = await apiFetch(`${API_BASE_URL}/workspace/saved-searches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, filters: serializable }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to save search");
  }
  return response.json() as Promise<SavedSearch>;
}

/** DELETE /workspace/saved-searches/:id — remove a saved search (idempotent). */
export async function removeSavedSearch(id: string): Promise<void> {
  const response = await apiFetch(
    `${API_BASE_URL}/workspace/saved-searches/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    await buildApiError(response, "Failed to remove saved search");
  }
}
