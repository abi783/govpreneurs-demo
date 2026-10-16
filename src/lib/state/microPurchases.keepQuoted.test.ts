// Sending a price keeps the order — in the workspace.
//
// A quote she has sent must stay reachable after DLA closes the order, and
// saving is that route back. Saving is `user_workspace.savedOpps` now, so
// `recordQuote()` hands the order to the workspace list — which is also what
// puts a quoted small order in her pipeline.
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  fetchMemberState: vi.fn(),
  saveMemberState: vi.fn(),
}));
vi.mock("../microPurchases/api", () => api);

const saved = vi.hoisted(() => ({ keepOrder: vi.fn() }));
vi.mock("../microPurchases/savedOrders", () => saved);

beforeEach(() => {
  api.saveMemberState.mockReset().mockResolvedValue({ saved: true });
  saved.keepOrder.mockReset().mockResolvedValue(undefined);
});

describe("recordQuote keeps the order she quoted", () => {
  it("adds the order to the workspace's saved list", async () => {
    vi.resetModules();
    const store = await import("./microPurchases");

    store.recordQuote("dibbs-9", "5305-00-000-0001", 30);

    expect(saved.keepOrder).toHaveBeenCalledWith("dibbs-9");
    expect(store.quoteFor("dibbs-9")?.outcome).toBe("pending");
  });

  it("does not keep it twice when the quote is already recorded", async () => {
    vi.resetModules();
    const store = await import("./microPurchases");

    store.recordQuote("dibbs-9", "5305-00-000-0001", 30);
    store.recordQuote("dibbs-9", "5305-00-000-0001", 30);

    expect(saved.keepOrder).toHaveBeenCalledTimes(1);
  });
});
