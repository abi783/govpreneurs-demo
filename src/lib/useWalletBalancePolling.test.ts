// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useWalletBalancePolling } from "./useWalletBalancePolling";
import * as walletApi from "./walletApi";

describe("useWalletBalancePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("polls every 1s while active and stops once the balance is sufficient", async () => {
    const fetchSpy = vi
      .spyOn(walletApi, "fetchWalletBalance")
      .mockResolvedValueOnce({ balance: 50, chargeAmount: 97 })
      .mockResolvedValueOnce({ balance: 120, chargeAmount: 97 });

    const { result } = renderHook(() => useWalletBalancePolling("loc1", true, 97));

    expect(fetchSpy).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({ balance: 50, chargeAmount: 97 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ balance: 120, chargeAmount: 97 });

    // Caught up — no further ticks even though time keeps passing.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not poll while inactive", async () => {
    const fetchSpy = vi.spyOn(walletApi, "fetchWalletBalance").mockResolvedValue({
      balance: 50,
      chargeAmount: 97,
    });

    renderHook(() => useWalletBalancePolling("loc1", false, 97));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("stops polling on unmount", async () => {
    const fetchSpy = vi.spyOn(walletApi, "fetchWalletBalance").mockResolvedValue({
      balance: 50,
      chargeAmount: 97,
    });

    const { unmount } = renderHook(() => useWalletBalancePolling("loc1", true, 97));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("stops polling when the caller flips active to false (e.g. modal closed)", async () => {
    const fetchSpy = vi.spyOn(walletApi, "fetchWalletBalance").mockResolvedValue({
      balance: 50,
      chargeAmount: 97,
    });

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useWalletBalancePolling("loc1", active, 97),
      { initialProps: { active: true } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    rerender({ active: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("skips a tick if the previous fetch is still in flight", async () => {
    let resolveFirst: (v: { balance: number; chargeAmount: number }) => void = () => {};
    const firstPromise = new Promise<{ balance: number; chargeAmount: number }>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchSpy = vi
      .spyOn(walletApi, "fetchWalletBalance")
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce({ balance: 120, chargeAmount: 97 });

    renderHook(() => useWalletBalancePolling("loc1", true, 97));

    // First tick fires and hangs (in flight).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second interval tick fires while the first is still unresolved — should
    // be skipped, not queued as a second concurrent request.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Resolve the first fetch; the next tick should fetch again.
    await act(async () => {
      resolveFirst({ balance: 50, chargeAmount: 97 });
      await firstPromise;
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("swallows poll errors silently and retries next tick", async () => {
    const fetchSpy = vi
      .spyOn(walletApi, "fetchWalletBalance")
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce({ balance: 120, chargeAmount: 97 });

    const { result } = renderHook(() => useWalletBalancePolling("loc1", true, 97));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ balance: 120, chargeAmount: 97 });
  });

  it("does not update state after unmount when a fetch resolves late", async () => {
    let resolveFetch: (v: { balance: number; chargeAmount: number }) => void = () => {};
    const pending = new Promise<{ balance: number; chargeAmount: number }>((resolve) => {
      resolveFetch = resolve;
    });
    vi.spyOn(walletApi, "fetchWalletBalance").mockImplementationOnce(() => pending);

    const { unmount } = renderHook(() => useWalletBalancePolling("loc1", true, 97));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    unmount();

    // Resolve after unmount — the hook's cancelled-flag guard must skip setState.
    // No React "state update on unmounted component" warning should fire.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      resolveFetch({ balance: 120, chargeAmount: 97 });
      await pending;
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
