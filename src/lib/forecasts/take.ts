// Grant's take on a forecast, as rows of How to win it (B8) and names in Sources (B15).
// The contract is ARCHITECTURE-forecasts-take.md section 9.
//
// Every figure here was counted over public records keyed by trade and buyer, not by
// this forecast (ledger A3). So each row carries, per figure, its basis and its source,
// resolved through the public-record pattern (`resolvePublic`). A fact that was not
// checked adds nothing: the row is left out, never shown as a zero. A take never
// changes the call, the paths or any other box (D-C4).

import type { Pin } from "../grant/types";
import { resolvePublic } from "../sources/publicRecords";
import { mentionsVendor } from "../sourceLink";
import type { ForecastTakeFact, ForecastTakeResponse } from "./grantTakeApi";
import type { ScoredForecast } from "./engine";
import { money } from "../money";
import { SOURCE_NAME, TAKE_COPY } from "./grantCopy";
import type { TakeCount, WinRow } from "./grant";

/** The most firm names a row lists. The rest are in the source sheet. */
const MAX_FIRMS = 3;
// The bounds below mirror the chat brief's in
// `backend/src/forecast-grant/forecast-grant-prompt.ts`, so the page and the brief cut a
// register value at the same length.
/** The longest firm name a row prints. Mirrors TAKE_FIRM_MAX. */
const MAX_NAME = 80;
/** The longest "matched on" filter a basis prints. Mirrors TAKE_MATCHED_ON_MAX. */
const MATCHED_ON_MAX = 120;
/** The longest award-years span a basis prints. Mirrors TAKE_YEARS_MAX. */
const YEARS_MAX = 40;
/** The most digits a NAICS code has. */
const NAICS_MAX_DIGITS = 6;
/** A NAICS code as the page prints it: two to six digits. */
const NAICS_CODE = new RegExp(`^\\d{2,${NAICS_MAX_DIGITS}}$`);
/** The decimals a fractional median prints, as the chat brief's `countText` does. */
const MEDIAN_DECIMALS = 1;

type Unit = keyof typeof TAKE_COPY.unit;
type Counted = Extract<ForecastTakeFact, { state: "counted" }>;

