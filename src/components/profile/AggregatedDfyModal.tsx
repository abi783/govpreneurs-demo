import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";

type Cadence = "one-time" | "subscription" | "per state";

interface ServiceRow {
  id: string;
  name: string;
  price: number;
  cadence: Cadence;
  impacts: string[];
}

// Marcus's applicable services, in impact-sort order per the prompt.
const SERVICES: ServiceRow[] = [
  {
    id: "sbs-visibility",
    name: "SBS Visibility Setup",
    price: 997,
    cadence: "one-time",
    impacts: ["Builds your DSBS profile so federal buyers can find you"],
  },
  {
    id: "capability-statement",
    name: "Capability Statement",
    price: 2000,
    cadence: "one-time",
    impacts: [
      "Improves Hunter's match quality across the board",
      "Also extracts your past performance entries",
    ],
  },
  {
    id: "govcompliant-digital",
    name: "GovCompliant Digital Setup",
    price: 2997,
    cadence: "subscription",
    impacts: ["Website + email domain + business phone in one"],
  },
  {
    id: "sled-va",
    name: "SLED Enrollment — Virginia",
    price: 2497,
    cadence: "per state",
    impacts: ["Unlocks state and local opportunities in VA"],
  },
  {
    id: "sled-sc",
    name: "SLED Enrollment — South Carolina",
    price: 2497,
    cadence: "per state",
    impacts: ["Unlocks state and local opportunities in SC"],
  },
  {
    id: "sled-ga",
    name: "SLED Enrollment — Georgia",
    price: 2497,
    cadence: "per state",
    impacts: ["Unlocks state and local opportunities in GA"],
  },
  {
    id: "profile-maintenance",
    name: "Profile Maintenance & Compliance Alerts",
    price: 290,
    cadence: "subscription",
    impacts: ["Keeps your SAM, SOS, and other registrations from going stale"],
  },
];

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AggregatedDfyModal({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const total = useMemo(
    () =>
      SERVICES.reduce(
        (sum, svc) => (selected[svc.id] ? sum + svc.price : sum),
        0,
      ),
    [selected],
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleEnroll() {
    const picks = SERVICES.filter((s) => selected[s.id]).map((s) => s.id);
    console.log("[aggregated-dfy] enroll selected:", picks, "total:", total);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content bp-modal-content-lg adfy-modal">
          <Dialog.Title className="adfy-title">
            Resolve your gaps with our services
          </Dialog.Title>
          <Dialog.Description className="adfy-subtitle">
            Pick what you want done for you. Sorted by what unlocks the most for
            you right now.
          </Dialog.Description>

          <ul className="adfy-list">
            {SERVICES.map((svc) => {
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
                    <div className="adfy-price">{fmt(svc.price)}</div>
                    <div className="adfy-cadence">{svc.cadence}</div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="adfy-footer">
            <div className="adfy-total" aria-live="polite">
              Total: <span className="adfy-total-value">{fmt(total)}</span>
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
