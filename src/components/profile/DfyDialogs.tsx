// DEMO: the "Have us do it" order dialog and the "View enrollment" card.
// An order is saved in the demo store (src/demo/profile/dfy.ts). Nothing reaches
// a real billing system.

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui";
import {
  DFY_SERVICES,
  invoiceLine,
  useDfyOrders,
  type DfyOrder,
  type DfyOrderTarget,
  type DfyServiceId,
} from "../../demo/profile/dfy";
import { orderService } from "../../demo/profile/actions";
import { fmtShort, fmtUsd } from "../../demo/profile/dates";

export function DfyOrderDialog({
  open,
  onOpenChange,
  serviceId,
  target,
  onOrdered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: DfyServiceId;
  target: DfyOrderTarget;
  onOrdered?: (order: DfyOrder) => void;
}) {
  const service = DFY_SERVICES[serviceId];
  const [placed, setPlaced] = useState<DfyOrder | null>(null);

  useEffect(() => {
    if (!open) setPlaced(null);
  }, [open]);

  function place() {
    const order = orderService(serviceId, target);
    setPlaced(order);
    onOrdered?.(order);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content dfy-dialog">
          {placed ? (
            <div className="dfy-success">
              <div className="dfy-success-icon">
                <Check size={20} strokeWidth={2.5} />
              </div>
              <Dialog.Title className="bp-modal-title">Order placed</Dialog.Title>
              <Dialog.Description className="bp-modal-helper">
                Our team is on {service.name}. We expect it to be ready by {fmtShort(placed.eta)}. You can follow it
                on this page.
              </Dialog.Description>
              <div className="bp-modal-footer">
                <Button variant="primary" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Dialog.Title className="bp-modal-title">Have us do it — {service.name}</Dialog.Title>
              <Dialog.Description className="bp-modal-helper">
                Our team does this for you. You review the result before it goes anywhere.
              </Dialog.Description>
              <div className="dfy-price">
                <span className="dfy-price-amt">{fmtUsd(service.price)}</span>
                <span className="dfy-price-cadence">{service.cadence}</span>
              </div>
              <ul className="dfy-list">
                {service.impacts.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <ol className="dfy-steps">
                {service.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="dfy-note">
                <ShieldCheck size={12} aria-hidden /> {invoiceLine()}
              </p>
              <div className="bp-modal-footer">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={place}>
                  Place order — {fmtUsd(service.price)}
                </Button>
              </div>
            </>
          )}
          <Dialog.Close asChild>
            <button type="button" className="ky-modal-close" aria-label="Close">
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The card behind "View enrollment": what was ordered, when, and where it stands. */
export function DfyEnrollmentDialog({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}) {
  const orders = useDfyOrders();
  const order = orders.find((o) => o.id === orderId);
  const service = order ? DFY_SERVICES[order.serviceId] : undefined;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content dfy-dialog">
          <Dialog.Title className="bp-modal-title">{order ? order.serviceName : "Enrollment"}</Dialog.Title>
          <Dialog.Description className="bp-modal-helper">
            {order
              ? `Ordered ${fmtShort(order.orderedAt)}. We expect to deliver by ${fmtShort(order.eta)}.`
              : "We could not find that order."}
          </Dialog.Description>
          {service && (
            <ol className="dfy-steps dfy-steps--progress">
              {service.steps.map((step, i) => (
                <li key={step} data-state={i === 0 ? "done" : i === 1 ? "now" : "next"}>
                  {step}
                </li>
              ))}
            </ol>
          )}
          <div className="bp-modal-footer">
            <Button variant="primary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <Dialog.Close asChild>
            <button type="button" className="ky-modal-close" aria-label="Close">
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
