// DEMO: actions that touch more than one profile store.

import { DFY_SERVICES, placeDfyOrder, type DfyOrder, type DfyOrderTarget, type DfyServiceId } from "./dfy";
import { updateSled } from "./sled";

/** Place a DFY order and move whatever it is about to "preparing". */
export function orderService(serviceId: DfyServiceId, target: DfyOrderTarget): DfyOrder {
  const order = placeDfyOrder(serviceId, target);
  if (target.kind === "sled") {
    updateSled(target.state, { status: "pending_dfy", orderId: order.id });
  }
  return order;
}

/** The service to order for one SLED state, or undefined when there is none. */
export function sledServiceFor(state: string): DfyServiceId | undefined {
  const id = `sled-${state.toLowerCase()}` as DfyServiceId;
  return DFY_SERVICES[id] ? id : undefined;
}
