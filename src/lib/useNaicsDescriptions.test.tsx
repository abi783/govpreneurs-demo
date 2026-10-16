// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { CardOpportunity } from "./mock/opportunities";
import { ApiError } from "./api";
import * as naicsApi from "./naicsApi";
import { useNaicsDescriptionMap, useNaicsDescriptions } from "./useNaicsDescriptions";

function card(id: string, naicsCode?: string): CardOpportunity {
  return {
    id,
    title: `Opportunity ${id}`,
    agency: "Department of Test",
    agencyAbbrev: "DoT",
    workType: "Solicitation",
    value: "$1.2M",
    location: "Austin, TX",
    closeDateAbsolute: "2026-12-01",
    daysUntilClose: 30,
    matchTier: "good",
    matchScore: 70,
    hunterReasoning: null,
    mode: "prime",
    scope: "fed",
    category: "contract",
    naicsCode,
  };
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useNaicsDescriptions", () => {
  // ─── Cycle 1: one batched call fills the description in ────────────────────

  it("fills naicsDescription in for every card the taxonomy resolves", async () => {
    const fetchSpy = vi
      .spyOn(naicsApi, "fetchNaicsDescriptions")
      .mockResolvedValue(new Map([["722310", "Food Service Contractors"]]));
    const cards = [card("a", "722310"), card("b", "722310"), card("c", "999999")];

    const { result } = renderHook(() => useNaicsDescriptions(cards));

    await waitFor(() =>
      expect(result.current[0].naicsDescription).toBe("Food Service Contractors"),
    );
    expect(result.current[1].naicsDescription).toBe("Food Service Contractors");
    expect(result.current[2].naicsDescription).toBeUndefined();

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toEqual(["722310", "999999"]);
  });

  // ─── Cycle 2: a re-render with the same codes issues no new request ────────

  it("issues no new request when the code list is unchanged", async () => {
    const fetchSpy = vi
      .spyOn(naicsApi, "fetchNaicsDescriptions")
      .mockResolvedValue(new Map([["722310", "Food Service Contractors"]]));
    const cards = [card("a", "722310")];

    const { rerender } = renderHook(() => useNaicsDescriptions(cards));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());

    rerender();
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  // ─── Cycle 3: a failed request returns the cards untouched ─────────────────

  it("returns the cards untouched and warns once when the request fails", async () => {
    vi.spyOn(naicsApi, "fetchNaicsDescriptions").mockRejectedValue(
      new ApiError("Failed to fetch NAICS descriptions", 500),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cards = [card("a", "722310"), card("b", "722320")];

    const { result } = renderHook(() => useNaicsDescriptions(cards));

    await waitFor(() => expect(warn).toHaveBeenCalledOnce());
    expect(result.current).toHaveLength(2);
    expect(result.current[0].naicsDescription).toBeUndefined();
    expect(result.current[1].naicsDescription).toBeUndefined();
    expect(result.current[0].naicsCode).toBe("722310");
  });

  // ─── Cycle 4: no codes on the page means no request ────────────────────────

  it("issues no request when no card carries a NAICS code", () => {
    const fetchSpy = vi.spyOn(naicsApi, "fetchNaicsDescriptions");

    renderHook(() => useNaicsDescriptions([card("a"), card("b")]));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// The code-list hook the WorkPicker reads (GOAL.md feature 9). The three
// descriptions below were measured against the live GET /naics/descriptions.
describe("useNaicsDescriptionMap", () => {
  const TAXONOMY = new Map([
    ["722310", "Food Service Contractors"],
    ["722320", "Caterers"],
    ["311999", "All Other Miscellaneous Food Manufacturing"],
  ]);

  it("issues ONE request for the de-duplicated code list", async () => {
    const fetchSpy = vi
      .spyOn(naicsApi, "fetchNaicsDescriptions")
      .mockResolvedValue(new Map(TAXONOMY));
    const codes = ["722310", "722320", "722310", "311999", " "];

    const { result } = renderHook(() => useNaicsDescriptionMap(codes));

    await waitFor(() => expect(result.current.get("722310")).toBe("Food Service Contractors"));
    expect(result.current.get("722320")).toBe("Caterers");
    expect(result.current.get("311999")).toBe("All Other Miscellaneous Food Manufacturing");

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toEqual(["311999", "722310", "722320"]);
  });

  it("leaves a code the taxonomy does not know out of the map", async () => {
    vi.spyOn(naicsApi, "fetchNaicsDescriptions").mockResolvedValue(
      new Map([["722310", "Food Service Contractors"]]),
    );

    const { result } = renderHook(() => useNaicsDescriptionMap(["722310", "999999"]));

    await waitFor(() => expect(result.current.get("722310")).toBe("Food Service Contractors"));
    // No entry — the caller shows the bare code, never an invented label.
    expect(result.current.get("999999")).toBeUndefined();
  });

  it("returns an empty map and warns once when the request fails", async () => {
    vi.spyOn(naicsApi, "fetchNaicsDescriptions").mockRejectedValue(
      new ApiError("Failed to fetch NAICS descriptions", 500),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useNaicsDescriptionMap(["722310", "722320"]));

    await waitFor(() => expect(warn).toHaveBeenCalledOnce());
    expect(result.current.size).toBe(0);
    expect(result.current.get("722310")).toBeUndefined();
  });
});
