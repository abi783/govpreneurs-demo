// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchForecastTakes } from "./cardTakeApi";
import {
  RETRY_AFTER_MS,
  TAKE_WINDOW,
  nextTakeBatch,
  resetForecastCardTakes,
  useForecastCardTakes,
} from "./useForecastCardTakes";

vi.mock("./cardTakeApi", () => ({ fetchForecastTakes: vi.fn() }));
const fetchMock = vi.mocked(fetchForecastTakes);

const ids = (n: number) => Array.from({ length: n }, (_, i) => `fc-${i}`);
const lineOf = (id: string) => `Take for ${id}.`;

/** Answers every asked key with a line. */
function answerAll() {
  fetchMock.mockImplementation((keys: string[]) =>
    Promise.resolve(new Map(keys.map((k) => [k, lineOf(k)]))),
  );
}

beforeEach(() => {
  resetForecastCardTakes();
  fetchMock.mockReset();
});

/** jsdom's observer, put back after a test that drives its own. */
const REAL_OBSERVER = globalThis.IntersectionObserver;

afterEach(() => {
  vi.useRealTimers();
  resetForecastCardTakes();
  globalThis.IntersectionObserver = REAL_OBSERVER;
});

describe("nextTakeBatch", () => {
  it("takes the first window of keys not yet settled, up to the reach", () => {
    expect(nextTakeBatch(ids(50), 40, new Set())).toEqual(ids(TAKE_WINDOW));
    expect(nextTakeBatch(ids(50), 40, new Set(ids(TAKE_WINDOW)))).toEqual(
      ids(40).slice(TAKE_WINDOW),
    );
  });

  it("asks for nothing past the reach, and nothing when all are settled", () => {
    expect(nextTakeBatch(ids(50), 0, new Set())).toEqual([]);
    expect(nextTakeBatch(ids(5), 40, new Set(ids(5)))).toEqual([]);
  });
});

describe("useForecastCardTakes", () => {
  it("fetches the first two windows, one at a time, and returns their lines", async () => {
    answerAll();
    const { result } = renderHook(() => useForecastCardTakes(ids(60)));
    await waitFor(() => expect(result.current.takes.size).toBe(2 * TAKE_WINDOW));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toEqual(ids(TAKE_WINDOW));
    expect(fetchMock.mock.calls[1][0]).toEqual(ids(2 * TAKE_WINDOW).slice(TAKE_WINDOW));
    expect(result.current.takes.get("fc-0")).toBe(lineOf("fc-0"));
  });

  it("never asks again for a key it has an answer for, in this session", async () => {
    answerAll();
    const first = renderHook(() => useForecastCardTakes(ids(5)));
    await waitFor(() => expect(first.result.current.takes.size).toBe(5));
    first.unmount();
    const second = renderHook(() => useForecastCardTakes(ids(5)));
    expect(second.result.current.takes.size).toBe(5);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not ask again for a key the server gave no line", async () => {
    fetchMock.mockResolvedValue(new Map());
    const { result, rerender } = renderHook(() => useForecastCardTakes(ids(3)));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rerender();
    await act(async () => Promise.resolve());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.takes.size).toBe(0);
  });

  it("keeps its reach when a next page of rows is appended, and starts over on a new list", async () => {
    answerAll();
    const reachSentinel: { current: IntersectionObserverCallback | null } = { current: null };
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        reachSentinel.current = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;

    // Two pages loaded; the member scrolls to the sentinel, so the reach moves on.
    const { result, rerender } = renderHook((list: string[]) => useForecastCardTakes(list), {
      initialProps: ids(2 * TAKE_WINDOW),
    });
    act(() => result.current.sentinelRef(document.createElement("div")));
    await waitFor(() => expect(result.current.takes.size).toBe(2 * TAKE_WINDOW));
    act(() =>
      reachSentinel.current?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    const sentinelBefore = result.current.sentinelIndex;

    // A third page is appended: its window is asked, and the sentinel does not jump back.
    rerender(ids(3 * TAKE_WINDOW));
    await waitFor(() => expect(result.current.takes.size).toBe(3 * TAKE_WINDOW));
    expect(fetchMock.mock.calls[2][0]).toEqual(ids(3 * TAKE_WINDOW).slice(2 * TAKE_WINDOW));
    expect(result.current.sentinelIndex).toBe(sentinelBefore);

    // A new list (another view or filter) starts from its top.
    rerender(["other-0", "other-1"]);
    await waitFor(() => expect(result.current.sentinelIndex).toBe(1));
    expect(result.current.sentinelIndex).toBeLessThan(sentinelBefore);
  });

  it("retries a failed window later, not at once", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answerAll();
    fetchMock.mockRejectedValueOnce(new Error("503"));
    const { result } = renderHook(() => useForecastCardTakes(ids(3)));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => Promise.resolve());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.takes.size).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(RETRY_AFTER_MS);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.takes.size).toBe(3));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
