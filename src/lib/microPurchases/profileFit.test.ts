// Small orders — fit from her profile.
//
// Two things on the board read her profile: "Best first" ranks by her
// matching-engine score (falling back to her NAICS codes), and "What do you
// sell?" opens with categories pre-selected from those codes. This store loads
// both, and these cases hold what it asks the server and what it keeps.
import { beforeEach, describe, expect, it, vi } from "vitest";

const discover = vi.hoisted(() => ({ fetchFilterDefaults: vi.fn() }));
vi.mock("../discoverApi", () => discover);

const api = vi.hoisted(() => ({ fetchNaicsCategories: vi.fn(), fetchMatchScores: vi.fn() }));
vi.mock("./api", () => api);

type Store = typeof import("./profileFit");

async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("./profileFit");
}

function defaults(naics: string[], alliedNaics: string[]) {
  return {
    naics,
    alliedNaics,
    setAsides: [],
    states: [],
    cities: [],
    hasCapabilityStatement: true,
  };
}

beforeEach(() => {
  discover.fetchFilterDefaults.mockReset();
  api.fetchNaicsCategories.mockReset();
  api.fetchMatchScores.mockReset().mockResolvedValue({});
});

describe("suggestCategories", () => {
  it("keeps the categories that hold a real share of her orders, most first, at most four", async () => {
    const { suggestCategories } = await freshStore();
    const picked = suggestCategories({
      total: 100,
      rows: [
        { category: "fasteners", orders: 40 },
        { category: "other", orders: 25 },
        { category: "electrical", orders: 20 },
        { category: "filters", orders: 9 },
        { category: "hand-tools", orders: 6 },
      ],
    });
    // `other` is not a category she can pick; 9% and 6% are too thin to claim.
    expect(picked).toEqual(["fasteners", "electrical"]);
  });

  it("suggests nothing from too few orders to say anything", async () => {
    const { suggestCategories } = await freshStore();
    expect(suggestCategories({ total: 3, rows: [{ category: "fasteners", orders: 3 }] })).toEqual(
      [],
    );
  });
});

describe("loadProfileFit", () => {
  it("reads her codes once and suggests from the orders under them", async () => {
    discover.fetchFilterDefaults.mockResolvedValue(defaults(["332722"], ["332722", "332510"]));
    api.fetchNaicsCategories.mockResolvedValue({
      total: 50,
      rows: [{ category: "fasteners", orders: 50 }],
    });
    const store = await freshStore();

    await Promise.all([store.loadProfileFit("loc-1"), store.loadProfileFit("loc-1")]);

    expect(discover.fetchFilterDefaults).toHaveBeenCalledTimes(1);
    expect(api.fetchNaicsCategories).toHaveBeenCalledWith(["332722"]);
    const fit = store.profileFit();
    expect(fit.profileNaics).toEqual(["332722"]);
    expect(fit.alliedNaics).toEqual(["332722", "332510"]);
    expect(fit.suggestedCategories).toEqual(["fasteners"]);
  });

  it("widens to related codes when her own codes reach too few orders", async () => {
    discover.fetchFilterDefaults.mockResolvedValue(defaults(["332722"], ["332722", "332510"]));
    api.fetchNaicsCategories
      .mockResolvedValueOnce({ total: 2, rows: [{ category: "fasteners", orders: 2 }] })
      .mockResolvedValueOnce({ total: 30, rows: [{ category: "hand-tools", orders: 30 }] });
    const store = await freshStore();

    await store.loadProfileFit("loc-1");

    expect(api.fetchNaicsCategories).toHaveBeenLastCalledWith(["332722", "332510"]);
    expect(store.profileFit().suggestedCategories).toEqual(["hand-tools"]);
  });

  it("asks for no categories when her profile names no NAICS code", async () => {
    discover.fetchFilterDefaults.mockResolvedValue(defaults([], []));
    const store = await freshStore();

    await store.loadProfileFit("loc-1");

    expect(api.fetchNaicsCategories).not.toHaveBeenCalled();
    expect(store.profileFit().suggestedCategories).toEqual([]);
  });
});

describe("loadMatchScores", () => {
  it("asks only for orders not asked about before, one page of ids at a time", async () => {
    const ids = Array.from({ length: 120 }, (_, i) => `dibbs-${i}`);
    api.fetchMatchScores.mockImplementation((batch: string[]) =>
      Promise.resolve(Object.fromEntries(batch.slice(0, 1).map((id) => [id, 10]))),
    );
    const store = await freshStore();

    await store.loadMatchScores(ids);
    await store.loadMatchScores(ids.slice(0, 60));

    const batches = api.fetchMatchScores.mock.calls.map((c) => (c[0] as string[]).length);
    expect(batches).toEqual([50, 50, 20]);
    expect(store.profileFit().matchScores).toEqual({
      "dibbs-0": 10,
      "dibbs-50": 10,
      "dibbs-100": 10,
    });
  });
});
