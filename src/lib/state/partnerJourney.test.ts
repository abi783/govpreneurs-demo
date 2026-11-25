// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const save = vi.fn(async (_k: number, _j: unknown) => {});
vi.mock("../partnersApi", () => ({
  setPipelineJourney: (k: number, j: unknown) => save(k, j),
}));

const LEGACY = "proto.partners.journey";
const entry = (awardeeKey: number, journey?: object) =>
  ({ awardeeKey, companyName: "Acme", stage: "teaming", sourceTag: "", savedAt: "", updatedAt: "", journey }) as never;

async function fresh() {
  vi.resetModules();
  return await import("./partnerJourney");
}

// DEMO: this Node version puts a bare `localStorage` on the global, which hides jsdom's
// (no `clear`). A small in-memory Storage keeps the test about the journey, not the runtime.
if (typeof window.localStorage?.clear !== "function") {
  const data = new Map<string, string>();
  const memory = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(window, "localStorage", { value: memory, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true });
}

beforeEach(() => {
  save.mockClear();
  window.localStorage.clear();
});

describe("partner journey", () => {
  it("shows what the server holds", async () => {
    const m = await fresh();
    await m.hydrateJourneys([entry(7, { job: { what: "Roof" }, pastPerformanceAdded: true })]);
    expect(m.getJourney(7).job?.what).toBe("Roof");
    expect(m.getJourney(7).pastPerformanceAdded).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it("moves old localStorage data to the server once, then clears it", async () => {
    window.localStorage.setItem(
      LEGACY,
      JSON.stringify({
        "7": { diy: { steps: [true, false] }, job: { what: "Roof" } },
        "8": { job: { what: "Keep me" } },
      }),
    );
    const m = await fresh();
    await m.hydrateJourneys([entry(7)]);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(7, { diy: { steps: [true, false] }, job: { what: "Roof" } });
    expect(m.getJourney(7).job?.what).toBe("Roof");
    const left = JSON.parse(window.localStorage.getItem(LEGACY) ?? "{}");
    expect(left["7"]).toBeUndefined();
    // a company not on her board is not touched
    expect(left["8"]).toBeDefined();

    await m.hydrateJourneys([entry(7, { job: { what: "Roof" } })]);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("keeps the local copy when the save fails, so the next load tries again", async () => {
    window.localStorage.setItem(LEGACY, JSON.stringify({ "7": { job: { what: "Roof" } } }));
    save.mockRejectedValueOnce(new Error("offline"));
    const m = await fresh();
    await m.hydrateJourneys([entry(7)]);
    expect(JSON.parse(window.localStorage.getItem(LEGACY)!)["7"]).toBeDefined();
  });

  it("updateJourney saves to the server and no longer writes localStorage", async () => {
    const m = await fresh();
    m.updateJourney(7, { diy: { steps: [true] } });
    expect(save).toHaveBeenCalledWith(7, { diy: { steps: [true] } });
    expect(window.localStorage.getItem(LEGACY)).toBeNull();
    expect(m.getJourney(7).diy?.steps).toEqual([true]);
  });
});
