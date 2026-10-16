import { buildKeyInfo } from './keyInfo';

// Place of Performance and Estimated Contract Value always render now — they
// show "NA" when the notice omits them (or carries a placeholder), rather than
// being dropped from the grid.
const NA_ROWS = [
  { label: 'Estimated Contract Value', value: 'NA' },
  { label: 'Place of Performance', value: 'NA' },
];

describe('buildKeyInfo', () => {
  it('always leads with Opportunity type and shows NA for missing value/location', () => {
    expect(buildKeyInfo({}).map((r) => ({ label: r.label, value: r.value }))).toEqual([
      { label: 'Opportunity type', value: 'Federal contract' },
      ...NA_ROWS,
    ]);
  });

  it('includes present text fields as labeled rows in fixed order, omitting absent/empty ones', () => {
    const rows = buildKeyInfo({
      agencyName: 'Dept of Testing',
      noticeType: 'Solicitation',
      setAside: '   ', // whitespace → omitted
      naicsCode: '541511',
      solNumber: 'SOL-123',
    });
    expect(rows.map((r) => ({ label: r.label, value: r.value }))).toEqual([
      { label: 'Opportunity type', value: 'Federal contract' },
      { label: 'Notice type', value: 'Solicitation' },
      { label: 'NAICS code', value: '541511' },
      ...NA_ROWS,
      { label: 'Agency', value: 'Dept of Testing' },
      { label: 'Solicitation #', value: 'SOL-123' },
    ]);
    expect(rows[1].gloss).toBeTruthy(); // Notice type carries a gloss
  });

  it('labels opportunity type by scope + category and suppresses notice type for grants', () => {
    const rows = buildKeyInfo({ scope: 'sled', category: 'grant', noticeType: 'Federal Grant' });
    expect(rows.map((r) => ({ label: r.label, value: r.value }))).toEqual([
      { label: 'Opportunity type', value: 'SLED grant' },
      ...NA_ROWS,
    ]);
  });

  it('shows notice type RFQ for product buys', () => {
    const rows = buildKeyInfo({ category: 'product_buy', noticeType: 'Solicitation' });
    expect(rows.map((r) => ({ label: r.label, value: r.value }))).toEqual([
      { label: 'Opportunity type', value: 'Product buy (DIBBS)' },
      { label: 'Notice type', value: 'RFQ' },
      ...NA_ROWS,
    ]);
  });

  it('formats the estimated value as a range', () => {
    const rows = buildKeyInfo({ valEstLow: 100_000, valEstHigh: 500_000 });
    expect(rows.map((r) => ({ label: r.label, value: r.value }))).toEqual([
      { label: 'Opportunity type', value: 'Federal contract' },
      { label: 'Estimated Contract Value', value: '$100K–$500K' },
      { label: 'Place of Performance', value: 'NA' },
    ]);
  });

  it('formats a low end alone as a floor, not a range', () => {
    const rows = buildKeyInfo({ valEstLow: 250_000, valEstHigh: null });
    expect(rows.map((r) => ({ label: r.label, value: r.value }))).toEqual([
      { label: 'Opportunity type', value: 'Federal contract' },
      { label: 'Estimated Contract Value', value: '$250K or more' },
      { label: 'Place of Performance', value: 'NA' },
    ]);
  });

  it.each([
    [null, 5_000_000, 'Up to $5M'],
    [5_000_000, 10_000_000, '$5M–$10M'],
    [2_000_000, 2_000_000, '$2M'],
    [100_000_000, 100_000_000_000, '$100M or more'],
    [0, 750_000, 'Up to $750K'],
  ])('formats a %p to %p estimate as %s', (low, high, text) => {
    const rows = buildKeyInfo({ valEstLow: low, valEstHigh: high });
    expect(rows).toContainEqual(
      expect.objectContaining({ label: 'Estimated Contract Value', value: text }),
    );
  });

  it('shows NA for a zero estimated value', () => {
    const rows = buildKeyInfo({ valEstLow: 0, valEstHigh: 0 });
    expect(rows).toContainEqual(
      expect.objectContaining({ label: 'Estimated Contract Value', value: 'NA' }),
    );
  });

  it('shows NA when the estimate arrives as a "0" string (HigherGov stores strings)', () => {
    const rows = buildKeyInfo({
      valEstLow: '0' as unknown as number,
      valEstHigh: '0.00' as unknown as number,
    });
    expect(rows).toContainEqual(
      expect.objectContaining({ label: 'Estimated Contract Value', value: 'NA' }),
    );
  });

  it('drops a placeholder state and shows only the real city', () => {
    const rows = buildKeyInfo({ placeOfPerformance: { city: 'Arlington', state: 'N/A' } });
    expect(rows).toContainEqual(
      expect.objectContaining({ label: 'Place of Performance', value: 'Arlington' }),
    );
  });

  it('shows NA when both city and state are placeholders', () => {
    const rows = buildKeyInfo({ placeOfPerformance: { city: 'TBD', state: 'NA' } });
    expect(rows).toContainEqual(
      expect.objectContaining({ label: 'Place of Performance', value: 'NA' }),
    );
  });
});
