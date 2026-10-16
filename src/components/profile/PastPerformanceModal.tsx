import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface PpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CUSTOMER_TYPES = [
  "Federal Prime",
  "Federal Sub",
  "State Government",
  "Local Government",
  "Commercial",
  "Non-Profit",
  "Other",
];

const CONTRACT_TYPES = [
  "FFP",
  "T&M",
  "Cost-Plus",
  "IDIQ",
  "GSA Schedule",
  "BPA",
  "Cooperative",
  "Grant",
  "Other",
];

const CPARS_RATINGS = [
  "Exceptional",
  "Very Good",
  "Satisfactory",
  "Marginal",
  "Unsatisfactory",
  "N/A",
];

const STEP_NAMES = ["Basics", "Details", "Reference"];

interface FormState {
  title: string;
  customer: string;
  customerType: string;
  contractType: string;
  periodStart: string;
  periodEnd: string;
  value: string;
  role: "Prime" | "Sub" | "";
  naics: string;
  vehicle: string;
  successful: "Yes" | "Partially" | "No" | "";
  scope: string;
  refName: string;
  refTitle: string;
  refEmail: string;
  refPhone: string;
  cpars: string;
}

const EMPTY: FormState = {
  title: "",
  customer: "",
  customerType: "",
  contractType: "",
  periodStart: "",
  periodEnd: "",
  value: "",
  role: "",
  naics: "",
  vehicle: "",
  successful: "",
  scope: "",
  refName: "",
  refTitle: "",
  refEmail: "",
  refPhone: "",
  cpars: "",
};

export function PastPerformanceModal({ open, onOpenChange }: PpModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setStep(1);
    setForm(EMPTY);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSave = () => {
    console.log("PastPerformanceModal save", form);
    handleClose(false);
  };

  const emailValid =
    !form.refEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.refEmail);
  const scopeLen = form.scope.length;
  const scopeValid = scopeLen >= 50 && scopeLen <= 2000;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content bp-modal-content-lg">
          <Dialog.Title className="bp-modal-title">Add a project</Dialog.Title>

          <div className="pp-wizard-progress">
            <div className="pp-wizard-step-name">
              Step {step} of 3 · {STEP_NAMES[step - 1]}
            </div>
            <div className="pp-wizard-bar" aria-hidden>
              <div
                className="pp-wizard-bar-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="bp-modal-form">
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Project Title</span>
                <Input
                  variant="text"
                  aria-label="Project Title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Customer Name</span>
                <Input
                  variant="text"
                  aria-label="Customer Name"
                  value={form.customer}
                  onChange={(e) => set("customer", e.target.value)}
                />
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Customer Type</span>
                <select
                  className="bp-modal-select"
                  value={form.customerType}
                  onChange={(e) => set("customerType", e.target.value)}
                >
                  <option value="">Select…</option>
                  {CUSTOMER_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Contract Type</span>
                <select
                  className="bp-modal-select"
                  value={form.contractType}
                  onChange={(e) => set("contractType", e.target.value)}
                >
                  <option value="">Select…</option>
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="bp-modal-form">
              <div className="pp-wizard-row">
                <label className="pp-wizard-field">
                  <span className="pp-wizard-label">Start</span>
                  <Input
                    type="date"
                    variant="text"
                    aria-label="Period start"
                    value={form.periodStart}
                    onChange={(e) => set("periodStart", e.target.value)}
                  />
                </label>
                <label className="pp-wizard-field">
                  <span className="pp-wizard-label">End</span>
                  <Input
                    type="date"
                    variant="text"
                    aria-label="Period end"
                    value={form.periodEnd}
                    onChange={(e) => set("periodEnd", e.target.value)}
                  />
                </label>
              </div>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Total Value</span>
                <div className="pp-wizard-prefix-wrap">
                  <span className="pp-wizard-prefix">$</span>
                  <Input
                    variant="number"
                    className="pp-wizard-prefix-input"
                    aria-label="Total Value"
                    value={form.value}
                    onChange={(e) => set("value", e.target.value)}
                  />
                </div>
              </label>
              <fieldset className="pp-wizard-fieldset">
                <legend className="pp-wizard-label">Role</legend>
                {(["Prime", "Sub"] as const).map((r) => (
                  <label key={r} className="pp-wizard-radio">
                    <input
                      type="radio"
                      name="pp-role"
                      checked={form.role === r}
                      onChange={() => set("role", r)}
                    />
                    {r}
                  </label>
                ))}
              </fieldset>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">NAICS Code</span>
                <Input
                  variant="text"
                  list="pp-naics-list"
                  aria-label="NAICS Code"
                  value={form.naics}
                  onChange={(e) => set("naics", e.target.value)}
                />
                <datalist id="pp-naics-list">
                  <option value="238160" />
                  <option value="238170" />
                  <option value="236220" />
                </datalist>
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Vehicle (optional)</span>
                <Input
                  variant="text"
                  aria-label="Vehicle"
                  value={form.vehicle}
                  onChange={(e) => set("vehicle", e.target.value)}
                />
              </label>
              <fieldset className="pp-wizard-fieldset">
                <legend className="pp-wizard-label">Successful</legend>
                {(["Yes", "Partially", "No"] as const).map((r) => (
                  <label key={r} className="pp-wizard-radio">
                    <input
                      type="radio"
                      name="pp-successful"
                      checked={form.successful === r}
                      onChange={() => set("successful", r)}
                    />
                    {r}
                  </label>
                ))}
              </fieldset>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Scope Description</span>
                <textarea
                  className="bp-modal-textarea"
                  rows={5}
                  value={form.scope}
                  onChange={(e) => set("scope", e.target.value)}
                />
                <span
                  className="pp-wizard-counter"
                  data-invalid={!scopeValid ? "true" : "false"}
                >
                  {scopeLen} / 2000 (min 50)
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="bp-modal-form">
              <p className="pp-wizard-intro">
                Add a reference for this project (optional but strongly recommended)
              </p>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Name</span>
                <Input
                  variant="text"
                  aria-label="Reference name"
                  value={form.refName}
                  onChange={(e) => set("refName", e.target.value)}
                />
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Title</span>
                <Input
                  variant="text"
                  aria-label="Reference title"
                  value={form.refTitle}
                  onChange={(e) => set("refTitle", e.target.value)}
                />
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Email</span>
                <Input
                  type="email"
                  variant="text"
                  aria-label="Reference email"
                  value={form.refEmail}
                  onChange={(e) => set("refEmail", e.target.value)}
                  aria-invalid={!emailValid}
                />
                {!emailValid && (
                  <span className="pp-wizard-counter" data-invalid="true">
                    Enter a valid email address
                  </span>
                )}
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Phone</span>
                <Input
                  type="tel"
                  variant="text"
                  aria-label="Reference phone"
                  value={form.refPhone}
                  onChange={(e) => set("refPhone", e.target.value)}
                />
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">CPARS Rating</span>
                <select
                  className="bp-modal-select"
                  value={form.cpars}
                  onChange={(e) => set("cpars", e.target.value)}
                >
                  <option value="">Select…</option>
                  {CPARS_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pp-wizard-field">
                <span className="pp-wizard-label">Supporting Documents</span>
                <Input type="file" multiple variant="text" aria-label="Supporting documents" />
              </label>
            </div>
          )}

          <div className="bp-modal-footer">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {step < 3 && (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            )}
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
