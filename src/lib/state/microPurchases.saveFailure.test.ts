// @vitest-environment jsdom
//
// DH-22 — THE STORE STOPS THROWING THE ANSWER AWAY.
//
// `schedulePersist()` read `void saveMemberState(state)`. `saveMemberState`
// already reported whether the write landed, and `void` discarded it, so every
// failed save was silent — a 400 from DH-06's caps, a 401 from a dead session,
// a 500, a dropped connection. Her quotes, wins and attestations stopped
// persisting and nothing anywhere said so.
//
// These cases pin the half the store owns: the outcome is read, it is kept, and
// the store wakes its subscribers when it changes. What she SEES is pinned in
// `components/MicroPurchases/SaveFailureNotice.test.tsx`.
//
// Layer: INTERFACE ADAPTERS. The store with the wire doubled out.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The wire, doubled. Hoisted because `vi.mock` is. */
const api = vi.hoisted(() => ({
  saveMemberState: vi.fn(),
  fetchMemberState: vi.fn(),
}));

vi.mock("../microPurchases/api", () => api);

/** Mirrors `PERSIST_DEBOUNCE_MS` in the store, which is module-private. */
const DEBOUNCE_MS = 400;

type Store = typeof import("./microPurchases");

/** A store of her own for each case. The module holds its state — and now its
 *  last save outcome — in module variables, so a shared one would make the
 *  order of the cases load-bearing. Same shape as `microPurchases.clock.test.ts`. */
async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("./microPurchases");
}

/** Answer one write, then run the debounce out and let the outcome settle. */
async function writeAnswered(store: Store, outcome: unknown, orderId: string): Promise<void> {
  api.saveMemberState.mockResolvedValue(outcome);
  store.markSeen(orderId);
  await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
}

beforeEach(() => {
  vi.useFakeTimers();
  api.saveMemberState.mockReset();
  api.fetchMemberState.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the store keeps what the last write did", () => {
  it("starts with nothing to report", async () => {
    const store = await freshStore();

    expect(store.getSaveFailure()).toBeNull();
  });

  it("reports nothing while the writes land", async () => {
    const store = await freshStore();

    await writeAnswered(store, { saved: true }, "landed");

    expect(api.saveMemberState).toHaveBeenCalledTimes(1);
    expect(store.getSaveFailure()).toBeNull();
  });

  it("keeps a refusal, so a surface can say the server said no", async () => {
    const store = await freshStore();

    await writeAnswered(store, { saved: false, reason: "refused" }, "refused-one");

    expect(store.getSaveFailure()).toBe("refused");
  });

  it("keeps an unconfirmed write as its own kind, not as a refusal", async () => {
    const store = await freshStore();

    await writeAnswered(store, { saved: false, reason: "unconfirmed" }, "unconfirmed-one");

    expect(store.getSaveFailure()).toBe("unconfirmed");
  });

  it("clears it when a later write lands, because the record is through", async () => {
    // The whole document goes every time, so the write that lands carries the
    // answers the refused one was holding.
    const store = await freshStore();
    await writeAnswered(store, { saved: false, reason: "unconfirmed" }, "first");

    await writeAnswered(store, { saved: true }, "second");

    expect(store.getSaveFailure()).toBeNull();
  });
});

describe("the store wakes the surface when the answer changes", () => {
  it("publishes after a write fails, without waiting for another answer", async () => {
    // She taps once. The failure arrives 400ms later, with nothing else
    // happening on the page — so the publish that renders the notice has to
    // come from the outcome, not from her next commit.
    const store = await freshStore();
    api.saveMemberState.mockResolvedValue({ saved: false, reason: "refused" });
    store.markSeen("wakes-the-surface");
    const woken = vi.fn();
    store.subscribeMicro(woken);

    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(woken).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when the same failure repeats", async () => {
    // The notice already says this. A publish per retry is a re-render per
    // retry for a screen that does not change.
    const store = await freshStore();
    await writeAnswered(store, { saved: false, reason: "refused" }, "same-failure-one");
    const woken = vi.fn();
    store.subscribeMicro(woken);

    await writeAnswered(store, { saved: false, reason: "refused" }, "same-failure-two");

    // One publish, and it is `commit()`'s for the second answer — not a second
    // one for an outcome that did not move.
    expect(woken).toHaveBeenCalledTimes(1);
    expect(store.getSaveFailure()).toBe("refused");
  });
});
