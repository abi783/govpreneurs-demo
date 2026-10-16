import { apiFetch, API_BASE_URL } from "./api";
import type { BuyerCitation } from "./grant/types";

/**
 * Government Buyers API — one contracting office, from the register.
 *
 * These types mirror `backend/src/hg-awards/hg-office-figures.types.ts` and the
 * `BuyerCitation` the backend already ships to Grant. `BuyerCitation` is
 * imported rather than restated: it is the body of a `buyer:` pin, and a second
 * local copy would be free to drift from the one `resolvePublic` renders.
 *
 * NOTHING HERE THROWS. A buyer page that cannot reach the API shows its
 * explained empty state; it must never take the route down, and — more to the
 * point — it must never fall back to a plausible-looking figure. An absent
 * number is honest; an invented one is the whole problem this surface exists to
 * fix.
 */

/** What was actually counted to produce a figure. Never optional: a figure
 *  without its basis is an assertion. */
export interface FigureBasis {
  countedOver: number;
  filter: string;
  /** Derived from the rows counted — never a window we assert. */
  yearsCovered: string | null;
}

export interface CountedFigure<T> {
  value: T;
  basis: FigureBasis;
}

export interface SpendYear {
  fiscalYear: number;
  total: number;
  awards: number;
}

export interface OfficeAwardee {
  name: string;
  awards: number;
  total: number;
}

/** Counted figures for one office. `null` means WE COULD NOT COUNT IT — the
 *  surface renders "Not in the record" rather than dropping the row. */
export interface BuyerFigures {
  spendByYear: CountedFigure<SpendYear[]> | null;
  topAwardees: CountedFigure<OfficeAwardee[]> | null;
  setAsideAwards: CountedFigure<{ withSetAside: number; examined: number }> | null;
}

/** One directory row — identity only. */
export interface OfficeSummary {
  agencyKey: number;
  name: string;
  abbreviation: string | null;
  agencyType: string | null;
  isDefense: boolean;
}

export interface BuyerDetail {
  buyer: BuyerCitation;
  figures: BuyerFigures;
}

/** GET /buyers?q= — offices matching a name fragment. `[]` on any failure. */
export async function fetchBuyers(q: string): Promise<OfficeSummary[]> {
  const term = q.trim();
  if (!term) return [];
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/buyers?q=${encodeURIComponent(term)}`,
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { buyers?: unknown };
    return Array.isArray(body?.buyers) ? (body.buyers as OfficeSummary[]) : [];
  } catch {
    return [];
  }
}

/**
 * GET /buyers/:agencyKey — one office's register row and counted figures.
 *
 * `null` covers both "no such office" (a 404, a real answer) and "we could not
 * reach the register". The page cannot tell them apart and should not pretend
 * to: either way it has no record to show.
 */
export async function fetchBuyer(agencyKey: number): Promise<BuyerDetail | null> {
  if (!Number.isFinite(agencyKey)) return null;
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/buyers/${encodeURIComponent(String(Math.trunc(agencyKey)))}`,
    );
    if (!response.ok) return null;
    const body = (await response.json()) as BuyerDetail;
    return body && typeof body === "object" && body.buyer ? body : null;
  } catch {
    return null;
  }
}
