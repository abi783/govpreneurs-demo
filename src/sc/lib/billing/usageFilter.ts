/**
 * The filters of the wallet usage history: type and date range (PRD §8.4).
 *
 * Layer: Entities. Pure: no I/O, no env; the caller passes the clock. The
 * drawer filters the list that it already has, so a filter change makes no
 * request.
 *
 * The types are the two kinds of charge that we record: DFY services and paid
 * calls. A membership renewal is recorded as a call. Top-ups and refunds are
 * not in the history yet, so the filter does not offer them.
 */
import {
  USAGE_RANGE_12_MONTHS_LABEL,
  USAGE_RANGE_30_DAYS_LABEL,
  USAGE_RANGE_90_DAYS_LABEL,
  USAGE_RANGE_ALL_LABEL,
  USAGE_TYPE_ALL_LABEL,
  USAGE_TYPE_CALLS_LABEL,
  USAGE_TYPE_SERVICES_LABEL,
} from "@sc/lib/walletCopy";
import { roundToCent } from "./walletSplit";

/** A charge kind, or every kind. */
export type UsageTypeFilter = "all" | "service" | "booking";

/** A date range, counted back from now. */
export type UsageRangeFilter = "30d" | "90d" | "12m" | "all";

/** The filter state of the history. */
export interface UsageFilter {
  type: UsageTypeFilter;
  range: UsageRangeFilter;
}

/** The charge fields that the filter and the total read. */
export interface FilterableCharge {
  kind: "service" | "booking";
  at: string;
  amount: number;
}

/** One option of a filter control. */
export interface FilterOption<V> {
  value: V;
  label: string;
}

/** What the history shows when it opens (PRD §8.4: the last 90 days). */
export const DEFAULT_USAGE_FILTER: UsageFilter = { type: "all", range: "90d" };

/** The type options, in screen order. */
export const USAGE_TYPE_OPTIONS: readonly FilterOption<UsageTypeFilter>[] = [
  { value: "all", label: USAGE_TYPE_ALL_LABEL },
  { value: "service", label: USAGE_TYPE_SERVICES_LABEL },
  { value: "booking", label: USAGE_TYPE_CALLS_LABEL },
];

/** The date range options, in screen order. */
export const USAGE_RANGE_OPTIONS: readonly FilterOption<UsageRangeFilter>[] = [
  { value: "30d", label: USAGE_RANGE_30_DAYS_LABEL },
  { value: "90d", label: USAGE_RANGE_90_DAYS_LABEL },
  { value: "12m", label: USAGE_RANGE_12_MONTHS_LABEL },
  { value: "all", label: USAGE_RANGE_ALL_LABEL },
];

const DAY_MS = 86_400_000;
const DAYS_IN_YEAR = 365;

/** The number of days back each range reaches. "all" has no limit. */
const RANGE_DAYS: Record<Exclude<UsageRangeFilter, "all">, number> = {
  "30d": 30,
  "90d": 90,
  "12m": DAYS_IN_YEAR,
};

/** The earliest time the range keeps, or null for no limit. */
function rangeStart(range: UsageRangeFilter, now: Date): number | null {
  return range === "all" ? null : now.getTime() - RANGE_DAYS[range] * DAY_MS;
}

/** The charges that match the filter, in their original order. A call dated in the future stays in. */
export function filterUsage<T extends FilterableCharge>(items: readonly T[], filter: UsageFilter, now: Date): T[] {
  const start = rangeStart(filter.range, now);
  return items.filter(
    (item) =>
      (filter.type === "all" || item.kind === filter.type) &&
      (start === null || new Date(item.at).getTime() >= start),
  );
}

/** The sum of the charge amounts, to the cent. */
export function usageTotal(items: readonly Pick<FilterableCharge, "amount">[]): number {
  return roundToCent(items.reduce((sum, item) => sum + item.amount, 0));
}
