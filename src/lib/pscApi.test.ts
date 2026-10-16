// Feature 12 — the live PSC lookup that replaces the hardcoded PSC row list.
//
// The adapter is deliberately thin: it carries the query, narrows each row to
// `{ code, description }`, and rejects on a bad response. The DEGRADATION half
// of the contract — a failed request yields no rows and no throw reaching the
// component — belongs to `useDebouncedSearch`, and is asserted there and in
// `components/Hunter/PscFacet.test.tsx`.
import { ApiError } from "./api";
import { searchPsc } from "./pscApi";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("searchPsc", () => {
  it("carries the query to GET /psc/search", async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));

    await searchPsc("roof");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/psc/search");
    expect(url).toContain("q=roof");
  });

  it("percent-encodes a query with spaces", async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));

    await searchPsc("roofing materials");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("q=roofing+materials");
  });

  it("maps every row to { code, description } and drops the extra columns", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse([
        {
          code: "5650",
          description: "ROOFING AND SIDING MATERIALS",
          segment: "product",
          groupCode: "56",
          groupTitle: "CONSTRUCTION AND BUILDING MATERIAL",
        },
      ]),
    );

    const rows = await searchPsc("roof");

    expect(rows).toEqual([{ code: "5650", description: "ROOFING AND SIDING MATERIALS" }]);
  });

  it("never reaches the network for an empty query", async () => {
    expect(await searchPsc("")).toEqual([]);
    expect(await searchPsc("   ")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects with the response status when the endpoint fails", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "boom" }, 500));

    await expect(searchPsc("roof")).rejects.toBeInstanceOf(ApiError);
  });
});
