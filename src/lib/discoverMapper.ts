import { daysUntil } from './format';
import type { CardOpportunity, Dibbs, MatchTier, OppCategory } from './mock/opportunities';
import { valueEstimate } from './money';
import { NA, formatLocationNa } from './naDisplay';

export type DiscoverTier = 'priority' | 'strong' | 'stretch' | 'low';

export interface DiscoverV2OpportunityDto {
  id: string;
  title: string;
  scope: 'fed' | 'sled';
  geminiPlainEnglishTitle: string | null;
  agency: { name: string };
  noticeType: string;
  responseDeadline: string;
  postedDate: string; // ISO date string
  setAside: string;
  naicsCode: string;
  valEstLow: number | null;
  valEstHigh: number | null;
  placeOfPerformance: { state?: string; city?: string };
  status: string;
  quickSummary: string | null;
  relevanceScore: number;
  tier: DiscoverTier;
  matchReasons: string[];
  matchBreakdown: { eligible: boolean; certifiable?: boolean; [key: string]: unknown };
  scoreBreakdown: { businessCategoryMatch: number; certificationMatch: number; locationMatch: number };
  category?: OppCategory;
  dibbs?: Dibbs;
}

export const TIER_MAP: Record<DiscoverTier, MatchTier> = {
  priority: 'strong',
  strong:   'good',
  stretch:  'stretch',
  low:      'longshot',
};

/** The value estimate (lib/money.ts `valueEstimate`), or NA when neither end is real. */
function formatValue(low: number | null, high: number | null): string {
  return valueEstimate(low, high) ?? NA;
}

/** Maps a backend DiscoverV2OpportunityDto to a CardOpportunity for the card UI. */
export function mapToCardOpportunity(dto: DiscoverV2OpportunityDto): CardOpportunity {
  const { city, state } = dto.placeOfPerformance;
  const location = formatLocationNa(city, state);
  const category = dto.category ?? 'contract';
  // PRD CAT-4: product buys are always RFQ, regardless of the source notice type.
  const noticeType = category === 'product_buy' ? 'RFQ' : dto.noticeType || null;

  return {
    id: dto.id,
    title: dto.title,
    geminiPlainEnglishTitle: dto.geminiPlainEnglishTitle || undefined,
    agency: dto.agency.name,
    agencyAbbrev: dto.agency.name, // no abbreviation in HigherGov data — same as agency
    workType: noticeType ?? dto.noticeType,
    naicsCode: dto.naicsCode || undefined,
    setAside: dto.setAside || undefined,
    value: formatValue(dto.valEstLow, dto.valEstHigh),
    valEstLow: dto.valEstLow,
    valEstHigh: dto.valEstHigh,
    location,
    postedAt: dto.postedDate,
    // Real backend deadlines must be measured against the real current date —
    // not format.ts's frozen mock NOW — so the card's "Closes in N days" agrees
    // with the detail page, which also uses `new Date()`.
    daysUntilClose: daysUntil(dto.responseDeadline, new Date()),
    closeDateAbsolute: new Date(dto.responseDeadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    matchTier: TIER_MAP[dto.tier],
    matchScore: dto.relevanceScore,
    hunterReasoning: null,
    aiSummary: dto.quickSummary || undefined,
    eligibilityFlag: dto.matchBreakdown.eligible
      ? 'qualifies'
      : dto.matchBreakdown.certifiable
        ? 'needs-cert'
        : null,
    noticeType,
    mode: 'prime',
    scope: dto.scope ?? 'fed',
    category,
    dibbs: dto.dibbs,
  };
}
