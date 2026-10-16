import { shouldShowMatchesGenerating } from './matchesGenerating';

describe('shouldShowMatchesGenerating', () => {
  it('is true only when indexing, not loading, and no matches yet', () => {
    expect(shouldShowMatchesGenerating({ profileIndexing: true, loading: false, count: 0 })).toBe(true);
  });
  it('is false while loading', () => {
    expect(shouldShowMatchesGenerating({ profileIndexing: true, loading: true, count: 0 })).toBe(false);
  });
  it('is false when the user already has matches (returning user, background re-match)', () => {
    expect(shouldShowMatchesGenerating({ profileIndexing: true, loading: false, count: 5 })).toBe(false);
  });
  it('is false when not indexing', () => {
    expect(shouldShowMatchesGenerating({ profileIndexing: false, loading: false, count: 0 })).toBe(false);
  });
});
