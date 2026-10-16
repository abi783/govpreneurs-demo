import { fetchDiscoverV2, fetchOpportunityV2 } from './discoverApi';

const MOCK_SUCCESS_BODY = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  scoringEngine: 'rule-based',
};

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

// ─── Cycle 1: fetchDiscoverV2 sends correct POST body ────────────────────────

describe('fetchDiscoverV2', () => {
  it('sends POST to correct URL with userId in body', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(MOCK_SUCCESS_BODY), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await fetchDiscoverV2('user-123');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/opportunities/discover/v2');
    expect(init.method).toBe('POST');

    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');

    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ userId: 'user-123' });
  });
});

// ─── Cycle 2: fetchOpportunityV2 throws on non-2xx ───────────────────────────

describe('fetchOpportunityV2', () => {
  it('throws with server message on 404', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(fetchOpportunityV2('nonexistent-key')).rejects.toThrow('Not found');
  });
});
