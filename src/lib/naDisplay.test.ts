import { isPlaceholderText, formatLocationNa, hasRealValue, toRealAmount } from './naDisplay';

describe('isPlaceholderText', () => {
  it.each([null, undefined, '', '   ', '0', '000', 'N/A', 'na', 'None', 'Unknown', 'TBD', 'Not specified'])(
    'treats %p as a placeholder',
    (v) => expect(isPlaceholderText(v)).toBe(true),
  );

  it.each(['Raleigh', 'NC', 'Fort Bragg', '20301'])('treats %p as real', (v) =>
    expect(isPlaceholderText(v)).toBe(false),
  );
});

describe('formatLocationNa', () => {
  it('joins real city and state', () => {
    expect(formatLocationNa('Raleigh', 'NC')).toBe('Raleigh, NC');
  });
  it('keeps only the real part when the other is a placeholder', () => {
    expect(formatLocationNa('Raleigh', 'TBD')).toBe('Raleigh');
    expect(formatLocationNa('N/A', 'NC')).toBe('NC');
  });
  it('returns NA when nothing is real', () => {
    expect(formatLocationNa('TBD', 'NA')).toBe('NA');
    expect(formatLocationNa(undefined, undefined)).toBe('NA');
  });
});

describe('toRealAmount', () => {
  it('parses numbers, dropping zero', () => {
    expect(toRealAmount(100_000)).toBe(100_000);
    expect(toRealAmount(0)).toBeNull();
    expect(toRealAmount(null)).toBeNull();
  });
  it('parses string bounds (HigherGov stores these as strings)', () => {
    expect(toRealAmount('0')).toBeNull();
    expect(toRealAmount('0.00')).toBeNull();
    expect(toRealAmount('500000')).toBe(500_000);
    expect(toRealAmount('$1,250,000')).toBe(1_250_000);
    expect(toRealAmount('')).toBeNull();
  });
});

describe('hasRealValue', () => {
  it('is false for missing or zero bounds (number or string)', () => {
    expect(hasRealValue(null, null)).toBe(false);
    expect(hasRealValue(0, 0)).toBe(false);
    expect(hasRealValue('0', '0.00')).toBe(false);
    expect(hasRealValue(0, null)).toBe(false);
  });
  it('is true when a non-zero bound is present', () => {
    expect(hasRealValue(100_000, null)).toBe(true);
    expect(hasRealValue(0, 500_000)).toBe(true);
    expect(hasRealValue('0', '500000')).toBe(true);
  });
});
