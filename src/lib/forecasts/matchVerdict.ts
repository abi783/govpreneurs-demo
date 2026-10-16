// The card's fit chip (ARCHITECTURE-forecasts-paginated.md, section 9). The chip is
// the tier of the member's `matches` row, in the same three verdict groups as the
// opportunities feed (lib/verdict.ts). The engine's own fit never makes a chip: it
// would be a second scale beside the matching engine's.

import { TIER_MAP } from "../discoverMapper";
import type { ForecastMatchRead } from "../forecastsApi";
import { matchTierToVerdict, type Verdict } from "../verdict";

/**
 * The chip for a card: priority or strong is "bid", stretch is "lean", low is "pass".
 * Null when the card has no match row, or when the forecast is no longer open: a
 * chip reads as an instruction, and it must not contradict the card's stale mark.
 */
export function matchVerdict(match: ForecastMatchRead | null, open: boolean): Verdict | null {
  if (!match || !open) return null;
  return matchTierToVerdict(TIER_MAP[match.tier]);
}