/** A register value on one line, with no bold marks, or null when it names the vendor. */
function clean(value: unknown, max = MAX_NAME): string | null {
  if (typeof value !== "string") return null;
  const t = value.replace(/\*/g, "").replace(/\s+/g, " ").trim();
  if (!t || mentionsVendor(t)) return null;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** A positive, finite number, or null. */
function positive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** A median as the chat brief prints it: whole, or with one decimal ("1.5"), never rounded to a whole. */
function medianText(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(MEDIAN_DECIMALS);
}

/** A counted fact whose basis names no vendor, or null. */
function countedFact(fact: ForecastTakeFact | undefined): Counted | null {
  if (!fact || fact.state !== "counted") return null;
  const { matchedOn, yearsCovered } = fact.basis;
  if (mentionsVendor(matchedOn) || mentionsVendor(yearsCovered)) return null;
  return fact;
}

/**
 * How a scan cap (`basis.atLeast`) bears on `countedOver`:
 *  · `total` — the capped number IS the count (other forecasts), so it reads "at least N";
 *  · `sample` — the cap stopped the read, and the figure was counted over exactly the N
 *    records read (set-aside awards), so the basis names N and the sentence says the rest.
 */
type CapMeaning = "total" | "sample";

/** One figure's basis line and source line. Null when the source does not resolve. */
function countOf(fact: Counted, unit: Unit, cap: CapMeaning): TakeCount | null {
  const pin: Pin = fact.source;
  const descriptor = resolvePublic(pin.provenance.ref, pin.provenance);
  if (!descriptor) return null;
  const { countedOver, atLeast } = fact.basis;
  const n = Math.round(countedOver);
  const amount = atLeast && cap === "total" ? TAKE_COPY.atLeast(n) : `${n}`;
  const matchedOn = clean(fact.basis.matchedOn, MATCHED_ON_MAX);
  if (!matchedOn) return null;
  return {
    basis: TAKE_COPY.basis(
      `${amount} ${TAKE_COPY.unit[unit](n)}`,
      matchedOn,
      clean(fact.basis.yearsCovered, YEARS_MAX),
    ),
    source: TAKE_COPY.source(descriptor.origin, descriptor.asOf, descriptor.lagNote),
    record: pin,
  };
}

/** A fact and its lines, or null when either is missing. */
function lineOf(fact: ForecastTakeFact | undefined, unit: Unit, cap: CapMeaning = "total") {
  const counted = countedFact(fact);
  const count = counted && countOf(counted, unit, cap);
  return counted && count ? { fact: counted, count } : null;
}

/** "Acme Catering (12), Beta Food Group (9)", from the market-winners tally. */
function topFirms(fact: Counted): string | null {
  const firms = fact.source.provenance.tally?.firms;
  if (!Array.isArray(firms)) return null;
  const named = firms
    .map((firm) => ({ name: clean(firm?.name), awards: positive(firm?.awards) }))
    .filter((x): x is { name: string; awards: number | null } => !!x.name)
    .slice(0, MAX_FIRMS);
  if (named.length === 0) return null;
  const list = named
    .map((x) => (x.awards ? `${x.name} (${Math.round(x.awards)})` : x.name))
    .join(", ");
  return TAKE_COPY.topFirms(list, named.length === 1);
}

function wonRow(take: ForecastTakeResponse): WinRow | null {
  const lead = lineOf(take.counted.marketWinners, "firms");
  const firms = lead && positive(lead.fact.figure);
  if (!lead || !firms) return null;
  const offers = lineOf(take.counted.fieldSize, "awards");
  const median = offers && positive(offers.fact.figure);
  const firmLine = topFirms(lead.fact);
  const body = [
    TAKE_COPY.won(Math.round(firms)),
    firmLine,
    median ? TAKE_COPY.offers(medianText(median)) : null,
  ];
  return {
    key: "won",
    body: body.filter(Boolean).join(" "),
    sources: [SOURCE_NAME.awardRecords],
    counted: [lead.count, ...(offers && median ? [offers.count] : [])],
    countsNote: TAKE_COPY.note.awards,
  };
}

/** The middle half of comparable awards, when the tally holds a valid one. */
function bandOf(fact: Counted): { low: number; high: number } | null {
  const tally = fact.source.provenance.tally;
  const low = positive(tally?.low);
  const high = positive(tally?.high);
  return low && high && low <= high ? { low, high } : null;
}

/** Where the estimate range sits against the band. "inside" only when the whole
 *  estimate is within the band; a range that crosses one edge only overlaps it. */
function placement(
  low: number,
  high: number,
  band: { low: number; high: number },
): keyof typeof TAKE_COPY.compare {
  if (high < band.low) return "below";
  if (low > band.high) return "above";
  if (low >= band.low && high <= band.high) return "inside";
  if (low <= band.low && high >= band.high) return "spans";
  return "overlaps";
}

/** Where the buyer's estimate sits against the band. A local value is a budget line
 *  (PRD B3), so a local forecast gets no comparison. */
function compareEstimate(
  f: ScoredForecast,
  band: { low: number; high: number },
  n: number,
): (Pick<WinRow, "ourRead" | "why"> & { line: string }) | null {
  if (f.lane !== "federal") return null;
  const low = positive(f.record.valLow) ?? positive(f.record.valHigh);
  const high = positive(f.record.valHigh) ?? low;
  if (!low || !high) return null;
  const where = placement(low, high, band);
  const estimate = TAKE_COPY.range(money(low), money(high));
  const middle = TAKE_COPY.range(money(band.low), money(band.high));
  return {
    line: TAKE_COPY.compare[where],
    ourRead: true,
    why: TAKE_COPY.compareWhy(estimate, n, middle),
  };
}

function paidRow(take: ForecastTakeResponse, f: ScoredForecast): WinRow | null {
  const lead = lineOf(take.counted.comparableAwards, "awards");
  const median = lead && positive(lead.fact.figure);
  if (!lead || !median) return null;
  const band = bandOf(lead.fact);
  const compared = band && compareEstimate(f, band, Math.round(lead.fact.basis.countedOver));
  const body = [
    TAKE_COPY.paid(money(median)),
    band ? TAKE_COPY.band(money(band.low), money(band.high)) : null,
    compared?.line ?? null,
  ];
  return {
    key: "paid",
    body: body.filter(Boolean).join(" "),
    sources: [SOURCE_NAME.awardRecords],
    counted: [lead.count],
    countsNote: TAKE_COPY.note.awards,
    ...(compared ? { ourRead: compared.ourRead, why: compared.why } : {}),
  };
}

/** A count that may be zero, such as set-aside awards: a counted zero is a real answer. */
function wholeCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

function officeRow(take: ForecastTakeResponse): WinRow | null {
  const buyer = lineOf(take.counted.buyer, "awards", "sample");
  const upcoming = lineOf(take.counted.upcoming, "forecasts");
  const setAside = buyer && wholeCount(buyer.fact.figure);
  const others = upcoming && positive(upcoming.fact.figure);
  const lines: string[] = [];
  const counted: TakeCount[] = [];
  const sources: string[] = [];
  const notes: string[] = [];
  if (buyer && setAside !== null) {
    const examined = Math.round(buyer.fact.basis.countedOver);
    lines.push(TAKE_COPY.setAside(setAside, examined, buyer.fact.basis.atLeast));
    counted.push(buyer.count);
    sources.push(SOURCE_NAME.officeRecord);
    notes.push(TAKE_COPY.note.setAside);
  }
  if (upcoming && others) {
    const n = Math.round(others);
    const naics = clean(upcoming.fact.source.provenance.forecast?.naicsCode, NAICS_MAX_DIGITS);
    lines.push(
      TAKE_COPY.upcoming(
        upcoming.fact.basis.atLeast ? TAKE_COPY.atLeast(n) : `${n}`,
        naics && NAICS_CODE.test(naics) ? naics : null,
        lines.length === 0,
      ),
    );
    counted.push(upcoming.count);
    sources.push(SOURCE_NAME.officeForecasts);
    notes.push(TAKE_COPY.note.forecasts);
  }
  if (lines.length === 0) return null;
  return { key: "office", body: lines.join(" "), sources, counted, countsNote: notes.join(" ") };
}

/**
 * The B8 rows a take adds, after the rows Grant's read already has. Empty for no take,
 * and for a take whose facts were not checked.
 */
export function takeWinRows(take: ForecastTakeResponse | null, f: ScoredForecast): WinRow[] {
  if (!take) return [];
  return [wonRow(take), paidRow(take, f), officeRow(take)].filter((r): r is WinRow => !!r);
}

/** The source names of the take rows on the page, for the Sources line (B15). */
export function takeSources(win: WinRow[]): string[] {
  return [...new Set(win.filter((w) => w.counted?.length).flatMap((w) => w.sources ?? []))];
}
