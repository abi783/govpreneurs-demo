import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import { DFY_SERVICES, invoiceLine, useDfyOrders, type DfyOrderTarget, type DfyService } from "../../demo/profile/dfy";
import { orderService, sledServiceFor } from "../../demo/profile/actions";
import { FIELD_DEFS, effectiveField } from "../../demo/profile/fields";
import { useFieldOverrides } from "../../demo/profile/store";
import { useSledRegistrations } from "../../demo/profile/sled";
import { fmtUsd } from "../../demo/profile/dates";

interface Candidate {
  service: DfyService;
  target: DfyOrderTarget;
}

// DEMO: the services that fit the gaps in Amira's profile. A service leaves the list
// once it is ordered or the gap is closed.
export function useDfyCandidates(): Candidate[] {
  const overrides = useFieldOverrides();
  const sled = useSledRegistrations();
  const orders = useDfyOrders();
  return useMemo(() => {
    const list: Candidate[] = [];
    if (effectiveField(FIELD_DEFS["dsbs"], overrides).state === "missing") {
      list.push({ service: DFY_SERVICES["sbs-visibility"], target: { kind: "field", fieldId: "dsbs" } });
    }
    for (const r of sled) {
      const id = sledServiceFor(r.state);
      if (r.status === "missing" && id) list.push({ service: DFY_SERVICES[id], target: { kind: "sled", state: r.state } });
    }
    if (!orders.some((o) => o.serviceId === "profile-maintenance")) {
      list.push({ service: DFY_SERVICES["profile-maintenance"], target: { kind: "none" } });
    }
    return list;
  }, [overrides, sled, orders]);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AggregatedDfyModal({ open, onOpenChange }: Props) {
  const candidates = useDfyCandidates();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [placed, setPlaced] = useState<{ count: number; total: number } | null>(null);

  const total = useMemo(
    () => candidates.reduce((sum, c) => (selected[c.service.id] ? sum + c.service.price : sum), 0),
    [candidates, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleEnroll() {
    const picks = candidates.filter((c) => selected[c.service.id]);
    picks.forEach((c) => orderService(c.service.id, c.target));
    setPlaced({ count: picks.length, total });
    setSelected({});
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setPlaced(null);
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content bp-modal-content-lg adfy-modal">
          <Dialog.Title className="adfy-title">
            {placed ? "Orders placed" : "Resolve your gaps with our services"}
          </Dialog.Title>
          <Dialog.Description className="adfy-subtitle">
            {placed
              ? `${placed.count} ${placed.count === 1 ? "service" : "services"}, ${fmtUsd(placed.total)} in all. ${invoiceLine()}`
              : "Pick what you want done for you. Sorted by what unlocks the most for you right now."}
          </Dialog.Description>

          {!placed && (
            <>
              <ul className="adfy-list">
                {candidates.map(({ service: svc }) => {
                  const checked = !!selected[svc.id];
                  return (
                    <li key={svc.id} className="adfy-row" data-checked={checked}>
                      <Checkbox.Root
                        id={`adfy-${svc.id}`}
                        checked={checked}
                        onCheckedChange={() => toggle(svc.id)}
                        className="adfy-checkbox"
                        aria-label={svc.name}
                      >
                        <Checkbox.Indicator className="adfy-checkbox-indicator">
                          <Check size={14} strokeWidth={3} />
                        </Checkbox.Indicator>
                      </Checkbox.Root>

                      <label htmlFor={`adfy-${svc.id}`} className="adfy-middle">
                        <div className="adfy-name">{svc.name}</div>
                        {svc.impacts.map((line) => (
                          <div key={line} className="adfy-impact">
                            → {line}
                          </div>
                        ))}
                      </label>

                      <div className="adfy-right">
                        <div className="adfy-price">{fmtUsd(svc.price)}</div>
                        <div className="adfy-cadence">{svc.cadence}</div>
                      </div>
                    </li>
                  );
                })}
                {candidates.length === 0 && <li className="adfy-row">Nothing left to order. Your profile is covered.</li>}
              </ul>

              <div className="adfy-footer">
                <div className="adfy-total" aria-live="polite">
                  Total: <span className="adfy-total-value">{fmtUsd(total)}</span>
                </div>
                <Button
                  variant="primary"
                  className="adfy-enroll"
                  disabled={total === 0}
                  onClick={handleEnroll}
                >
                  Enroll selected
                </Button>
              </div>
              <p className="adfy-disclaimer">
                Subscription services bill monthly until cancelled. One-time
                services are charged at enrollment.
              </p>
            </>
          )}

          {placed && (
            <div className="adfy-footer">
              <div className="adfy-total">Follow each order on the field it fixes.</div>
              <Button variant="primary" className="adfy-enroll" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              className="ky-modal-close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
