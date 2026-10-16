import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the GHL user-token resolver so we don't touch window/postMessage and can
// assert the token gets awaited and threaded into the request header.
vi.mock("./ghlUserToken", () => ({
  getGhlUserToken: vi.fn(async () => "mock-user-token"),
}));

import { sendForReview } from "./mentorApi";
import { getGhlUserToken } from "./ghlUserToken";

const mockFetch = vi.fn();
const getTokenMock = vi.mocked(getGhlUserToken);

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  getTokenMock.mockClear();
  getTokenMock.mockResolvedValue("mock-user-token");
});

afterEach(() => {
  vi.restoreAllMocks();
});

function headersOf(call: unknown[]): Headers {
  const init = call[1] as RequestInit;
  return new Headers(init.headers);
}

describe("sendForReview", () => {
  // ─── Cycle 1: success posts to the right URL with token + body ──────────────
  it("posts to /opportunities/send-for-review with the user token and body, returning parsed JSON", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true, updatedCount: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await sendForReview({
      userId: "user-1",
      locationId: "loc-1",
      solNumbers: ["SOL-123"],
      opportunityIds: ["opp-abc"],
      message: "please review",
    });

    expect(result).toEqual({ success: true, updatedCount: 1 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const call = mockFetch.mock.calls[0] as [string, RequestInit];
    const [url] = call;
    expect(url).toContain("/opportunities/send-for-review");

    const headers = headersOf(call);
    expect(headers.get("X-GHL-User-Token")).toBe("mock-user-token");
    expect(headers.get("Content-Type")).toBe("application/json");

    const body = JSON.parse(call[1].body as string);
    expect(body).toEqual({
      userId: "user-1",
      locationId: "loc-1",
      solNumbers: ["SOL-123"],
      opportunityIds: ["opp-abc"],
      message: "please review",
    });
  });

  // ─── Cycle 2: non-ok response rejects via buildApiError ─────────────────────
  it("throws with the server message on a non-ok response", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "Not eligible" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      sendForReview({
        userId: "user-1",
        locationId: "loc-1",
        solNumbers: ["SOL-123"],
        opportunityIds: ["opp-abc"],
      }),
    ).rejects.toThrow("Not eligible");
  });

  // ─── Cycle 3: the token is awaited before the fetch fires ───────────────────
  it("awaits getGhlUserToken before issuing the fetch", async () => {
    let tokenResolved = false;
    getTokenMock.mockImplementation(async () => {
      tokenResolved = true;
      return "mock-user-token";
    });
    mockFetch.mockImplementation(() => {
      // fetch must only be called once the token has resolved.
      expect(tokenResolved).toBe(true);
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    await sendForReview({
      userId: "user-1",
      locationId: "loc-1",
      solNumbers: ["SOL-123"],
      opportunityIds: ["opp-abc"],
    });

    expect(getTokenMock).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledOnce();
    // The awaited token ends up in the header.
    const headers = headersOf(mockFetch.mock.calls[0] as unknown[]);
    expect(headers.get("X-GHL-User-Token")).toBe("mock-user-token");
  });
});
