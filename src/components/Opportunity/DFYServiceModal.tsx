import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import type { UnmetPrereq } from "../../lib/prereqGate";
import { Button } from "@/components/ui";

export function DFYServiceModal({
  open,
  onOpenChange,
  prereqs,
  total,
  onConfirmed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prereqs: UnmetPrereq[];
  total: number;
  onConfirmed: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setSubmitted(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="gate-modal__overlay" />
        <Dialog.Content className="gate-modal dfy-modal" aria-describedby={undefined}>
          <Button
            variant="ghost"
            size="sm"
            className="mentor-modal__close"
            icon={<X size={16} />}
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          />
          {!submitted ? (
            <>
              <Dialog.Title className="gate-modal__title">Have us handle it</Dialog.Title>
              <div className="gate-modal__body" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                <p className="prereq-gate__lead">
                  Our team will prepare and submit the following on your behalf. You'll get a status
                  update every business day until each item clears.
                </p>
                <ul className="dfy-modal__list">
                  {prereqs
                    .filter((p) => p.dfyPrice)
                    .map((p) => (
                      <li key={p.key} className="dfy-modal__row">
                        <span className="dfy-modal__row-label">{p.label}</span>
                        <span className="dfy-modal__row-price">
                          ${p.dfyPrice!.toLocaleString()}
                        </span>
                      </li>
                    ))}
                </ul>
                <div className="dfy-modal__total">
                  <span>Total</span>
                  <strong>${total.toLocaleString()}</strong>
                </div>
              </div>
              <div className="gate-modal__actions">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setSubmitted(true)}>
                  Confirm — ${total.toLocaleString()}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="prereq-gate__icon dfy-modal__success-icon" aria-hidden>
                <CheckCircle2 size={20} />
              </div>
              <Dialog.Title className="gate-modal__title">Request received</Dialog.Title>
              <div className="gate-modal__body">
                <p className="prereq-gate__lead">
                  Our team will reach out within 1 business day to kick off your paperwork. You'll
                  see status updates in your Roadmap.
                </p>
              </div>
              <div className="gate-modal__actions">
                <Button variant="primary" onClick={onConfirmed}>
                  Done
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
