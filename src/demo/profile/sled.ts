// DEMO: the state-by-state SLED (state and local) vendor registrations.

import { byMember } from "../member";
import { PERSONA } from "../story/persona";
import { isoDaysFromNow } from "../story/clock";
import { readDemoState, updateDemoState, useDemoState } from "./store";
import { getDfyOrders } from "./dfy";

export const STATE_NAMES: Record<string, string> = {
  NC: "North Carolina",
  VA: "Virginia",
  SC: "South Carolina",
  GA: "Georgia",
};

export interface SledRegistration {
  state: string;
  status: "registered" | "pending_dfy" | "missing";
  /** The vendor ID the state gave back. */
  vendorId?: string;
  registeredAt?: string;
  orderId?: string;
}

const KEY = "profile.sled";

/**
 * DEMO: states she is already registered in. The agency is on North Carolina's
 * eVP vendor list (she has done city and state work), as My Business shows.
 */
const REGISTERED = byMember<Record<string, { vendorId: string; registeredDaysAgo: number } | undefined>>({
  caterer: {},
  pack: { NC: { vendorId: "0001048772", registeredDaysAgo: 262 } },
});

function seed(): SledRegistration[] {
  return PERSONA.serviceStates.map((state) => {
    const held = REGISTERED[state];
    if (held) {
      return { state, status: "registered" as const, vendorId: held.vendorId, registeredAt: isoDaysFromNow(-held.registeredDaysAgo, 10) };
    }
    const order = getDfyOrders().find((o) => o.target.kind === "sled" && o.target.state === state);
    return order
      ? { state, status: "pending_dfy" as const, orderId: order.id }
      : { state, status: "missing" as const };
  });
}

export function useSledRegistrations(): SledRegistration[] {
  const [rows] = useDemoState<SledRegistration[]>(KEY, seed);
  return rows;
}

export function getSledRegistrations(): SledRegistration[] {
  return readDemoState<SledRegistration[]>(KEY, seed);
}

export function updateSled(state: string, patch: Partial<SledRegistration>): void {
  updateDemoState<SledRegistration[]>(KEY, seed, (prev) =>
    prev.map((r) => (r.state === state ? { ...r, ...patch } : r)),
  );
}
