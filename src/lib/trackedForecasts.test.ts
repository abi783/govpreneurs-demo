// @vitest-environment jsdom
// Tracking a forecast writes to the member's saved list, and a failed write is
// put back. Before this the list lived in module memory, so a tracked forecast
// was lost on reload and reached neither My Bids nor the feed's Saved tab.

import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchWorkspace = vi.fn();
const addSavedOpp = vi.fn();
const removeSavedOpp = vi.fn();

const refreshForecastWatch = vi.fn();

vi.mock("./workspace", () => ({
  fetchWorkspace: (...a: unknown[]) => fetchWorkspace(...a),
  addSavedOpp: (...a: unknown[]) => addSavedOpp(...a),
  removeSavedOpp: (...a: unknown[]) => removeSavedOpp(...a),
}));

// The watch client is the only other module the store calls. Mocking the whole
// module also proves the store makes no watch request of its own.
vi.mock("./forecasts/watch", () => ({
  refreshForecastWatch: (...a: unknown[]) => refreshForecastWatch(...a),
}));

import {
  hydrateTrackedForecasts,
  FORECASTS_CHANGED_EVENT,
  isTracked,
  listTracked,
  recordServerSaveChange,
  resetTrackedForecasts,
  TRACKED_WRITES_SLICE,
  toggleTracked,
} from "./trackedForecasts";
import { bus } from "./eventBus";

/** Lets the rejected write settle, so the roll-back has run. */
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  resetTrackedForecasts();
  fetchWorkspace.mockResolvedValue({ savedOpps: ["fc-1", "opp-2"], savedSearches: [] });
  addSavedOpp.mockResolvedValue(undefined);
  removeSavedOpp.mockResolvedValue(undefined);
  refreshForecastWatch.mockResolvedValue({ status: "idle" });
});

