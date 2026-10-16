import type { OppCategory, OppScope } from './mock/opportunities';

/** Real opportunity fields used to build the "Key information" grid. */
export interface KeyInfoSource {
  noticeType?: string | null;
  setAside?: string | null;
  naicsCode?: string | null;
  classificationCode?: string | null;
  valEstLow?: number | null;
  valEstHigh?: number | null;
  placeOfPerformance?: { city?: string; state?: string } | null;
  agencyName?: string | null;
  solNumber?: string | null;
  scope?: OppScope;
  category?: OppCategory;
}

/** A single label/value row in the Key information grid. */
export interface KeyInfoRow {
  label: string;
  value: string;
  gloss?: string;
}

import { valueEstimate } from './money';
import { termGloss } from './filterGlosses';
import { NA, formatLocationNa } from './naDisplay';

/** Always renders a value: real "City, State" or the "NA" token when unknown. */
function formatLocation(pop: KeyInfoSource['placeOfPerformance']): string {
  return formatLocationNa(pop?.city, pop?.state);
}

/** Always renders a value: the estimate (lib/money.ts `valueEstimate`) or the "NA" token. */
function formatValue(low: number | null | undefined, high: number | null | undefined): string {
  return valueEstimate(low, high) ?? NA;
}

/** "Opportunity type" value combining scope + category (PRD CAT-6). */
function categoryTypeLabel(s: KeyInfoSource): string {
  const scopeWord = s.scope === 'sled' ? 'SLED' : 'Federal';
  switch (s.category) {
    case 'grant':
      return `${scopeWord} grant`;
    case 'forecast':
      return `${scopeWord} forecast`;
    case 'product_buy':
      return 'Product buy (DIBBS)';
    default:
      return `${scopeWord} contract`;
  }
}

/** Notice type, category-aware: RFQ for product buys, omitted for grant/forecast. */
function noticeTypeValue(s: KeyInfoSource): string | null | undefined {
  if (s.category === 'grant' || s.category === 'forecast') return null;
  if (s.category === 'product_buy') return 'RFQ';
  return s.noticeType;
}

/** Label + value-resolver per row, in display order. A null/blank value omits the row. */
const ROW_DEFS: ReadonlyArray<{
  label: string;
  glossKey?: string;
  resolve: (s: KeyInfoSource) => string | null | undefined;
}> = [
  { label: 'Opportunity type', resolve: categoryTypeLabel },
  { label: 'Notice type', glossKey: 'noticeType', resolve: noticeTypeValue },
  { label: 'Set-aside', resolve: (s) => s.setAside },
  { label: 'NAICS code', resolve: (s) => s.naicsCode },
  { label: 'Classification', resolve: (s) => s.classificationCode },
  { label: 'Estimated Contract Value', glossKey: 'estimatedContractValue', resolve: (s) => formatValue(s.valEstLow, s.valEstHigh) },
  { label: 'Place of Performance', glossKey: 'placeOfPerformance', resolve: (s) => formatLocation(s.placeOfPerformance) },
  { label: 'Agency', resolve: (s) => s.agencyName },
  { label: 'Solicitation #', resolve: (s) => s.solNumber },
];

/** Builds the Key information rows from real opportunity fields, omitting any row with no value. */
export function buildKeyInfo(src: KeyInfoSource): KeyInfoRow[] {
  const rows: KeyInfoRow[] = [];
  for (const { label, glossKey, resolve } of ROW_DEFS) {
    const value = resolve(src);
    if (value && value.trim().length > 0) {
      rows.push({ label, value: value.trim(), gloss: glossKey ? termGloss(glossKey) : undefined });
    }
  }
  return rows;
}
