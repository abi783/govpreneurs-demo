// "Ones not open to you" — the reason groups, from the WHOLE board.
//
// The page used to group the orders the browser had loaded, so it said "50
// orders reviewed" and "1 order" per reason on a board of 11,404. It now forms
// its groups from the code census, which counts every open order by its
// acquisition-code pair, and asks the server for each group's orders by pair.
//
// ONE OWNER FOR THE RULES. A census row carries only the pair, and the pair is
// all `restrictionOf()`, `mayBid()` and `ourGap()` read. So each row is ruled on
// by a stand-in order carrying just that pair — the same predicates the board
// uses to put an order in its restricted pool, never a second copy of them.
//
// The "For you" tab reads the same rows the other way round: the pairs she MAY
// bid, which the feed's `bidCodes` parameter narrows the walk to.
import type { MicroOrder } from "./order";
import {
  eligibleByCode,
  mayBid,
  ourGap,
  restrictionOf,
  type CensusRow,
  type Restriction,
} from "./relevance";

/** One acquisition-code pair, as the feed's `codes` parameter takes it. */
const CODE_PAIR = /^[0-9A-Z]{2}$/;

/**
 * A census row as the pair the feed takes and a stand-in order carrying just
 * that pair, or `null` when the row holds no readable pair. A null half is a
 * code that never arrived, so it is never a pair.
 */
function ruledRow(row: CensusRow): { pair: string; order: MicroOrder } | null {
  if (row.amc == null || row.amsc == null) return null;
  const pair = `${row.amc.trim()}${row.amsc.trim()}`.toUpperCase();
  if (!CODE_PAIR.test(pair)) return null;
  // The stand-in carries only the two fields every predicate reads.
  return { pair, order: { amc: row.amc, amsc: row.amsc } as unknown as MicroOrder };
}

/**
 * The pairs a member may bid, sorted and without repeats — what the "For you"
 * walk sends as `bidCodes`. A pair is in only when `eligibleByCode()` says so,
 * the same predicate `queryOrders()` applies to the For you rows.
 */
export function biddablePairsFromCensus(rows: readonly CensusRow[]): string[] {
  const pairs = new Set<string>();
  for (const row of rows) {
    const ruled = ruledRow(row);
    if (ruled != null && eligibleByCode(ruled.order)) pairs.add(ruled.pair);
  }
  return [...pairs].sort();
}

/**
 * Where a group sits on "Ones not open to you": the route it carries decides.
 *
 * ONE OWNER FOR THE ORDER. `small-orders.restricted.tsx` sorts the groups it
 * builds from the rows in hand and this file sorts the groups it builds from
 * the census, and the two are the same page in two states. They held one
 * expression each and drifted apart the moment a fourth route existed.
 *
 * A route with a next step she can take herself ranks above one without. `sar`
 * ends in a form. `qpl` ends in a qualified products list — a real route, and
 * one she can start for later orders. `unknown` ends in a person who can read
 * the code. `approved` ends in neither, but it names who DLA is asking. `none`
 * is the dead end.
 *
 * `qpl` was inserted at rank 1 and the three below it each moved down one. The
 * ORDER of the four that were here is unchanged, which is what the pages that
 * read this function assert.
 */
export function routeRank(route: Restriction["route"]): number {
  if (route === "sar") return 0;
  if (route === "qpl") return 1;
  if (route === "unknown") return 2;
  if (route === "approved") return 3;
  return 4;
}

export type ReasonGroup = {
  /** The singular headline and body, as `restrictionOf()` writes them. */
  head: string;
  body: string;
  fixable: boolean;
  route: Restriction["route"];
  /** The acquisition-code pairs ("1C", "3Z") whose orders make up the group. */
  pairs: string[];
  /** Open orders the census counts under those pairs. The server's own count
   *  replaces it once the group's orders arrive. */
  estimate: number;
};

/**
 * The reason groups over the census, the ones with a form first. A row is in
 * the restricted pool exactly when the board would put it there: a ruling
 * exists, it does not let a newcomer supply the part, and it is not a gap the
 * board shows with a note. Rows with no product code are left out, because the
 * board holds those apart rather than grouping them by reason.
 */
export function reasonGroupsFromCensus(rows: readonly CensusRow[]): ReasonGroup[] {
  const groups: ReasonGroup[] = [];
  for (const row of rows) {
    const ruled = row.hasPsc ? ruledRow(row) : null;
    if (ruled == null) continue;
    const { pair, order } = ruled;
    const reason = restrictionOf(order);
    if (reason == null || mayBid(order) || ourGap(order) != null) continue;

    const found = groups.find((g) => g.body === reason.body);
    if (found) {
      if (!found.pairs.includes(pair)) found.pairs.push(pair);
      found.estimate += row.orders;
    } else {
      groups.push({
        head: reason.headline,
        body: reason.body,
        fixable: reason.fixable,
        route: reason.route,
        pairs: [pair],
        estimate: row.orders,
      });
    }
  }
  for (const g of groups) g.pairs.sort();
  return groups.sort((a, b) => routeRank(a.route) - routeRank(b.route));
}
