// Feature 9 — what recordWin() copies off `order.buyerContact`, and what it
// refuses to copy.
//
// The past-performance record is the one artifact that leaves this product and
// gets read by a contracting officer, so an absent part must be stored as an
// ABSENCE. `buyerContact.name` is `''` when the solicitation names nobody —
// `MicroOrder` types it non-nullable `string` and that shape is frozen (D10) —
// and `''` stored on the record is a label waiting to render with nothing
// beside it. It is stored as null, which is what the backend's
// `PastPerformanceRecord` and its DTO have always typed it as.
import { describe, expect, it } from "vitest";
import { MICRO_ORDERS } from "../mock/microPurchaseOrders";
import type { MicroOrder } from "../microPurchases/order";
import { recordWin, winFor } from "./microPurchases";

const CONTACT = {
  name: "A. Contracting-Officer",
  email: "a.contracting-officer@dla.mil",
  phone: "215-737-0000",
};

/** A real corpus order under a test-local id, so each case writes its own win
 *  into the module-scoped store (recordWin is idempotent per order). */
function orderWith(id: string, buyerContact: MicroOrder["buyerContact"]): MicroOrder {
  return { ...MICRO_ORDERS[0], id, buyerContact };
}

describe("recordWin — the contact on the past-performance record", () => {
  it("copies all three parts onto the record", () => {
    recordWin(orderWith("f9-all-three", { ...CONTACT }), 1200);

    const win = winFor("f9-all-three");
    expect(win?.contactName).toBe("A. Contracting-Officer");
    expect(win?.contactEmail).toBe("a.contracting-officer@dla.mil");
    expect(win?.contactPhone).toBe("215-737-0000");
  });

  it("stores an empty name as null, NEVER as an empty string", () => {
    recordWin(orderWith("f9-no-name", { ...CONTACT, name: "" }), 1200);

    const win = winFor("f9-no-name");
    expect(win?.contactName).toBeNull();
    expect(win?.contactName).not.toBe("");
    // The other two still drop independently — they are there, so they travel.
    expect(win?.contactEmail).toBe("a.contracting-officer@dla.mil");
    expect(win?.contactPhone).toBe("215-737-0000");
  });

  it("stores a whitespace-only name as null too, since it renders as nothing", () => {
    recordWin(orderWith("f9-blank-name", { ...CONTACT, name: "   " }), 1200);

    expect(winFor("f9-blank-name")?.contactName).toBeNull();
  });

  it("keeps a null phone null and does not invent one", () => {
    recordWin(orderWith("f9-no-phone", { ...CONTACT, phone: null }), 1200);

    expect(winFor("f9-no-phone")?.contactPhone).toBeNull();
    expect(winFor("f9-no-phone")?.contactName).toBe("A. Contracting-Officer");
  });
});
