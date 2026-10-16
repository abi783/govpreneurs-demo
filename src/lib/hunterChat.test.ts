// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProfileConflicts, postHunterMessage } from "./hunterChat";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchProfileConflicts", () => {
  it("reads the caller's pending hints — identity is server-derived, never sent", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        conflicts: [
          {
            field: "capability_summary",
            label: "Capability summary",
            heardValue: "Residential roofing only",
            observedAt: "2026-07-29T10:00:00.000Z",
          },
        ],
      }),
    );

    const hints = await fetchProfileConflicts();

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/hunter-chat/memory-conflicts");
    expect(hints).toHaveLength(1);
    expect(hints[0].heardValue).toBe("Residential roofing only");
  });

  it("degrades to no hint on a non-2xx response", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "nope" }, 500));

    await expect(fetchProfileConflicts()).resolves.toEqual([]);
  });

  it("degrades to no hint when the request throws", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));

    await expect(fetchProfileConflicts()).resolves.toEqual([]);
  });

  it("degrades to no hint on an unexpected body", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));

    await expect(fetchProfileConflicts()).resolves.toEqual([]);
  });
});

describe("postHunterMessage surface", () => {
  /** The JSON body of the one chat request the test sent. */
  function sentBody(): Record<string, unknown> {
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    return JSON.parse(init.body as string) as Record<string, unknown>;
  }

  it("sends surface 'feed' when the caller gives none", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ reply: "ok" }));

    await postHunterMessage("hello", [], "for_you");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/hunter-chat/message");
    expect(sentBody()).toEqual({
      message: "hello",
      visibleOpps: [],
      tab: "for_you",
      surface: "feed",
    });
  });

  it("sends the surface that the caller gives", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ reply: "ok" }));

    await postHunterMessage("what first?", [], "all", "forecasts");

    expect(sentBody().surface).toBe("forecasts");
  });
});
