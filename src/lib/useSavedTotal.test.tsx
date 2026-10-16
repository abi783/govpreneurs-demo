// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { SavedResponse } from "./saved";

const fetchSaved = vi.fn<(...args: unknown[]) => Promise<SavedResponse>>();
vi.mock("./saved", () => ({ fetchSaved: (...args: unknown[]) => fetchSaved(...args) }));

const { useSavedTotal } = await import("./useSavedTotal");

const answer = (total: number): SavedResponse => ({ opportunities: [], page: 1, limit: 1, total });

afterEach(() => {
  cleanup();
  fetchSaved.mockReset();
});

describe("useSavedTotal", () => {
  it("is null until the server answers, then the server's total", async () => {
    let resolve: (r: SavedResponse) => void = () => {};
    fetchSaved.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useSavedTotal("loc-1"));
    expect(result.current.savedTotal).toBeNull();
    expect(fetchSaved).toHaveBeenCalledWith("loc-1", { page: 1, limit: 1 });

    await act(async () => resolve(answer(9)));
    expect(result.current.savedTotal).toBe(9);
  });

  it("stays null when the count fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchSaved.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSavedTotal("loc-1"));
    await act(async () => {});
    expect(result.current.savedTotal).toBeNull();
  });

  it("moves by the delta, and never below zero", async () => {
    fetchSaved.mockResolvedValue(answer(1));
    const { result } = renderHook(() => useSavedTotal("loc-1"));
    await waitFor(() => expect(result.current.savedTotal).toBe(1));
    act(() => result.current.adjustSavedTotal(1));
    expect(result.current.savedTotal).toBe(2);
    act(() => result.current.adjustSavedTotal(-1));
    act(() => result.current.adjustSavedTotal(-1));
    act(() => result.current.adjustSavedTotal(-1));
    expect(result.current.savedTotal).toBe(0);
  });

  it("drops a count that started before a local change", async () => {
    fetchSaved.mockResolvedValue(answer(4));
    const { result } = renderHook(() => useSavedTotal("loc-1"));
    await waitFor(() => expect(result.current.savedTotal).toBe(4));

    let resolve: (r: SavedResponse) => void = () => {};
    fetchSaved.mockReturnValue(new Promise((r) => (resolve = r)));
    act(() => result.current.refreshSavedTotal());
    act(() => result.current.adjustSavedTotal(1));
    // The count was taken before the save, so it would undo it.
    await act(async () => resolve(answer(4)));
    expect(result.current.savedTotal).toBe(5);
  });

  it("counts again when the page becomes visible", async () => {
    fetchSaved.mockResolvedValue(answer(2));
    const { result } = renderHook(() => useSavedTotal("loc-1"));
    await waitFor(() => expect(result.current.savedTotal).toBe(2));

    fetchSaved.mockResolvedValue(answer(3));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitFor(() => expect(result.current.savedTotal).toBe(3));
  });

  it("asks with the lane, and clears the badge until the new lane answers", async () => {
    fetchSaved.mockResolvedValue(answer(9));
    const { result, rerender } = renderHook(({ lane }) => useSavedTotal("loc-1", lane), {
      initialProps: { lane: "all" as "all" | "federal" | "sled" },
    });
    await waitFor(() => expect(result.current.savedTotal).toBe(9));

    let resolve: (r: SavedResponse) => void = () => {};
    fetchSaved.mockReturnValue(new Promise((r) => (resolve = r)));
    rerender({ lane: "sled" });
    expect(result.current.savedTotal).toBeNull();
    expect(fetchSaved).toHaveBeenLastCalledWith("loc-1", {
      page: 1,
      limit: 1,
      filters: { scopes: ["sled"] },
    });
    await act(async () => resolve(answer(3)));
    expect(result.current.savedTotal).toBe(3);
  });

  it("drops an answer for the old lane", async () => {
    let answerOld: (r: SavedResponse) => void = () => {};
    fetchSaved.mockReturnValueOnce(new Promise((r) => (answerOld = r)));
    fetchSaved.mockResolvedValue(answer(3));
    const { result, rerender } = renderHook(({ lane }) => useSavedTotal("loc-1", lane), {
      initialProps: { lane: "all" as "all" | "federal" | "sled" },
    });
    rerender({ lane: "sled" });
    await waitFor(() => expect(result.current.savedTotal).toBe(3));
    await act(async () => answerOld(answer(9)));
    expect(result.current.savedTotal).toBe(3);
  });

  it("asks nothing without a location", () => {
    renderHook(() => useSavedTotal(undefined));
    expect(fetchSaved).not.toHaveBeenCalled();
  });
});
