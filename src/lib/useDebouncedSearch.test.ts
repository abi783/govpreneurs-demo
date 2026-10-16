// @vitest-environment jsdom
//
// Feature 12 — the shared debounce/abort/degrade shell behind a remote
// typeahead. It is the single degradation point for every catalog too large to
// ship to the client: a failure yields NO rows and an explicit `failed` status,
// so a caller can say "couldn't load" rather than render an empty list that
// reads as "no matches".
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import { useDebouncedSearch } from "./useDebouncedSearch";

type Row = { code: string };

afterEach(() => {
  cleanup();
});

describe("useDebouncedSearch", () => {
  it("sends ONE request for a query the member settles on", async () => {
    const search = vi.fn<(q: string) => Promise<Row[]>>().mockResolvedValue([{ code: "5650" }]);
    const { result, rerender } = renderHook(({ q }) => useDebouncedSearch(search, q), {
      initialProps: { q: "r" },
    });

    rerender({ q: "ro" });
    rerender({ q: "roo" });
    rerender({ q: "roof" });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(search).toHaveBeenCalledOnce();
    expect(search).toHaveBeenCalledWith("roof", expect.anything());
    expect(result.current.results).toEqual([{ code: "5650" }]);
  });

  it("stays idle and sends nothing for an empty query", async () => {
    const search = vi.fn<(q: string) => Promise<Row[]>>().mockResolvedValue([]);
    const { result } = renderHook(({ q }) => useDebouncedSearch(search, q), {
      initialProps: { q: "   " },
    });

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(search).not.toHaveBeenCalled();
    expect(result.current).toEqual({ results: [], status: "idle" });
  });

  it("reports a failed lookup as zero rows and a failed status, and throws nothing", async () => {
    const search = vi.fn<(q: string) => Promise<Row[]>>().mockRejectedValue(new Error("network"));
    const { result } = renderHook(({ q }) => useDebouncedSearch(search, q), {
      initialProps: { q: "roof" },
    });

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(result.current.results).toEqual([]);
  });

  it("drops the answer to a query the member has already moved off", async () => {
    let answerFirst: (rows: Row[]) => void = () => undefined;
    const first = new Promise<Row[]>((resolve) => {
      answerFirst = resolve;
    });
    const search = vi
      .fn<(q: string) => Promise<Row[]>>()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce([{ code: "fresh" }]);
    const { result, rerender } = renderHook(({ q }) => useDebouncedSearch(search, q), {
      initialProps: { q: "roof" },
    });

    // The first request is in flight when the member retypes.
    await waitFor(() => expect(search).toHaveBeenCalledWith("roof", expect.anything()));
    rerender({ q: "paint" });
    await waitFor(() => expect(result.current.results).toEqual([{ code: "fresh" }]));

    answerFirst([{ code: "stale" }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.results).toEqual([{ code: "fresh" }]);
  });
});
