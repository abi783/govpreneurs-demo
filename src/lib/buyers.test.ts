// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBuyers, fetchBuyer } from "./buyers";

/**
 * The seam between the Government Buyers page and the register.
 *
 * The property under test throughout is the same one: a failure yields NOTHING,
 * never a plausible stand-in. This page exists because it used to render
 * invented federal figures; a fallback here would put them straight back.
 */

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

const OFFICE = {
  agencyKey: 1464,
  name: "Army Contracting Command",
  abbreviation: "ACC",
  agencyType: "Federal",
  isDefense: true,
};

describe("fetchBuyers", () => {
  it("queries the register and unwraps the rows", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ buyers: [OFFICE] }));
    await expect(fetchBuyers("army")).resolves.toEqual([OFFICE]);
    const url = String(mockFetch.mock.calls[0][0]);
    expect(url).toContain("/buyers?q=army");
  });

  it("encodes a term that would otherwise break the query string", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ buyers: [] }));
    await fetchBuyers("army & navy/joint");
    expect(String(mockFetch.mock.calls[0][0])).toContain(
      `q=${encodeURIComponent("army & navy/joint")}`,
    );
  });

  it("does not call the API at all for an empty term", async () => {
    await expect(fetchBuyers("   ")).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns nothing on a non-2xx", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "boom" }, 500));
    await expect(fetchBuyers("army")).resolves.toEqual([]);
  });

  it("returns nothing when the network throws", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    await expect(fetchBuyers("army")).resolves.toEqual([]);
  });

  it("returns nothing when the body is the wrong shape", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ buyers: "all of them" }));
    await expect(fetchBuyers("army")).resolves.toEqual([]);
  });
});

describe("fetchBuyer", () => {
  const DETAIL = {
    buyer: { agencyKey: 1464, name: "Army Contracting Command", officers: 12 },
    figures: { spendByYear: null, topAwardees: null, setAsideAwards: null },
  };

  it("reads one office by key", async () => {
    mockFetch.mockResolvedValue(jsonResponse(DETAIL));
    await expect(fetchBuyer(1464)).resolves.toEqual(DETAIL);
    expect(String(mockFetch.mock.calls[0][0])).toContain("/buyers/1464");
  });

  it("keeps null figures rather than inventing them", async () => {
    mockFetch.mockResolvedValue(jsonResponse(DETAIL));
    const got = await fetchBuyer(1464);
    // "We could not count it" must survive the seam intact — the panel renders
    // "Not in the record" from exactly this null.
    expect(got?.figures.spendByYear).toBeNull();
  });

  it("returns null for a 404 — the office is simply not in the register", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "nope" }, 404));
    await expect(fetchBuyer(1)).resolves.toBeNull();
  });

  it("returns null when the network throws", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    await expect(fetchBuyer(1)).resolves.toBeNull();
  });

  it("returns null when the body carries no buyer", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ figures: {} }));
    await expect(fetchBuyer(1)).resolves.toBeNull();
  });

  it("does not call the API for a non-finite key", async () => {
    await expect(fetchBuyer(Number.NaN)).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
