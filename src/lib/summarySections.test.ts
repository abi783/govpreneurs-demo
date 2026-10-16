import { buildSummarySections } from './summarySections';

describe('buildSummarySections', () => {
  it('returns an empty array when accordions is null', () => {
    expect(buildSummarySections(null)).toEqual([]);
  });

  it('includes a populated section with its title and bullets', () => {
    const result = buildSummarySections({
      what_the_buyer_needs: ['Build a website', 'Host it for 12 months'],
    });
    expect(result).toEqual([
      {
        id: 'what_the_buyer_needs',
        title: 'What the buyer needs',
        bullets: ['Build a website', 'Host it for 12 months'],
      },
    ]);
  });

  it('excludes sections whose array is empty, whitespace-only, or missing', () => {
    const result = buildSummarySections({
      what_the_buyer_needs: ['Real bullet'],
      evaluation_criteria: [],
      risks_and_gotchas: ['   '],
      // submission_instructions intentionally missing
    });
    expect(result.map((s) => s.id)).toEqual(['what_the_buyer_needs']);
  });

  it('returns sections in the fixed display order regardless of input key order', () => {
    const result = buildSummarySections({
      risks_and_gotchas: ['A risk'],
      what_the_buyer_needs: ['A need'],
      eligibility_and_compliance: ['A rule'],
    });
    expect(result.map((s) => s.id)).toEqual([
      'what_the_buyer_needs',
      'eligibility_and_compliance',
      'risks_and_gotchas',
    ]);
  });
});
