"use client";

// Module-level NAICS description cache + background batched fetch, PORTED
// from Hunter's WarmStartWizard (frontend-v2 `src/components/Hunter/
// WarmStartWizard.tsx`, `naicsDescriptionCache`/`ensureNaicsDescriptions`).
// Backed by `/api/hunter/naics-descriptions` (our own server proxy — see
// src/lib/hunter/partnerClient.ts) instead of calling Hunter directly, so
// the shared partner key never reaches the browser.
//
// No hardcoded partial catalog here (unlike Hunter's NAICS_BY_CODE seed) —
// this repo has no NAICS description data of its own; every code resolves
// through the fetch, falling back to "NAICS <code>" until it lands.
//
// The batching and caching themselves live in `codeDescriptions.ts`, shared
// with the PSC picker; this module is the NAICS-shaped face of it.

import { createDescriptionCache, searchCodes } from "./codeDescriptions";

export interface NaicsSearchResult {
  code: string;
  description: string;
}

const naics = createDescriptionCache("/api/hunter/naics-descriptions");

/** Fetches descriptions for any of `codes` not already cached, in batches of
 *  ≤100 (backend cap). Never throws — a failed batch just leaves those codes
 *  unresolved (callers fall back to "NAICS <code>"). */
export function ensureNaicsDescriptions(codes: string[]): Promise<void> {
  return naics.ensure(codes);
}

export function describeNaicsFromCache(code: string): string | undefined {
  return naics.describe(code);
}

/** GET /api/hunter/naics-search?q= — the Trades field's "Search all NAICS
 *  codes" escape hatch. */
export function searchNaics(q: string): Promise<NaicsSearchResult[]> {
  return searchCodes<NaicsSearchResult>("/api/hunter/naics-search", q);
}
