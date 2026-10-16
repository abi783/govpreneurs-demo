import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Clock, Minus, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useEditMode } from "./BusinessProfileMode";
import { DfyEnrollmentDialog, DfyOrderDialog } from "./DfyDialogs";
import { DFY_SERVICES } from "../../demo/profile/dfy";
import { sledServiceFor } from "../../demo/profile/actions";
import { STATE_NAMES, updateSled, useSledRegistrations, type SledRegistration } from "../../demo/profile/sled";
import { fmtShort } from "../../demo/profile/dates";
import { useDfyOrders } from "../../demo/profile/dfy";

// DEMO: the registrations are kept in the demo store. A visitor can register
// herself (a short guide, then the vendor ID she was given) or order the service.
const SELF_STEPS = [
  "Open your state's vendor registration page.",
  "Create an account with your business email.",
  "Enter your legal name, EIN, address and NAICS codes. Your Business Profile has them.",
  "Submit the form. The state emails you a vendor ID.",
];

export function SledRegistrationsTable() {
  const rows = useSledRegistrations();
  const orders = useDfyOrders();
  const editMode = useEditMode();
  const [selfFor, setSelfFor] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState("");
  const [orderFor, setOrderFor] = useState<string | null>(null);
  const [enrollFor, setEnrollFor] = useState<SledRegistration | null>(null);

  const pending = rows.filter((r) => r.status === "pending_dfy").length;
  const missing = rows.filter((r) => r.status === "missing").length;
  const done = rows.filter((r) => r.status === "registered").length;

  const statusText = (r: SledRegistration): string => {
    if (r.status === "registered") return `Registered${r.vendorId ? ` — vendor ID ${r.vendorId}` : ""}`;
    if (r.status === "pending_dfy") {
      const o = orders.find((x) => x.id === r.orderId);
      return o ? `Pending — our team delivers by ${fmtShort(o.eta)}` : "Pending — our team is preparing it";
    }
    return "Not registered";
  };

  const orderServiceId = orderFor ? sledServiceFor(orderFor) : undefined;

  return (
    <div className="sled-row">
      <div className="sled-row-header">
        <span className="fr-label">SLED Vendor Registrations</span>
        <span className="sled-status-pill">
          {done} registered · {pending} pending · {missing} missing
        </span>
      </div>
      <div className="sled-row-value">
        <table className="sled-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.state}>
                <td>{STATE_NAMES[r.state] ?? r.state}</td>
                <td>
                  <span className="sled-status-cell">
                    {r.status === "registered" ? (
                      <Check size={12} className="sled-status-icon" aria-hidden />
                    ) : r.status === "pending_dfy" ? (
                      <Clock size={12} className="sled-status-icon sled-status-pending" aria-hidden />
                    ) : (
                      <Minus size={12} className="sled-status-icon sled-status-missing" aria-hidden />
                    )}
                    {statusText(r)}
                  </span>
                </td>
                <td>
                  {!editMode ? null : r.status === "pending_dfy" ? (
                    <button type="button" className="sled-action-btn" onClick={() => setEnrollFor(r)}>
                      View enrollment →
                    </button>
                  ) : r.status === "registered" ? (
                    <button
                      type="button"
                      className="sled-action-btn"
                      onClick={() => {
                        setVendorId(r.vendorId ?? "");
                        setSelfFor(r.state);
                      }}
                    >
                      Edit vendor ID
                    </button>
                  ) : (
                    <div className="sled-action-group">
                      <button
                        type="button"
                        className="sled-action-btn"
                        onClick={() => {
                          setVendorId("");
                          setSelfFor(r.state);
                        }}
                      >
                        Register myself
                      </button>
                      {sledServiceFor(r.state) && (
                        <>
                          <span className="sled-action-sep">·</span>
                          <button type="button" className="sled-action-btn" onClick={() => setOrderFor(r.state)}>
                            Have us — ${DFY_SERVICES[sledServiceFor(r.state)!].price.toLocaleString("en-US")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog.Root open={selfFor !== null} onOpenChange={(o) => !o && setSelfFor(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="ky-modal-overlay" />
          <Dialog.Content className="bp-modal-content">
            <Dialog.Title className="bp-modal-title">
              Register in {selfFor ? (STATE_NAMES[selfFor] ?? selfFor) : ""}
            </Dialog.Title>
            <Dialog.Description className="bp-modal-helper">
              Four steps. When the state gives you a vendor ID, enter it here and we mark the state as registered.
            </Dialog.Description>
            <ol className="sled-dialog-steps">
              {SELF_STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <label className="sled-vendor-input">
              <span className="pp-wizard-label">Vendor ID from the state</span>
              <input
                className="bp-modal-select"
                value={vendorId}
                placeholder="For example 0012345"
                onChange={(e) => setVendorId(e.target.value)}
                aria-label="Vendor ID from the state"
              />
            </label>
            <div className="bp-modal-footer">
              <Button variant="secondary" onClick={() => setSelfFor(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!vendorId.trim()}
                onClick={() => {
                  if (selfFor)
                    updateSled(selfFor, {
                      status: "registered",
                      vendorId: vendorId.trim(),
                      registeredAt: new Date().toISOString(),
                    });
                  setSelfFor(null);
                }}
              >
                Save — I am registered
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

      {orderFor && orderServiceId && (
        <DfyOrderDialog
          open
          onOpenChange={(o) => !o && setOrderFor(null)}
          serviceId={orderServiceId}
          target={{ kind: "sled", state: orderFor }}
        />
      )}
      <DfyEnrollmentDialog
        open={enrollFor !== null}
        onOpenChange={(o) => !o && setEnrollFor(null)}
        orderId={enrollFor?.orderId}
      />
    </div>
  );
}