describe("tracked forecasts", () => {
  it("reads the member's saved list, once per session", async () => {
    await hydrateTrackedForecasts();
    await hydrateTrackedForecasts();

    expect(fetchWorkspace).toHaveBeenCalledTimes(1);
    expect(isTracked("fc-1")).toBe(true);
    // The one list holds every surface's saves; the forecast pages match their own ids.
    expect(listTracked()).toEqual(["fc-1", "opp-2"]);
  });

  it("asks again after a failed read, so a later visit is not stuck empty", async () => {
    fetchWorkspace.mockRejectedValueOnce(new Error("offline"));
    await expect(hydrateTrackedForecasts()).rejects.toThrow("offline");

    await hydrateTrackedForecasts();
    expect(fetchWorkspace).toHaveBeenCalledTimes(2);
    expect(isTracked("fc-1")).toBe(true);
  });

  it("saves a forecast, and un-saves it", async () => {
    await hydrateTrackedForecasts();

    expect(toggleTracked("fc-9")).toBe(true);
    expect(isTracked("fc-9")).toBe(true);
    expect(addSavedOpp).toHaveBeenCalledWith("fc-9");

    expect(toggleTracked("fc-9")).toBe(false);
    expect(isTracked("fc-9")).toBe(false);
    expect(removeSavedOpp).toHaveBeenCalledWith("fc-9");
  });

  it("puts the bookmark back when the save fails", async () => {
    await hydrateTrackedForecasts();
    addSavedOpp.mockRejectedValueOnce(new Error("no"));

    toggleTracked("fc-9");
    expect(isTracked("fc-9")).toBe(true);
    await settle();
    expect(isTracked("fc-9")).toBe(false);
  });

  it("puts the bookmark back when un-saving fails", async () => {
    await hydrateTrackedForecasts();
    removeSavedOpp.mockRejectedValueOnce(new Error("no"));

    toggleTracked("fc-1");
    expect(isTracked("fc-1")).toBe(false);
    await settle();
    expect(isTracked("fc-1")).toBe(true);
  });

  it("hands out one array per state, so a subscriber does not loop", async () => {
    await hydrateTrackedForecasts();
    expect(listTracked()).toBe(listTracked());

    const before = listTracked();
    toggleTracked("fc-9");
    expect(listTracked()).not.toBe(before);
  });

  it("records a change Hunter already saved, with one event and no request", async () => {
    await hydrateTrackedForecasts();
    toggleTracked("b");
    await settle();
    vi.clearAllMocks();
    const onChange = vi.fn();
    window.addEventListener(FORECASTS_CHANGED_EVENT, onChange);

    recordServerSaveChange(["a"], ["b"]);
    window.removeEventListener(FORECASTS_CHANGED_EVENT, onChange);

    expect(isTracked("a")).toBe(true);
    expect(isTracked("b")).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
    // The server wrote the list already, so the store sends nothing.
    expect(fetchWorkspace).not.toHaveBeenCalled();
    expect(addSavedOpp).not.toHaveBeenCalled();
    expect(removeSavedOpp).not.toHaveBeenCalled();
  });

  it("writes the saved list only, and refreshes the watch after the save", async () => {
    await hydrateTrackedForecasts();
    let finish: () => void = () => {};
    addSavedOpp.mockReturnValueOnce(new Promise<void>((r) => (finish = r)));

    toggleTracked("fc-9");
    // The watch reads the saved list, so it must not re-read before the write lands.
    expect(refreshForecastWatch).not.toHaveBeenCalled();
    finish();
    await settle();

    expect(addSavedOpp).toHaveBeenCalledTimes(1);
    expect(removeSavedOpp).not.toHaveBeenCalled();
    expect(refreshForecastWatch).toHaveBeenCalledTimes(1);
  });

  it("refreshes the watch after an un-save", async () => {
    await hydrateTrackedForecasts();

    toggleTracked("fc-1");
    await settle();

    expect(removeSavedOpp).toHaveBeenCalledWith("fc-1");
    expect(refreshForecastWatch).toHaveBeenCalledTimes(1);
  });

  it("does not refresh the watch after a save that was rolled back", async () => {
    await hydrateTrackedForecasts();
    addSavedOpp.mockRejectedValueOnce(new Error("no"));
    removeSavedOpp.mockRejectedValueOnce(new Error("no"));

    toggleTracked("fc-9");
    toggleTracked("fc-1");
    await settle();

    expect(isTracked("fc-9")).toBe(false);
    expect(isTracked("fc-1")).toBe(true);
    expect(refreshForecastWatch).not.toHaveBeenCalled();
  });

  it("refreshes the watch after a save Hunter made on the server", async () => {
    await hydrateTrackedForecasts();

    recordServerSaveChange(["a"], ["fc-1"]);

    expect(refreshForecastWatch).toHaveBeenCalledTimes(1);
    expect(addSavedOpp).not.toHaveBeenCalled();
    expect(removeSavedOpp).not.toHaveBeenCalled();
  });

  it("does not refresh the watch on hydrate or on the demo reset", async () => {
    await hydrateTrackedForecasts();
    resetTrackedForecasts();

    expect(refreshForecastWatch).not.toHaveBeenCalled();
  });
});

describe("the settled-write signal", () => {
  it("fires once a save or an un-save settles, and not before", async () => {
    await hydrateTrackedForecasts();
    const heard = vi.fn();
    const stop = bus.subscribe(TRACKED_WRITES_SLICE, heard);
    let finish: () => void = () => {};
    addSavedOpp.mockReturnValueOnce(new Promise<void>((r) => (finish = r)));

    toggleTracked("fc-9");
    expect(heard).not.toHaveBeenCalled();
    finish();
    await settle();
    expect(heard).toHaveBeenCalledTimes(1);

    removeSavedOpp.mockRejectedValueOnce(new Error("no"));
    toggleTracked("fc-1");
    await settle();
    expect(heard).toHaveBeenCalledTimes(2);
    stop();
  });

  it("fires after a save Hunter made on the server", async () => {
    await hydrateTrackedForecasts();
    const heard = vi.fn();
    const stop = bus.subscribe(TRACKED_WRITES_SLICE, heard);

    recordServerSaveChange(["a"], []);

    expect(heard).toHaveBeenCalledTimes(1);
    stop();
  });
});
