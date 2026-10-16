import { mapToCardOpportunity, DiscoverV2OpportunityDto } from './discoverMapper';
import { NOW } from './format';

function makeDto(overrides: Partial<DiscoverV2OpportunityDto> = {}): DiscoverV2OpportunityDto {
  return {
    id: 'opp-1',
    title: 'Test Opportunity',
    scope: 'fed',
    geminiPlainEnglishTitle: null,
    agency: { name: 'USACE' },
    noticeType: 'Solicitation',
    responseDeadline: new Date(NOW.getTime() + 30 * 86400000).toISOString(),
    postedDate: NOW.toISOString(),
    setAside: 'SDVOSB',
    naicsCode: '238160',
    valEstLow: null,
    valEstHigh: null,
    placeOfPerformance: { city: 'Raleigh', state: 'NC' },
    status: 'active',
    quickSummary: 'A summary',
    relevanceScore: 80,
    tier: 'priority',
    matchReasons: ['reason one'],
    matchBreakdown: { eligible: true },
    scoreBreakdown: { businessCategoryMatch: 30, certificationMatch: 25, locationMatch: 20 },
    ...overrides,
  };
}

// ─── Cycle 1: tier mapping ───────────────────────────────────────────────────

describe('mapToCardOpportunity — tier mapping', () => {
  it('maps priority → strong', () => {
    expect(mapToCardOpportunity(makeDto({ tier: 'priority' })).matchTier).toBe('strong');
  });

  it('maps strong → good', () => {
    expect(mapToCardOpportunity(makeDto({ tier: 'strong' })).matchTier).toBe('good');
  });

  it('maps stretch → stretch', () => {
    expect(mapToCardOpportunity(makeDto({ tier: 'stretch' })).matchTier).toBe('stretch');
  });

  it('maps low → longshot', () => {
    expect(mapToCardOpportunity(makeDto({ tier: 'low' })).matchTier).toBe('longshot');
  });
});

// ─── Cycle 1b: scope passthrough ─────────────────────────────────────────────

describe('mapToCardOpportunity — scope', () => {
  it('passes through fed scope', () => {
    expect(mapToCardOpportunity(makeDto({ scope: 'fed' })).scope).toBe('fed');
  });

  it('passes through sled scope', () => {
    expect(mapToCardOpportunity(makeDto({ scope: 'sled' })).scope).toBe('sled');
  });
});

// ─── Cycle 2: location formatting ───────────────────────────────────────────

describe('mapToCardOpportunity — location', () => {
  it('formats city + state', () => {
    expect(mapToCardOpportunity(makeDto({ placeOfPerformance: { city: 'Raleigh', state: 'NC' } })).location).toBe('Raleigh, NC');
  });

  it('formats city only', () => {
    expect(mapToCardOpportunity(makeDto({ placeOfPerformance: { city: 'Raleigh' } })).location).toBe('Raleigh');
  });

  it('formats state only', () => {
    expect(mapToCardOpportunity(makeDto({ placeOfPerformance: { state: 'NC' } })).location).toBe('NC');
  });

  it('returns NA when neither city nor state', () => {
    expect(mapToCardOpportunity(makeDto({ placeOfPerformance: {} })).location).toBe('NA');
  });

  it('drops a placeholder state, keeping the real city', () => {
    expect(
      mapToCardOpportunity(makeDto({ placeOfPerformance: { city: 'Raleigh', state: 'TBD' } })).location,
    ).toBe('Raleigh');
  });

  it('returns NA when both parts are placeholders', () => {
    expect(
      mapToCardOpportunity(makeDto({ placeOfPerformance: { city: 'N/A', state: 'NA' } })).location,
    ).toBe('NA');
  });
});

// ─── Cycle 2b: value formatting ──────────────────────────────────────────────

