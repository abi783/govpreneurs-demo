// What Amira has told the Small Orders board: her categories, her four
// registrations, the parts she can get and the one price she already sent.
// The board saves this document with PUT /small-orders/state and reads it back
// with GET /small-orders/state, so it is still there after a reload.

import { MEMBER, own } from "@/demo/member";
import { readDemoState, writeDemoState } from "@/demo/runtime/store";
import { isoDaysFromNow } from "@/demo/story/clock";
import { PERSONA } from "@/demo/story/persona";
import type { MicroState } from "@/lib/state/microPurchases";
import { findOrder } from "./data";

const copy = own(
  import.meta.glob<typeof import("../../members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);

const KEY = "explore.smallOrders.state";

function nsnOf(id: string): string {
  return findOrder(id)?.nsn ?? "";
}

/** The member's starting answers. */
export function initialMemberState(): MicroState {
  return MEMBER === "caterer" ? catererState() : copy.smallOrdersStart();
}

/** Amira's starting answers. */
function catererState(): MicroState {
  const pasta = findOrder("mp-109");
  return {
    categories: ["food-beverage", "food-service-supplies", "kitchen-equipment", "safety-gear"],
    onboarded: true,
    cashCeiling: null,
    cashUnsure: false,
    // She says she can get the pasta and the entree pouches: both are her own kitchen's work.
    attestedNsns: [nsnOf("mp-109"), nsnOf("mp-111")].filter(Boolean),
    declinedNsns: [],
    unsureNsns: [],
    suppliedNsns: [],
    // One price already sent, so the "waiting to hear" state is on the board.
    quotes: pasta
      ? [
          {
            orderId: pasta.id,
            nsn: pasta.nsn,
            quotedPricePerUnit: 21.4,
            quotedPriceAsked: true,
            deliveryDays: pasta.deliveryDays,
            sentAt: isoDaysFromNow(-2, 14),
            outcome: "pending",
            askAgainOn: null,
          },
        ]
      : [],
    wins: [],
    // She holds a SAM registration and a CAGE code (persona), and she invoiced her
    // Womack contract through PIEE. One step is left: the DIBBS account.
    registrations: { sam: true, cage: true, dibbs: false, piee: true },
    firstRegistrationAt: isoDaysFromNow(-60, 10),
    samExpiresOn: PERSONA.samActiveUntil,
    seenOrderIds: [],
  };
}

export function readMemberState(): MicroState {
  return readDemoState<MicroState>(KEY, initialMemberState);
}

export function writeMemberState(doc: MicroState): void {
  writeDemoState<MicroState>(KEY, doc);
}
