// Small orders — fit from her profile.
//
// Two things on the board read her business profile:
//   · Best first ranks by her matching-engine score, and falls back to her NAICS
//     codes for an order the engine has not scored (see `fitScore()`);
//   · "What do you sell?" opens with categories pre-selected from those codes,
//     counted over the whole open corpus by the server.
//
// Both are conveniences. Every load here fails soft: no fit means Best first
// ranks as it did before fit existed, and no suggestion means the sheet opens
// with nothing picked.
import { bus, useLiveSlice } from "../eventBus";
import { fetchFilterDefaults } from "../discoverApi";
import { fetchMatchScores, fetchNaicsCategories, type NaicsCategoryCounts } from "./api";
import type { MicroCategory } from "./categories";

export interface ProfileFit {
  profileNaics: string[];
  alliedNaics: string[];
  /** Categories to pre-select in "What do you sell?". Empty means none. */
  suggestedCategories: MicroCategory[];
  /** Her engine score per order id, for the orders asked about so far. */
  matchScores: Readonly<Record<string, number>>;
}

/** Fewer orders than this under her codes say nothing about what she sells. */
const MIN_ORDERS_TO_SUGGEST = 5;
/** A category must hold at least this share of those orders to be suggested. */
const MIN_SHARE_TO_SUGGEST = 0.1;
/** Never pre-select more than this many — a suggestion, not a guess at all. */
const MAX_SUGGESTED = 4;
/** Ids per fit request. The server takes up to 100; a board page is 50. */
const SCORE_BATCH = 50;

const EMPTY_FIT: ProfileFit = {
  profileNaics: [],
  alliedNaics: [],
  suggestedCategories: [],
  matchScores: {},
};

let fit: ProfileFit = EMPTY_FIT;
let profileLoading: Promise<void> | null = null;
const asked = new Set<string>();

function publish(next: Partial<ProfileFit>): void {
  fit = { ...fit, ...next };
  bus.publish("smallOrdersFit");
}

/** The fit loaded so far. */
export function profileFit(): ProfileFit {
  return fit;
}

/** The fit as a live value: re-renders when any part of it loads. */
export function useProfileFit(): ProfileFit {
  return useLiveSlice("smallOrdersFit", profileFit);
}

/**
 * The categories worth pre-selecting from a count of her orders: a real share
 * each, most orders first, never `other` (she cannot pick it), at most four.
 */
export function suggestCategories(counts: NaicsCategoryCounts): MicroCategory[] {
  if (counts.total < MIN_ORDERS_TO_SUGGEST) return [];
  return counts.rows
    .filter((row) => row.category !== "other")
    .filter((row) => row.orders / counts.total >= MIN_SHARE_TO_SUGGEST)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, MAX_SUGGESTED)
    .map((row) => row.category);
}

async function suggestionsFor(
  profileNaics: string[],
  alliedNaics: string[],
): Promise<MicroCategory[]> {
  if (profileNaics.length === 0) return [];
  const own = await fetchNaicsCategories(profileNaics);
  if (own != null && own.total >= MIN_ORDERS_TO_SUGGEST) return suggestCategories(own);
  // Her own codes reach too few orders to say anything. The related codes are
  // the ones the matching engine already treats as her trade.
  const widened =
    alliedNaics.length > profileNaics.length ? await fetchNaicsCategories(alliedNaics) : null;
  return widened == null ? [] : suggestCategories(widened);
}

/** Read her NAICS codes and the category suggestion, once per session. */
export function loadProfileFit(locationId: string): Promise<void> {
  if (profileLoading == null) {
    profileLoading = (async () => {
      try {
        const defaults = await fetchFilterDefaults(locationId);
        const profileNaics = defaults.naics ?? [];
        const alliedNaics = defaults.alliedNaics ?? profileNaics;
        publish({ profileNaics, alliedNaics });
        publish({ suggestedCategories: await suggestionsFor(profileNaics, alliedNaics) });
      } catch (error) {
        console.warn(
          `small-orders fit: could not read the profile — ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    })();
  }
  return profileLoading;
}

/** Fetch her engine scores for orders not asked about yet, a page at a time. */
export async function loadMatchScores(orderIds: string[]): Promise<void> {
  const fresh = orderIds.filter((id) => !asked.has(id));
  if (fresh.length === 0) return;
  for (const id of fresh) asked.add(id);
  for (let i = 0; i < fresh.length; i += SCORE_BATCH) {
    const scores = await fetchMatchScores(fresh.slice(i, i + SCORE_BATCH));
    if (Object.keys(scores).length > 0) publish({ matchScores: { ...fit.matchScores, ...scores } });
  }
}
