// Shared NAICS description cache — ONE lookup path for every surface that has
// to turn a 6-digit code into words. Extracted verbatim from WarmStartWizard.tsx
// (which owned it privately) when the enrichment journey's NAICS picker needed
// the same thing; a second cache would mean a second set of network calls and
// two answers to "what is 238160".
//
// Seeded from the partial static catalog so a caller never blocks on the network
// before rendering, then filled in the background from GET /naics/descriptions.

import { fetchNaicsDescriptions } from "./preview";
import { NAICS_BY_CODE } from "./mock/govTaxonomy";

/** Backend cap on one /naics/descriptions call. */
const MAX_CODES_PER_CALL = 100;

const descriptions = new Map<string, string>(Object.entries(NAICS_BY_CODE));
const pending = new Map<string, Promise<void>>();

/** The cached description for a code, or undefined until one is fetched. */
export function describeNaics(code: string): string | undefined {
  return descriptions.get(code);
}

/**
 * Fetches (once) the descriptions for any codes not yet cached. Never throws —
 * an unresolved code falls back to its bare number at the call site, so the
 * picker and the wizard tree keep rendering when the lookup is down.
 */
export async function ensureNaicsDescriptions(codes: string[]): Promise<void> {
  const missing = codes.filter((c) => !descriptions.has(c));
  if (missing.length === 0) return;
  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += MAX_CODES_PER_CALL) {
    batches.push(missing.slice(i, i + MAX_CODES_PER_CALL));
  }
  await Promise.all(
    batches.map(async (batch) => {
      const key = batch.join(",");
      let inFlight = pending.get(key);
      if (!inFlight) {
        inFlight = fetchNaicsDescriptions(batch)
          .then((rows) => {
            for (const row of rows) descriptions.set(row.code, row.description);
          })
          .catch(() => {
            /* label falls back to the bare code — never block on the lookup */
          });
        pending.set(key, inFlight);
      }
      await inFlight;
    }),
  );
}
