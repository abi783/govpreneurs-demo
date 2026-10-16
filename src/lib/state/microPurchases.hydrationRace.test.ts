// @vitest-environment jsdom
//
// THE FIRST LOAD MUST NOT BE OVERTAKEN BY THE FIRST WRITE.
//
// REPORTED BY THE MEMBER, 2026-09-10: "hard reloading unsaves my answers to
// completing the DIBBS and PIEE registration."
//
// What happened. `hydrateMicroState()` sets `hydrated = true` BEFORE it awaits,
// so nothing anywhere meant "the load has finished". The board's SAM effect ran
// on mount, read `getMicroState()` — the DEFAULTS, because her record had not
// arrived — ticked `sam` and `cage`, and the store's debounced write sent that
// default document 400 ms later. Measured the same day, `GET
// /small-orders/state` took 24 SECONDS against the staging cluster. So the PUT
// landed roughly 23 seconds before her real record came back and overwrote it:
// registrations to false, `quotes`, `wins` and `attestedNsns` to empty.
//
// It was never only about registrations. The store PUTs the whole document, so
// the same race could erase a won contract.
//
// Two rules, one case each:
//   1. No write leaves while a load is in flight. It is DEFERRED, never
//      dropped — dropping it would lose the answer she just gave.
//   2. If she answered during the flight, her answer wins. Committing the
//      arriving record would erase it in front of her.
//
// And the guard is scoped to a load that is actually IN FLIGHT: a consumer that
// never loads has no race, and deferring its writes for ever would be a worse
// bug than the one being fixed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  saveMemberState: vi.fn(),
  fetchMemberState: vi.fn(),
}));
vi.mock("../microPurchases/api", () => api);

/** Mirrors `PERSIST_DEBOUNCE_MS`, which is module-private. */
const DEBOUNCE_MS = 400;

type Store = typeof import("./microPurchases");

async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("./microPurchases");
}

beforeEach(() => {
  vi.useFakeTimers();
  api.saveMemberState.mockReset().mockResolvedValue({ saved: true });
  api.fetchMemberState.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("a write during the first load", () => {
  it("does not reach the server before her record has come back", async () => {
    const store = await freshStore();
    // A load that never settles inside this case — the 24-second GET.
    api.fetchMemberState.mockReturnValue(new Promise(() => {}));
    void store.hydrateMicroState();

    store.setRegistration("dibbs", true);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 4);

    // THE DEFECT. This used to PUT the default document over her record.
    expect(api.saveMemberState).not.toHaveBeenCalled();
  });

  it("sends the deferred write once the load settles", async () => {
    const store = await freshStore();
    let land: (v: unknown) => void = () => {};
    api.fetchMemberState.mockReturnValue(new Promise((r) => (land = r)));
    void store.hydrateMicroState();

    store.setRegistration("dibbs", true);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(api.saveMemberState).not.toHaveBeenCalled();

    land(null); // the load finished, with nothing
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    // DEFERRED, NOT DROPPED.
    expect(api.saveMemberState).toHaveBeenCalledTimes(1);
    expect(store.getMicroState().registrations.dibbs).toBe(true);
  });

  it("keeps her answer when the arriving record disagrees with it", async () => {
    const store = await freshStore();
    let land: (v: unknown) => void = () => {};
    api.fetchMemberState.mockReturnValue(new Promise((r) => (land = r)));
    void store.hydrateMicroState();

    store.setRegistration("dibbs", true);

    // The server's copy still says she has not done it — it was written before
    // she answered. Committing it would tick her answer back off.
    land({
      ...store.getMicroState(),
      registrations: { sam: true, cage: true, dibbs: false, piee: false },
    });
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);

    expect(store.getMicroState().registrations.dibbs).toBe(true);
    expect(api.saveMemberState).toHaveBeenCalled();
  });

  it("takes the record when she did nothing while it loaded", async () => {
    const store = await freshStore();
    api.fetchMemberState.mockResolvedValue({
      ...(await freshStore()).getMicroState(),
      registrations: { sam: true, cage: true, dibbs: true, piee: true },
    });
    await store.hydrateMicroState();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    // No local answer raced it, so the server's record is the newer one.
    expect(store.getMicroState().registrations.dibbs).toBe(true);
  });

  it("writes normally when no load was ever started", async () => {
    const store = await freshStore();

    store.setRegistration("piee", true);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    // The guard is scoped to a load IN FLIGHT. A consumer that never hydrates
    // must not have its writes deferred for ever.
    expect(api.saveMemberState).toHaveBeenCalledTimes(1);
  });
});
