import { useEffect, useState, type KeyboardEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { X } from "lucide-react";
import { Button, Input } from "@/components/ui";

export type EditInputType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "range"
  | "date"
  | "boolean"
  | "file"
  | "number";

export interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string;
  helperMicrocopy?: string;
  inputType?: EditInputType;
  options?: string[];
  initialValue?: unknown;
  // DEMO: the modal hands the value back to the field, which saves it in the demo store.
  onSave?: (value: unknown) => void;
  /** Returns a sentence when the value is wrong, or null. */
  validate?: (value: unknown) => string | null;
  placeholder?: string;
}

export function EditModal({
  open,
  onOpenChange,
  fieldLabel,
  helperMicrocopy,
  inputType = "text",
  options = [],
  initialValue,
  onSave,
  validate,
  placeholder,
}: EditModalProps) {
  const [textValue, setTextValue] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [chipDraft, setChipDraft] = useState("");
  const [rangeMin, setRangeMin] = useState("");
  const [rangeMax, setRangeMax] = useState("");
  const [boolValue, setBoolValue] = useState(false);
  // DEMO: the file the visitor picked, and the reason a value was refused.
  const [fileName, setFileName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  // Reset when reopening
  useEffect(() => {
    if (!open) return;
    setProblem(null);
    setFileName("");
    setChipDraft("");
    if (inputType === "multiselect") {
      // DEMO: a list field with no answer yet starts empty, not with the last list.
      setChips(Array.isArray(initialValue) ? (initialValue as string[]) : []);
    } else if (inputType === "range" && initialValue && typeof initialValue === "object") {
      const r = initialValue as { min?: number; max?: number };
      setRangeMin(r.min?.toString() ?? "");
      setRangeMax(r.max?.toString() ?? "");
    } else if (inputType === "boolean") {
      setBoolValue(Boolean(initialValue));
    } else {
      setTextValue(typeof initialValue === "string" ? initialValue : "");
    }
  }, [open, inputType, initialValue]);

  function handleSave() {
    let value: unknown = textValue;
    if (inputType === "multiselect") {
      // DEMO: a word typed but not yet entered still counts.
      value = chipDraft.trim() ? [...chips, chipDraft.trim()] : chips;
    } else if (inputType === "range")
      value = {
        min: rangeMin ? Number(rangeMin) : null,
        max: rangeMax ? Number(rangeMax) : null,
      };
    else if (inputType === "boolean") value = boolValue;
    else if (inputType === "file") value = fileName;
    else if (typeof value === "string") value = value.trim();
    // DEMO: refuse a wrong or empty answer in the modal, in plain words.
    if (inputType === "file" && !fileName) {
      setProblem("Choose a file first.");
      return;
    }
    if (inputType === "range") {
      const r = value as { min: number | null; max: number | null };
      if (r.min == null && r.max == null) {
        setProblem("Enter at least one amount.");
        return;
      }
      if (r.min != null && r.max != null && r.min > r.max) {
        setProblem("The minimum cannot be higher than the maximum.");
        return;
      }
    } else if (inputType === "multiselect") {
      if ((value as string[]).length === 0) {
        setProblem("Add at least one item.");
        return;
      }
    } else if (inputType !== "boolean" && value === "") {
      setProblem("Enter an answer, or press Cancel.");
      return;
    }
    const message = validate?.(value) ?? null;
    if (message) {
      setProblem(message);
      return;
    }
    setProblem(null);
    onSave?.(value);
    onOpenChange(false);
  }

  function handleChipKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && chipDraft.trim()) {
      e.preventDefault();
      setChips((c) => [...c, chipDraft.trim()]);
      setChipDraft("");
    } else if (e.key === "Backspace" && !chipDraft && chips.length) {
      setChips((c) => c.slice(0, -1));
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content">
          <Dialog.Title className="bp-modal-title">{fieldLabel} — Edit</Dialog.Title>
          {helperMicrocopy && (
            <Dialog.Description className="bp-modal-helper">
              {helperMicrocopy}
            </Dialog.Description>
          )}

          <div className="bp-modal-form">
            {renderInput()}
            {problem && (
              <p className="bp-modal-problem" role="alert">
                {problem}
              </p>
            )}
          </div>

          <div className="bp-modal-footer">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
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

  function renderInput() {
    switch (inputType) {
      case "textarea":
        return (
          <textarea
            className="bp-modal-textarea"
            value={textValue}
            placeholder={placeholder}
            onChange={(e) => {
              setTextValue(e.target.value);
              setProblem(null);
            }}
            rows={5}
          />
        );
      case "select":
        return (
          <select
            className="bp-modal-select"
            value={textValue}
            onChange={(e) => {
              setTextValue(e.target.value);
              setProblem(null);
            }}
          >
            <option value="">Select…</option>
            {/* DEMO: keep the current answer in the list even when it is not one of the options. */}
            {[...(textValue && !options.includes(textValue) ? [textValue] : []), ...options].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case "multiselect":
        return (
          <div className="bp-modal-chip-input">
            {chips.map((c, i) => (
              <span key={`${c}-${i}`} className="bp-modal-chip">
                {c}
                <button
                  type="button"
                  aria-label={`Remove ${c}`}
                  onClick={() => setChips((cs) => cs.filter((_, idx) => idx !== i))}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              className="bp-modal-chip-field"
              value={chipDraft}
              onChange={(e) => setChipDraft(e.target.value)}
              onKeyDown={handleChipKey}
              placeholder={chips.length ? "" : (placeholder ?? "Type and press Enter")}
            />
          </div>
        );
      case "range":
        return (
          <div className="bp-modal-range">
            <label className="bp-modal-range-field">
              <span className="bp-modal-range-label">Min</span>
              <span className="bp-modal-range-prefix">$</span>
              <Input
                variant="number"
                aria-label={`${fieldLabel} minimum`}
                value={rangeMin}
                onChange={(e) => {
                  setRangeMin(e.target.value);
                  setProblem(null);
                }}
              />
            </label>
            <label className="bp-modal-range-field">
              <span className="bp-modal-range-label">Max</span>
              <span className="bp-modal-range-prefix">$</span>
              <Input
                variant="number"
                aria-label={`${fieldLabel} maximum`}
                value={rangeMax}
                onChange={(e) => {
                  setRangeMax(e.target.value);
                  setProblem(null);
                }}
              />
            </label>
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            variant="text"
            aria-label={fieldLabel}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
          />
        );
      case "boolean":
        return (
          <label className="bp-modal-switch-row">
            <Switch.Root
              checked={boolValue}
              onCheckedChange={setBoolValue}
              className="bp-edit-switch"
            >
              <Switch.Thumb className="bp-edit-switch-thumb" />
            </Switch.Root>
            <span>{boolValue ? "Yes" : "No"}</span>
          </label>
        );
      case "file":
        return (
          <Input
            type="file"
            variant="text"
            aria-label={fieldLabel}
            onChange={(e) => {
              setFileName(e.target.files?.[0]?.name ?? "");
              setProblem(null);
            }}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            variant="text"
            aria-label={fieldLabel}
            value={textValue}
            min={0}
            onChange={(e) => {
              setTextValue(e.target.value);
              setProblem(null);
            }}
          />
        );
      case "text":
      default:
        return (
          <Input
            variant="text"
            aria-label={fieldLabel}
            value={textValue}
            placeholder={placeholder}
            onChange={(e) => {
              setTextValue(e.target.value);
              setProblem(null);
            }}
          />
        );
    }
  }
}
