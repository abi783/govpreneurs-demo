import { API_BASE_URL, apiFetch, buildApiError } from "./api";
import type { ServerFilters, ServerSort } from "./discoverApi";
import type { PreviewOpportunityDto } from "./preview";

export interface SavedResponse {
  opportunities: PreviewOpportunityDto[];
  page: number;
  limit: number;
  total: number;
}

/** Fetches a page of the "Saved" feed — the caller's saved opportunities
 *  (user_workspace.savedOpps), unscored, reusing the preview DTO/card mapping.
 *  Same request/response shape as the All feed; identity is server-derived. */
export async function fetchSaved(
  _locationId: string,
  opts?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: ServerFilters;
    sort?: ServerSort;
  },
): Promise<SavedResponse> {
  const url = `${API_BASE_URL}/opportunities/saved`;
  const response = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: opts?.page,
      limit: opts?.limit,
      filters: opts?.filters,
      sort: opts?.sort,
      ...(opts?.search ? { search: opts.search } : {}),
    }),
  });
  if (!response.ok) return await buildApiError(response, "Failed to fetch saved opportunities");
  return response.json() as Promise<SavedResponse>;
}
