import { apiFetch, buildApiError, API_BASE_URL } from "./api";

/** Wire shape of one entry in the GET /naics/descriptions response body. */
export interface NaicsDescriptionDto {
  code: string;
  description: string;
}

/** The endpoint answers 400 above this many codes (naics-search.controller.ts). */
export const MAX_NAICS_CODES_PER_REQUEST = 100;

/** Splits the codes into request-sized batches. The last batch can be shorter. */
function batchCodes(codes: string[]): string[][] {
  const batches: string[][] = [];
  for (let start = 0; start < codes.length; start += MAX_NAICS_CODES_PER_REQUEST) {
    batches.push(codes.slice(start, start + MAX_NAICS_CODES_PER_REQUEST));
  }
  return batches;
}

/** Requests one batch of codes and returns its code-to-description pairs. */
async function fetchBatch(batch: string[], signal?: AbortSignal): Promise<[string, string][]> {
  const params = new URLSearchParams({ codes: batch.join(",") });
  const url = `${API_BASE_URL}/naics/descriptions?${params}`;
  const response = await apiFetch(url, { signal });
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch NAICS descriptions");
  }
  // The backend omits a code the taxonomy does not know, so that code simply
  // has no entry in the Map. Never fabricate one.
  const body = (await response.json()) as NaicsDescriptionDto[];
  return body.map((entry) => [entry.code, entry.description]);
}

/**
 * GET /naics/descriptions — resolves NAICS codes to taxonomy descriptions.
 * The distinct-code list is unbounded, so this sends one request per batch of
 * MAX_NAICS_CODES_PER_REQUEST codes and merges every batch into one Map.
 */
export async function fetchNaicsDescriptions(
  codes: string[],
  signal?: AbortSignal,
): Promise<Map<string, string>> {
  const unique = [...new Set(codes.map((code) => code.trim()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  const batches = await Promise.all(batchCodes(unique).map((batch) => fetchBatch(batch, signal)));
  return new Map(batches.flat());
}
