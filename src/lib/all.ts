import { API_BASE_URL, apiFetch, buildApiError } from "./api";
import type { ServerFilters, ServerSort } from "./discoverApi";
import type { PreviewOpportunityDto } from "./preview";

export interface AllResponse {
  opportunities: PreviewOpportunityDto[];
  page: number;
  limit: number;
  total: number;
}

/** Fetches a page of the unscored "All Opportunities" feed (whole active corpus,
 *  no filters pre-applied). Items reuse the preview DTO/card mapping. */
export async function fetchAll(
  _locationId: string,
  opts?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: ServerFilters;
    sort?: ServerSort;
  },
): Promise<AllResponse> {
  const url = `${API_BASE_URL}/opportunities/all`;
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
  if (!response.ok) return await buildApiError(response, "Failed to fetch opportunities");
  return response.json() as Promise<AllResponse>;
}
