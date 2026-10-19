// DEMO: the "done for you" (DFY) service catalog and the orders a visitor places.
//
// The prices and names are the real GovPreneurs catalog. An order never reaches a
// real system: it is saved in the demo store, the field it is about moves to
// "Our team is preparing this", and the visitor sees when it will be ready.

import { byMember, own } from "../member";
import { PERSONA } from "../story/persona";
import { isoDaysFromNow } from "../story/clock";
import { newId, patchField, useDemoState, readDemoState, updateDemoState } from "./store";

const copy = own(
  import.meta.glob<typeof import("../members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);

export type DfyServiceId =
  | "sbs-visibility"
  | "sled-nc"
  | "sled-va"
  | "sled-sc"
  | "profile-maintenance"
  | "capability-statement"
  | "govcompliant-digital";

export interface DfyService {
  id: DfyServiceId;
  name: string;
  price: number;
  cadence: "one-time" | "subscription" | "per state";
  impacts: string[];
  /** Business days from the order until the work is ready. */
  deliveryDays: number;
  /** Plain steps the visitor sees on the enrollment card. */
  steps: string[];
}

export const DFY_SERVICES: Record<DfyServiceId, DfyService> = {
  "sbs-visibility": {
    id: "sbs-visibility",
    name: "SBS Visibility Setup",
    price: 997,
    cadence: "one-time",
    impacts: ["Builds your DSBS profile so federal buyers can find you"],
    deliveryDays: 5,
    steps: ["Order received", "We build your DSBS profile from your Business Profile", "You review it", "Profile goes live"],
  },
  "sled-nc": {
    id: "sled-nc",
    name: "SLED Enrollment — North Carolina",
    price: 2497,
    cadence: "per state",
    impacts: ["Unlocks state and local opportunities in NC"],
    deliveryDays: 7,
    steps: ["Order received", "We prepare the state vendor forms", "We file them for you", "Vendor ID comes back to you"],
  },
  "sled-va": {
    id: "sled-va",
    name: "SLED Enrollment — Virginia",
    price: 2497,
    cadence: "per state",
    impacts: ["Unlocks state and local opportunities in VA"],
    deliveryDays: 7,
    steps: ["Order received", "We prepare the state vendor forms", "We file them for you", "Vendor ID comes back to you"],
  },
  "sled-sc": {
    id: "sled-sc",
    name: "SLED Enrollment — South Carolina",
    price: 2497,
    cadence: "per state",
    impacts: ["Unlocks state and local opportunities in SC"],
    deliveryDays: 7,
    steps: ["Order received", "We prepare the state vendor forms", "We file them for you", "Vendor ID comes back to you"],
  },
  "profile-maintenance": {
    id: "profile-maintenance",
    name: "Profile Maintenance & Compliance Alerts",
    price: 290,
    cadence: "subscription",
    impacts: ["Keeps your SAM, state and license registrations from going stale"],
    deliveryDays: 1,
    steps: ["Order received", "Monitoring starts", "You get alerts before anything lapses"],
  },
  "capability-statement": {
    id: "capability-statement",
    name: "Capability Statement",
    price: 2000,
    cadence: "one-time",
    impacts: ["A fresh one-page capability statement for buyers"],
    deliveryDays: 5,
    steps: ["Order received", "We draft it from your profile", "You review it", "Final PDF is saved to your knowledge base"],
  },
  "govcompliant-digital": {
    id: "govcompliant-digital",
    name: "GovCompliant Digital Setup",
    price: 2997,
    cadence: "subscription",
    impacts: ["Website, email domain and business phone in one"],
    deliveryDays: 10,
    steps: ["Order received", "We set up the domain, email and phone", "We check them against buyer requirements", "Handover to you"],
  },
};

export type DfyOrderTarget =
  | { kind: "field"; fieldId: string }
  | { kind: "sled"; state: string }
  | { kind: "none" };

export interface DfyOrder {
  id: string;
  serviceId: DfyServiceId;
  serviceName: string;
  price: number;
  orderedAt: string;
  /** When we expect to deliver. */
  eta: string;
  target: DfyOrderTarget;
}

const ORDERS_KEY = "profile.dfyOrders";

function seedOrders(): DfyOrder[] {
  // DEMO: the caterer's home-state enrollment is under way. The agency is already
  // registered in North Carolina (sled.ts), so hers is Virginia, where the VA work is.
  const { id, state } = byMember({
    caterer: { id: "dfy_seed_sled_nc", state: PERSONA.hqState },
    pack: { id: `dfy_seed_sled_${copy.DFY_SLED_STATE.toLowerCase()}`, state: copy.DFY_SLED_STATE },
  });
  const s = DFY_SERVICES[state === "VA" ? "sled-va" : "sled-nc"];
  return [
    {
      id,
      serviceId: s.id,
      serviceName: s.name,
      price: s.price,
      orderedAt: isoDaysFromNow(-3, 10),
      eta: isoDaysFromNow(4, 17),
      target: { kind: "sled", state },
    },
  ];
}

export function useDfyOrders(): DfyOrder[] {
  const [orders] = useDemoState<DfyOrder[]>(ORDERS_KEY, seedOrders);
  return orders;
}

export function getDfyOrders(): DfyOrder[] {
  return readDemoState<DfyOrder[]>(ORDERS_KEY, seedOrders);
}

export function getOrder(id: string | undefined): DfyOrder | undefined {
  return id ? getDfyOrders().find((o) => o.id === id) : undefined;
}

/** Place an order. It is saved, and the thing it is about moves to "preparing". */
export function placeDfyOrder(serviceId: DfyServiceId, target: DfyOrderTarget): DfyOrder {
  const s = DFY_SERVICES[serviceId];
  const order: DfyOrder = {
    id: newId("dfy"),
    serviceId,
    serviceName: s.name,
    price: s.price,
    orderedAt: new Date().toISOString(),
    eta: isoDaysFromNow(Math.max(1, Math.round(s.deliveryDays * 1.4)), 17),
    target,
  };
  updateDemoState<DfyOrder[]>(ORDERS_KEY, seedOrders, (prev) => [...prev, order]);
  if (target.kind === "field") {
    patchField(target.fieldId, { state: "pending_dfy", dfyOrderId: order.id, at: order.orderedAt });
  }
  return order;
}

/** A believable "invoice sent" line for the order dialog. */
export function invoiceLine(): string {
  return `We email the invoice to ${PERSONA.email}. Work starts when you pay it.`;
}
