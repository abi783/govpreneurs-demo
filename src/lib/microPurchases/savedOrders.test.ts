// Saved small orders live in `user_workspace.savedOpps`.
//
// A small order's id IS its `oppKey` in the `opportunities` collection, so a
// saved small order is a saved opportunity. Keeping it in the workspace — not
// in `small_orders_member_state.savedOrderIds`, where it used to be — is what
// puts it in the pipeline, which reads that list. These cases hold the store
// that owns the list on the small orders pages.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const workspace = vi.hoisted(() => ({
  fetchWorkspace: vi.fn(),
  addSavedOpp: vi.fn(),
  removeSavedOpp: vi.fn(),
}));
vi.mock("../workspace", () => workspace);
const api = vi.hoisted(() => ({ fetchSmallOrdersByIds: vi.fn() }));
vi.mock("./api", () => api);

type Store = typeof import("./savedOrders");

/** A fresh module per case: the store keeps its set in module variables. */
async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import("./savedOrders");
}

beforeEach(() => {
  workspace.fetchWorkspace.mockReset().mockResolvedValue({ savedOpps: [], savedSearches: [] });
  workspace.addSavedOpp.mockReset().mockResolvedValue(undefined);
  workspace.removeSavedOpp.mockReset().mockResolvedValue(undefined);
  api.fetchSmallOrdersByIds
    .mockReset()
    .mockImplementation((ids: string[]) =>
      Promise.resolve(ids.filter((id) => id.startsWith("dibbs-")).map((id) => ({ id }))),
    );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the saved list comes from the workspace", () => {
  it("reads her saved opportunities once, however many pages ask", async () => {
    workspace.fetchWorkspace.mockResolvedValue({
      savedOpps: ["dibbs-1", "sam-9"],
      savedSearches: [],
    });
    const store = await freshStore();

    await Promise.all([store.loadSavedOrders(), store.loadSavedOrders()]);

    expect(workspace.fetchWorkspace).toHaveBeenCalledTimes(1);
    expect(store.isOrderSaved("dibbs-1")).toBe(true);
    expect(store.savedOrderIds()).toEqual(["dibbs-1", "sam-9"]);
  });

  it("keeps an empty list, and says so, when the workspace does not answer", async () => {
    workspace.fetchWorkspace.mockRejectedValue(new Error("offline"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = await freshStore();

    await store.loadSavedOrders();

    expect(store.savedOrderIds()).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

describe("saving and un-saving write to the workspace", () => {
  it("adds through POST /workspace/saved-opps and shows it at once", async () => {
    const store = await freshStore();
    await store.loadSavedOrders();

    const pending = store.toggleSavedOrder("dibbs-1");
    expect(store.isOrderSaved("dibbs-1")).toBe(true);
    await pending;

    expect(workspace.addSavedOpp).toHaveBeenCalledWith("dibbs-1");
  });

  it("removes through DELETE /workspace/saved-opps/:oppKey", async () => {
    workspace.fetchWorkspace.mockResolvedValue({ savedOpps: ["dibbs-1"], savedSearches: [] });
    const store = await freshStore();
    await store.loadSavedOrders();

    await store.toggleSavedOrder("dibbs-1");

    expect(workspace.removeSavedOpp).toHaveBeenCalledWith("dibbs-1");
    expect(store.isOrderSaved("dibbs-1")).toBe(false);
  });

  it("puts the list back when the workspace refuses the save", async () => {
    workspace.addSavedOpp.mockRejectedValue(new Error("500"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = await freshStore();
    await store.loadSavedOrders();

    await store.toggleSavedOrder("dibbs-1");

    expect(store.isOrderSaved("dibbs-1")).toBe(false);
  });
});

describe("keeping an order she quoted", () => {
  it("adds it once and never takes it away", async () => {
    const store = await freshStore();
    await store.loadSavedOrders();

    await store.keepOrder("dibbs-1");
    await store.keepOrder("dibbs-1");

    expect(workspace.addSavedOpp).toHaveBeenCalledTimes(1);
    expect(workspace.removeSavedOpp).not.toHaveBeenCalled();
    expect(store.isOrderSaved("dibbs-1")).toBe(true);
  });
});

describe("the Saved tab's orders", () => {
  it("reads them by id, newest save first, and leaves out what is not an order", async () => {
    workspace.fetchWorkspace.mockResolvedValue({
      savedOpps: ["dibbs-old", "sam-9", "dibbs-new"],
      savedSearches: [],
    });
    const store = await freshStore();

    await store.loadSavedOrderRecords();

    expect(api.fetchSmallOrdersByIds).toHaveBeenCalledWith(["dibbs-old", "sam-9", "dibbs-new"]);
    expect(savedIdsOf(store)).toEqual(["dibbs-new", "dibbs-old"]);
  });

  it("asks once per id, however often the tab opens", async () => {
    workspace.fetchWorkspace.mockResolvedValue({ savedOpps: ["dibbs-1"], savedSearches: [] });
    const store = await freshStore();

    await store.loadSavedOrderRecords();
    await store.loadSavedOrderRecords();

    expect(api.fetchSmallOrdersByIds).toHaveBeenCalledTimes(1);
  });

  it("drops an order from the tab the moment she un-saves it", async () => {
    workspace.fetchWorkspace.mockResolvedValue({ savedOpps: ["dibbs-1"], savedSearches: [] });
    const store = await freshStore();
    await store.loadSavedOrderRecords();

    await store.toggleSavedOrder("dibbs-1");

    expect(savedIdsOf(store)).toEqual([]);
  });

  it("says the read failed, and tries those ids again next time", async () => {
    workspace.fetchWorkspace.mockResolvedValue({ savedOpps: ["dibbs-1"], savedSearches: [] });
    api.fetchSmallOrdersByIds.mockResolvedValueOnce(null);
    const store = await freshStore();

    await store.loadSavedOrderRecords();
    expect(stateOf(store)).toBe("failed");

    await store.loadSavedOrderRecords();
    expect(stateOf(store)).toBe("ready");
    expect(savedIdsOf(store)).toEqual(["dibbs-1"]);
  });
});

/** The ids on the Saved tab, read through the store's snapshot getter. */
function savedIdsOf(store: Store): string[] {
  return store.savedOrderRecords().orders.map((o) => o.id);
}

function stateOf(store: Store): string {
  return store.savedOrderRecords().state;
}
