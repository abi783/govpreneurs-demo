// The server half of the Small Orders board, for the sample orders: the paged
// feed, the code census, the category counts and the fit scores. The same rules
// as the production service, over 20 orders instead of 16,000.

import { byMember, own } from "@/demo/member";
import type { SmallOrdersFeed } from "@/lib/microPurchases/api";
import type { MicroCategory } from "@/lib/microPurchases/categories";
import type { MicroOrder } from "@/lib/microPurchases/order";
import { calendarDay } from "../dates";
import { ORDERS, ORDER_META } from "./data";

const pack = own(
  import.meta.glob<typeof import("@/demo/members/agency/orders/data")>("/src/demo/members/*/orders/data.ts", { eager: true }),
);

/** Production serves 50 orders a page. */
export const PAGE_SIZE = 50;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "16 October 2026", the way the board's banner writes the posting day. */
function writtenOut(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * The industry codes the "For you" tab covers: food making, food service and the
 * kitchen and packaging goods around them. Production reads Amira's profile
 * codes and their allied codes; the sample has one fixed set.
 * DEMO: the agency's set is her own five codes, and no DLA order carries one.
 */
const FOR_YOU_NAICS_PREFIXES: readonly string[] = byMember({
  caterer: ["311", "312", "322", "326", "332", "333", "424", "722"],
  pack: pack.FOR_YOU_NAICS,
});

/**
 * DEMO: what an empty "Orders for you" says when the member's trade has no DLA
 * orders at all: Hunter's sentence and one link on. Null keeps production's
 * empty state. For the board route: Hunter's line on that tab, and the empty
 * state's one button.
 */
export const FOR_YOU_NOTE: typeof pack.FOR_YOU_NOTE | null = byMember({
  caterer: null,
  pack: pack.FOR_YOU_NOTE,
});

function inForYouLane(o: MicroOrder): boolean {
  return o.naics != null && FOR_YOU_NAICS_PREFIXES.some((p) => o.naics!.startsWith(p));
}

export function pairOf(o: Pick<MicroOrder, "amc" | "amsc">): string {
  return `${o.amc ?? ""}${o.amsc ?? ""}`.toUpperCase();
}

function fitOf(o: MicroOrder): number {
  return ORDER_META.get(o.id)?.fit ?? 0;
}

/** Best fit first, then the order that closes first. A stable walk order. */
function walkOrder(a: MicroOrder, b: MicroOrder): number {
  return fitOf(b) - fitOf(a) || (a.closesOn ?? "9999").localeCompare(b.closesOn ?? "9999") || a.id.localeCompare(b.id);
}

/** The day the board is for. A date only, as the client reads it. */
export function boardDay(): string {
  return calendarDay(0);
}

export interface WalkQuery {
  view: "for-you" | "all";
  categories: readonly string[];
  codes: readonly string[];
  /** The code pairs she may bid. Null asks for no such narrowing. */
  bidCodes: readonly string[] | null;
}

function matching(q: WalkQuery): MicroOrder[] {
  return ORDERS.filter((o) => {
    if (q.view === "for-you" && !inForYouLane(o)) return false;
    if (q.bidCodes != null && !q.bidCodes.includes(pairOf(o))) return false;
    if (q.categories.length > 0 && !q.categories.includes(o.category)) return false;
    if (q.codes.length > 0 && !q.codes.includes(pairOf(o))) return false;
    return true;
  }).sort(walkOrder);
}

// The cursor is opaque to the client. It holds the walk and how many rows were served.
interface Cursor extends WalkQuery {
  served: number;
}

function encodeCursor(c: Cursor): string {
  return btoa(JSON.stringify(c));
}

/** The cursor, or null when the token is not one this module wrote. */
export function decodeCursor(token: string): Cursor | null {
  try {
    const c = JSON.parse(atob(token)) as Cursor;
    if (typeof c.served !== "number" || c.served < 0) return null;
    if (c.view !== "for-you" && c.view !== "all") return null;
    return {
      view: c.view,
      categories: Array.isArray(c.categories) ? c.categories : [],
      codes: Array.isArray(c.codes) ? c.codes : [],
      bidCodes: Array.isArray(c.bidCodes) ? c.bidCodes : null,
      served: c.served,
    };
  } catch {
    return null;
  }
}

export function feedPage(q: WalkQuery, served = 0, pageSize = PAGE_SIZE): SmallOrdersFeed {
  const all = matching(q);
  const orders = all.slice(served, served + pageSize);
  const reached = served + orders.length;
  const remaining = all.length - reached;
  return {
    orders,
    asOf: boardDay(),
    postedOnLabel: writtenOut(newestPosting()),
    count: orders.length,
    total: all.length,
    boardTotal: ORDERS.length,
    more:
      remaining > 0
        ? {
            cursor: encodeCursor({ ...q, served: reached }),
            loads: Math.min(pageSize, remaining),
            remaining,
          }
        : null,
  };
}

function newestPosting(): string {
  return ORDERS.map((o) => o.postedOn).sort().slice(-1)[0] ?? boardDay();
}

/** One census row per acquisition-code pair and status. */
export function codeCensus(): { pairs: { amc: string | null; amsc: string | null; hasPsc: boolean; dibbsStatus: string | null; orders: number }[]; total: number } {
  const counts = new Map<string, { amc: string | null; amsc: string | null; hasPsc: boolean; dibbsStatus: string | null; orders: number }>();
  for (const o of ORDERS) {
    const key = `${o.amc}|${o.amsc}|${o.dibbsStatus}`;
    const row = counts.get(key);
    if (row) row.orders += 1;
    else counts.set(key, { amc: o.amc, amsc: o.amsc, hasPsc: true, dibbsStatus: o.dibbsStatus, orders: 1 });
  }
  return { pairs: [...counts.values()], total: ORDERS.length };
}

/**
 * How many orders sit in each board category for a set of industry codes.
 * Production matches the exact code; the sample matches the first three digits,
 * so the allied codes that Hunter adds count too.
 */
export function categoryCounts(naics: readonly string[]): { total: number; rows: { category: MicroCategory; orders: number }[] } {
  const prefixes = new Set(naics.map((c) => c.trim().slice(0, 3)).filter((c) => c.length === 3));
  const counts = new Map<MicroCategory, number>();
  for (const o of ORDERS) {
    if (o.naics == null || !prefixes.has(o.naics.slice(0, 3))) continue;
    counts.set(o.category, (counts.get(o.category) ?? 0) + 1);
  }
  const rows = [...counts.entries()].map(([category, orders]) => ({ category, orders }));
  rows.sort((a, b) => b.orders - a.orders);
  return { total: rows.reduce((n, r) => n + r.orders, 0), rows };
}

export function fitScores(ids: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ids) {
    const meta = ORDER_META.get(id);
    if (meta) out[id] = meta.fit;
  }
  return out;
}
