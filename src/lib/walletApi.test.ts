import {
  fetchWalletBalance,
  fetchWalletLedger,
  GHL_WALLET_BILLING_URL,
} from './walletApi';

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

// ─── Cycle 1: fetchWalletBalance returns parsed balance on 200 ────────────────

describe('fetchWalletBalance', () => {
  it('returns the parsed balance and hits the correct URL with locationId', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ balance: 150, chargeAmount: 97 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchWalletBalance('loc123');

    expect(result).toEqual({ balance: 150, chargeAmount: 97 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/wallet/balance');
    expect(url).toContain('locationId=loc123');
  });

  // ─── Cycle 2: fetchWalletBalance throws on non-ok response ──────────────────

  it('throws with the server message on a non-ok response', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Failed to fetch wallet balance' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(fetchWalletBalance('loc123')).rejects.toThrow(
      'Failed to fetch wallet balance',
    );
  });
});

// ─── fetchWalletLedger returns the entries array from GET /wallet/ledger ──────

describe('fetchWalletLedger', () => {
  it('unwraps { entries } and hits /wallet/ledger', async () => {
    const entries = [
      {
        id: 'a',
        date: '2026-06-01T00:00:00.000Z',
        description: 'Mentor review — Roof repair',
        type: 'debit',
        amountUSD: 97,
        relatedTo: { label: 'View opportunity', href: '/opportunities/opp1' },
      },
    ];
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ entries }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchWalletLedger();

    expect(result).toEqual(entries);
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/wallet/ledger');
  });

  it('throws with the server message on a non-ok response', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Failed to fetch wallet ledger' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(fetchWalletLedger()).rejects.toThrow(
      'Failed to fetch wallet ledger',
    );
  });
});

// ─── Cycle 3: GHL_WALLET_BILLING_URL builds a valid deep-link ─────────────────

describe('GHL_WALLET_BILLING_URL', () => {
  it('substitutes {locationId} with the real locationId', () => {
    const url = GHL_WALLET_BILLING_URL.replace('{locationId}', 'loc123');

    expect(url).not.toContain('{locationId}');
    expect(url).toContain('/location/loc123/');
    expect(url).toContain('tab=wallet_transactions');
  });
});
