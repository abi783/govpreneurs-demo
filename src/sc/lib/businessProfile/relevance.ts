/**
 * Which catalog rows this member's record actually needs.
 * Pure: no React, no Prisma, no clock.
 *
 * Only ever decides whether to ASK. A row she has answered is her record and is
 * never hidden by this — a trade can change, and a caterer-turned-cleaner still
 * holds the permits she uploaded.
 */

import type { CatalogField } from "./catalog";
import { fromMb } from "./legacyShapes";
import { isAnswered } from "./mbValue";
import type { RecordFieldPayload } from "./payload";

/** The trades the catalog tags rows with. */
export type TradeTag = NonNullable<CatalogField["trade"]>;

/**
 * The trades this member works in, or `null` when she has not said yet.
 *
 * `null` is not the empty set: empty means "she told us, and it is not food",
 * `null` means "we do not know". A row is dropped only on positive evidence of
 * a different trade, so an unknown trade hides nothing.
 */
export type MemberTrades = ReadonlySet<TradeTag> | null;

/** The one field where she says what work she does. */
const INDUSTRY_KEY = "primary_industry";

/**
 * `workTypeTaxonomy` ids whose work is handling food — all asked for health
 * permits and food handler cards by the same buyers. Lodging and events are not
 * here: a hotel buys catering rather than holding the permit.
 */
const FOOD_WORK_TYPES: ReadonlySet<string> = new Set([
  "food_service_and_catering",
  "food_beverage_and_tobacco_manufacturing",
  "food_and_grocery_distribution",
]);

/**
 * `categories` has held three vocabularies and rows are never rewritten, so all
 * three are on disk: today's ids, the old `TRADES` slug (bare `"food"`), and
 * seed data (`"food-service"`). Matching only the set above would read a live
 * caterer as "not a caterer". Token equality, not substring: `nonfood_x` is not
 * food.
 */
const FOOD_TOKEN = "food";
const SLUG_SEPARATORS = /[^a-z0-9]+/;

function isFoodCategory(categoryId: string): boolean {
  const slug = categoryId.toLowerCase();
  return FOOD_WORK_TYPES.has(slug) || slug.split(SLUG_SEPARATORS).includes(FOOD_TOKEN);
}

/** Read when a row has codes and no category — how a learned fact arrives. */
const FOOD_NAICS_PREFIXES: readonly string[] = ["311", "312", "445", "4244", "722"];

const NO_TRADES: ReadonlySet<TradeTag> = new Set();
const FOOD_TRADES: ReadonlySet<TradeTag> = new Set<TradeTag>(["food"]);

/** Her stored `{ categories, naics }`, or null when there is nothing to read. */
function industryOf(row: RecordFieldPayload | undefined): { categories: string[]; naics: string[] } | null {
  if (!row || !isAnswered(row.value)) return null;
  // The one lowering; a second reading of the fused shape would drift from
  // `legacyShapes`.
  const lowered = fromMb(INDUSTRY_KEY, row.value)[INDUSTRY_KEY];
  if (lowered === null || typeof lowered !== "object") return null;
  const { categories, naics } = lowered as { categories?: unknown; naics?: unknown };
  const asIds = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return { categories: asIds(categories), naics: asIds(naics) };
}

function isFood(industry: { categories: string[]; naics: string[] }): boolean {
  if (industry.categories.some(isFoodCategory)) return true;
  return industry.naics.some((code) => FOOD_NAICS_PREFIXES.some((p) => code.startsWith(p)));
}

/** What she has told us she does. `null` until `primary_industry` is readable. */
export function tradesOf(fields: readonly RecordFieldPayload[]): MemberTrades {
  const industry = industryOf(fields.find((f) => f.fieldKey === INDUSTRY_KEY));
  if (!industry) return null;
  if (industry.categories.length === 0 && industry.naics.length === 0) return null;
  return isFood(industry) ? FOOD_TRADES : NO_TRADES;
}

/** Whether this row is worth putting in front of her at all. */
export function worthAsking(field: CatalogField, trades: MemberTrades): boolean {
  if (!field.trade) return true;
  // Not having said what she does is not evidence that she is not a caterer.
  if (trades === null) return true;
  return trades.has(field.trade);
}
