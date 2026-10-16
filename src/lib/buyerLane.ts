/**
 * The buyer lane on the opportunities page: "All buyers", "Federal" or
 * "State and local".
 *
 * The lane is page state, not a filter. It stays the same when the member
 * changes tabs, it is not saved with a search, and "Clear all" does not reset
 * it. Each request on the page carries it as `filters.scopes`, and the server
 * applies it on `sourceType` (backend `opp-scope.util.ts`): `sled` is State
 * and local, and every other type, or no type, is Federal.
 */
import type { ServerFilters } from "./discoverApi";

/** One of the three lanes. `all` narrows nothing. */
export type BuyerLane = "all" | "federal" | "sled";

/** The lanes, in the order the switch shows them. */
export const BUYER_LANES: readonly BuyerLane[] = ["all", "federal", "sled"];

/** The label of each lane. The forecasts page uses the same words. */
export const BUYER_LANE_LABEL: Record<BuyerLane, string> = {
  all: "All buyers",
  federal: "Federal",
  sled: "State and local",
};

/** The accessible name of the switch. */
export const BUYER_LANE_QUESTION = "Who is buying?";

/** The server scope of a lane. Null for `all`, which sends no `scopes`. */
function laneScope(lane: BuyerLane): "fed" | "sled" | null {
  if (lane === "federal") return "fed";
  if (lane === "sled") return "sled";
  return null;
}

/** The request filters with the lane added. Returns the same object for `all`. */
export function withLane(filters: ServerFilters, lane: BuyerLane): ServerFilters {
  const scope = laneScope(lane);
  return scope ? { ...filters, scopes: [scope] } : filters;
}

/** The request filters of a list that carries no other filter (Saved). */
export function laneOnlyFilters(lane: BuyerLane): ServerFilters | undefined {
  const scope = laneScope(lane);
  return scope ? { scopes: [scope] } : undefined;
}

/**
 * The lane that Hunter's discovery scope asks for, or undefined when it asks
 * for none. Hunter sends `{ fed, sled }`: one side only is that lane, and both
 * sides is All buyers.
 */
export function laneFromScope(scope?: { fed: boolean; sled: boolean }): BuyerLane | undefined {
  if (!scope) return undefined;
  if (scope.fed && !scope.sled) return "federal";
  if (scope.sled && !scope.fed) return "sled";
  if (scope.fed && scope.sled) return "all";
  return undefined;
}
