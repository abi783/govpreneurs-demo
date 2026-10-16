import { MAX_NAICS_CODES_PER_REQUEST, fetchNaicsDescriptions } from "./naicsApi";

const mockFetch = vi.fn();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

describe("fetchNaicsDescriptions", () => {
  // ─── Cycle 1: one request, de-duplicated codes, a Map back ─────────────────

  it("issues one request with a de-duplicated codes param and returns a Map", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse([
        { code: "722310", description: "Food Service Contractors" },
        { code: "722320", description: "Caterers" },
      ]),
    );

    const result = await fetchNaicsDescriptions(["722310", "722320", "722310"]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/naics/descriptions");
    const codes = new URL(url, "http://localhost").searchParams.get("codes");
    expect(codes).toBe("722310,722320");

    expect(result).toBeInstanceOf(Map);
    expect(result.get("722310")).toBe("Food Service Contractors");
    expect(result.get("722320")).toBe("Caterers");
    expect(result.size).toBe(2);
  });

  // ─── Cycle 2: an unknown code has no entry ─────────────────────────────────

  it("has no entry for a code the backend omits from the response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse([{ code: "722310", description: "Food Service Contractors" }]),
    );

    const result = await fetchNaicsDescriptions(["722310", "999999"]);

    expect(result.has("999999")).toBe(false);
    expect(result.get("999999")).toBeUndefined();
    expect(result.size).toBe(1);
  });

  // ─── Cycle 3: an empty code list issues no request ─────────────────────────

  it("returns an empty Map and issues no request for an empty code list", async () => {
    const result = await fetchNaicsDescriptions(["", "  "]);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });

  // ─── Cycle 4: one request is capped at the endpoint's limit ───────────────

  it("sends at most MAX_NAICS_CODES_PER_REQUEST codes per request", async () => {
    // A fresh Response per call: a body can only be read once.
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse([])));
    const many = Array.from({ length: MAX_NAICS_CODES_PER_REQUEST + 20 }, (_, i) => `9${i}`);

    await fetchNaicsDescriptions(many);

    const [url] = mockFetch.mock.calls[0] as [string];
    const codes = new URL(url, "http://localhost").searchParams.get("codes") ?? "";
    expect(codes.split(",")).toHaveLength(MAX_NAICS_CODES_PER_REQUEST);
  });

  // ─── Cycle 5: a non-ok response throws, it is not swallowed ────────────────

  it("throws with the server message on a non-ok response", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: "Too many codes" }, 400));

    await expect(fetchNaicsDescriptions(["722310"])).rejects.toThrow("Too many codes");
  });

  // ─── Cycle 6: more codes than the cap are chunked and merged ───────────────

  it("splits 150 codes into a 100-code and a 50-code request and merges both", async () => {
    mockFetch.mockImplementation((url: string) => {
      const codes = new URL(url, "http://localhost").searchParams.get("codes") ?? "";
      return Promise.resolve(
        jsonResponse(
          codes.split(",").map((code) => ({ code, description: `Description ${code}` })),
        ),
      );
    });
    const many = Array.from({ length: 150 }, (_, i) => String(700000 + i));

    const result = await fetchNaicsDescriptions(many);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const batchCodes = mockFetch.mock.calls.map(([url]) =>
      (new URL(url as string, "http://localhost").searchParams.get("codes") ?? "").split(","),
    );
    expect(batchCodes[0]).toHaveLength(MAX_NAICS_CODES_PER_REQUEST);
    expect(batchCodes[1]).toHaveLength(150 - MAX_NAICS_CODES_PER_REQUEST);

    // An entry from the FIRST batch and an entry from the SECOND batch.
    expect(result.get("700000")).toBe("Description 700000");
    expect(result.get("700149")).toBe("Description 700149");
    expect(result.size).toBe(150);
  });
});
