// DEMO: the state-by-state SLED (state and local) vendor registrations.

import { PERSONA } from "../story/persona";
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

function seed(): SledRegistration[] {
  return PERSONA.serviceStates.map((state) => {
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
