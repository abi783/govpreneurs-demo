// Resolves NAICS codes to taxonomy descriptions in ONE batched request per
// surface. Two hooks, one lookup:
//   - useNaicsDescriptionMap(codes) — the code list a surface renders.
//   - useNaicsDescriptions(cards)   — the feed page, which takes the page
//     rather than a code list so "one call per page" is structural.
// This module is also the single degradation point for the lookup: if the
// request fails, the Map stays empty, the cards come back untouched, and every
// caller falls back to the bare code. Shape copied from lib/useFacetCounts.ts.

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "./api";
import { fetchNaicsDescriptions } from "./naicsApi";
import type { CardOpportunity } from "./mock/opportunities";

const NO_DESCRIPTIONS: ReadonlyMap<string, string> = new Map();
const CODE_SEPARATOR = ",";

/** Sorted, de-duplicated, non-empty codes from the given list. */
function distinctCodes(codes: readonly string[]): string[] {
  const distinct = new Set<string>();
  for (const code of codes) {
    const trimmed = code.trim();
    if (trimmed) distinct.add(trimmed);
  }
  return [...distinct].sort();
}

/** The NAICS codes the given cards carry, in card order. */
function cardNaicsCodes(cards: readonly CardOpportunity[]): string[] {
  return cards.map((card) => card.naicsCode ?? "");
}

/**
 * Resolves the given NAICS codes to taxonomy descriptions in ONE batched
 * request per distinct code list. A code the taxonomy does not know, and a
 * request that fails, are both absent from the Map — the caller shows the bare
 * code and never an invented label.
 */
export function useNaicsDescriptionMap(codes: readonly string[]): ReadonlyMap<string, string> {
  const [descriptions, setDescriptions] = useState<ReadonlyMap<string, string>>(NO_DESCRIPTIONS);
  // The effect keys off the joined code list, so a re-render that shows the
  // same codes issues no new request.
  const codesKey = distinctCodes(codes).join(CODE_SEPARATOR);

  useEffect(() => {
    if (!codesKey) return;
    const controller = new AbortController();
    let cancelled = false;
    fetchNaicsDescriptions(codesKey.split(CODE_SEPARATOR), controller.signal)
      .then((resolved) => {
        if (!cancelled) setDescriptions(resolved);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = error instanceof ApiError ? error.status : "unknown";
        console.warn(`NAICS descriptions unavailable (status ${status})`);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [codesKey]);

  return descriptions;
}

/**
 * Returns the given cards with `naicsDescription` filled in where the taxonomy
 * resolves the code. One batched request per rendered page.
 */
export function useNaicsDescriptions(
  cards: readonly CardOpportunity[],
): readonly CardOpportunity[] {
  const descriptions = useNaicsDescriptionMap(cardNaicsCodes(cards));

  return useMemo(
    () =>
      cards.map((card) => {
        const code = card.naicsCode?.trim();
        const description = code ? descriptions.get(code) : undefined;
        return description ? { ...card, naicsDescription: description } : card;
      }),
    [cards, descriptions],
  );
}