describe('mapToCardOpportunity — value', () => {
  it('formats a real range', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 100_000, valEstHigh: 500_000 })).value).toBe('$100K–$500K');
  });

  it('shows NA when both bounds are zero', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 0, valEstHigh: 0 })).value).toBe('NA');
  });

  it('shows NA when both bounds are missing', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: null, valEstHigh: null })).value).toBe('NA');
  });

  it('drops a zero low bound instead of rendering "$0–", and reads the high end as a cap', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 0, valEstHigh: 500_000 })).value).toBe('Up to $500K');
  });

  it('drops a zero high bound, and reads the low end as a floor', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 250_000, valEstHigh: 0 })).value).toBe('$250K or more');
  });

  it('writes a low end alone as a floor and a high end alone as a cap', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 100_000_000, valEstHigh: null })).value).toBe('$100M or more');
    expect(mapToCardOpportunity(makeDto({ valEstLow: null, valEstHigh: 5_000_000 })).value).toBe('Up to $5M');
  });

  it('reads the $100B placeholder as no high end', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 100_000_000, valEstHigh: 100_000_000_000 })).value).toBe('$100M or more');
    expect(mapToCardOpportunity(makeDto({ valEstLow: null, valEstHigh: 100_000_000_000 })).value).toBe('NA');
  });

  it('keeps the en dash for a range', () => {
    expect(mapToCardOpportunity(makeDto({ valEstLow: 5_000_000, valEstHigh: 10_000_000 })).value).toBe('$5M–$10M');
  });
});

// ─── Cycle 3: daysUntilClose ─────────────────────────────────────────────────

describe('mapToCardOpportunity — daysUntilClose', () => {
  it('returns 30 for a deadline 30 days from now', () => {
    const deadline = new Date(Date.now() + 30 * 86400000).toISOString();
    expect(mapToCardOpportunity(makeDto({ responseDeadline: deadline })).daysUntilClose).toBe(30);
  });
});

// ─── Cycle 4: eligibilityFlag ────────────────────────────────────────────────

describe('mapToCardOpportunity — eligibilityFlag', () => {
  it('returns "qualifies" when eligible is true', () => {
    expect(mapToCardOpportunity(makeDto({ matchBreakdown: { eligible: true } })).eligibilityFlag).toBe('qualifies');
  });

  it('returns "needs-cert" when ineligible but certifiable', () => {
    expect(mapToCardOpportunity(makeDto({ matchBreakdown: { eligible: false, certifiable: true } })).eligibilityFlag).toBe('needs-cert');
  });

  it('returns null when ineligible and not certifiable', () => {
    expect(mapToCardOpportunity(makeDto({ matchBreakdown: { eligible: false, certifiable: false } })).eligibilityFlag).toBeNull();
  });

  it('returns null when eligible is false and certifiable is absent (legacy match record)', () => {
    expect(mapToCardOpportunity(makeDto({ matchBreakdown: { eligible: false } })).eligibilityFlag).toBeNull();
  });
});

// ─── Cycle 5: category + dibbs ───────────────────────────────────────────────

describe('mapToCardOpportunity — category & dibbs', () => {
  it('defaults category to contract when absent', () => {
    expect(mapToCardOpportunity(makeDto()).category).toBe('contract');
  });

  it('passes through grant and forecast categories', () => {
    expect(mapToCardOpportunity(makeDto({ category: 'grant' })).category).toBe('grant');
    expect(mapToCardOpportunity(makeDto({ category: 'forecast' })).category).toBe('forecast');
  });

  it('forces notice type to RFQ for product buys (PRD CAT-4)', () => {
    const card = mapToCardOpportunity(
      makeDto({ category: 'product_buy', noticeType: 'Solicitation' }),
    );
    expect(card.category).toBe('product_buy');
    expect(card.noticeType).toBe('RFQ');
    expect(card.workType).toBe('RFQ');
  });

  it('passes through the dibbs block', () => {
    const dibbs = { quantity: 108, deliverDays: 45, fastAward: true };
    expect(mapToCardOpportunity(makeDto({ category: 'product_buy', dibbs })).dibbs).toEqual(dibbs);
  });
});
