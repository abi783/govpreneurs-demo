import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Circle,
  Clock,
  Loader2,
  Minus,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { EditModal, type EditInputType } from "./EditModal";
import { Card } from "../ui/Card";
// DEMO: orders, enrollment cards and the read-only view.
import { DfyEnrollmentDialog, DfyOrderDialog } from "./DfyDialogs";
import { useEditMode } from "./BusinessProfileMode";
import { HelpPopover } from "./HelpPopover";
import { DFY_SERVICES, type DfyServiceId } from "../../demo/profile/dfy";
import { useFileChooser } from "../../demo/profile/useFileChooser";

export type FieldRowState =
  | "verified"
  | "needs_review"
  | "attested"
  | "inferred"
  | "stale"
  | "missing"
  | "conflict"
  | "pending_dfy"
  | "error";

export interface ConflictValue {
  source: string;
  value: string;
}

export interface DfyUpsell {
  service: string;
  price: number;
  leadField?: boolean;
  /** DEMO: the catalog id of the service. Found from the name when absent. */
  serviceId?: DfyServiceId;
}

/** DEMO: the catalog id for a service name such as "SBS Visibility Setup". */
function serviceIdFor(d: DfyUpsell): DfyServiceId | undefined {
  if (d.serviceId) return d.serviceId;
  return (Object.values(DFY_SERVICES).find((s) => s.name === d.service)?.id) as DfyServiceId | undefined;
}

export interface FieldRowProps {
  label: string;
  helperMicrocopy?: string;
  state: FieldRowState;
  value?: string | ReactNode;
  conflictValues?: ConflictValue[];
  source?: string;
  errorMessage?: string;
  pendingDfyMessage?: string;
  staleAgeInDays?: number;
  staleConsequence?: string;
  tier: "T1" | "T2" | "T3";
  whyItMatters?: string;
  chatEditable?: boolean;
  onEdit?: () => void;
  onReVerify?: () => void;
  onConfirm?: () => void;
  onAdd?: () => void;
  onTryAgain?: () => void;
  onResolveConflict?: (chosenSource: string) => void;
  onViewEnrollment?: () => void;
  dfy?: DfyUpsell;
  // DEMO: what an edit needs, and what a save does.
  /** The id the field is saved under. Orders are tied to it. */
  fieldId?: string;
  editType?: EditInputType;
  editOptions?: string[];
  editValue?: unknown;
  editPlaceholder?: string;
  validate?: (value: unknown) => string | null;
  /** Called with the new value when the visitor saves in the edit modal. */
  onSave?: (value: unknown) => void;
  /** Called with the file name when the visitor picks another document. */
  onChooseDocument?: (fileName: string) => void;
  /** The DFY order that the "View enrollment" card shows. */
  dfyOrderId?: string;
}

const formatPrice = (n: number) =>
  n >= 1000 ? `$${n.toLocaleString("en-US")}` : `$${n}`;

function StateIndicator({ state }: { state: FieldRowState }) {
  switch (state) {
    case "stale":
      return <Clock size={12} className="fr-icon" aria-hidden />;
    case "missing":
      return <Minus size={12} className="fr-icon" aria-hidden />;
    case "conflict":
      return <AlertTriangle size={12} className="fr-icon" aria-hidden />;
    case "pending_dfy":
      return <Loader2 size={12} className="fr-icon fr-spin" aria-hidden />;
    default:
      return <span className="fr-dot" aria-hidden />;
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function FieldRow(props: FieldRowProps) {
  const {
    label,
    helperMicrocopy,
    state,
    value,
    conflictValues = [],
    source,
    errorMessage,
    pendingDfyMessage,
    staleAgeInDays,
    staleConsequence,
    tier,
    whyItMatters,
    chatEditable,
    onEdit,
    onReVerify,
    onConfirm,
    onAdd,
    onTryAgain,
    onResolveConflict,
    onViewEnrollment,
    dfy,
    fieldId,
    editOptions,
    editValue,
    editPlaceholder,
    validate,
    onSave,
    onChooseDocument,
    dfyOrderId,
  } = props;
  const router = useRouter();
  const editMode = useEditMode();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  // DEMO: a check in progress, a note after it, the order dialog, the enrollment card.
  const [busy, setBusy] = useState<null | "reverify" | "recheck" | "retry">(null);
  const [checkedNote, setCheckedNote] = useState<string | null>(null);
  const [dfyOpen, setDfyOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | undefined>(undefined);
  const docChooser = useFileChooser(([f]) => {
    if (!f) return;
    if (onChooseDocument) onChooseDocument(f.name);
    else setCheckedNote(`Read ${f.name}. Please check the value above.`);
  });
  const dfyServiceId = dfy ? serviceIdFor(dfy) : undefined;

  const inputType: EditInputType = inferInputType(props);
  const initialValue = editValue !== undefined ? editValue : typeof value === "string" ? value : undefined;

  const openEdit = () => setEditOpen(true);

  // DEMO: a check (re-verify, re-check, try again) shows a short "Checking…" and then runs.
  async function runCheck(kind: "reverify" | "recheck" | "retry", fn?: () => void) {
    setBusy(kind);
    setCheckedNote(null);
    await wait(900);
    if (fn) fn();
    else setCheckedNote("Checked just now — nothing has changed.");
    setBusy(null);
  }
  const checkLabel = (kind: "reverify" | "recheck" | "retry", idle: string) =>
    busy === kind ? "Checking…" : idle;

  const handleTellHunter = () => {
    router.navigate({ to: "/opportunities" });
  };
  const handleConfirm = (_kind: "needs_review" | "inferred") => {
    if (onConfirm) return onConfirm();
    setConfirmed(true);
  };
  const handleResolve = (chosenSource: string) => {
    if (onResolveConflict) return onResolveConflict(chosenSource);
    setConfirmed(true);
  };
  const handleViewEnrollment = () => {
    if (onViewEnrollment) return onViewEnrollment();
    setEnrollOpen(true);
  };
  const handleSave = (v: unknown) => {
    if (onSave) return onSave(v);
    setLocalValue(Array.isArray(v) ? v.join(" · ") : String(v ?? ""));
  };

  const shownValue = localValue ?? value;

  if (confirmed) {
    return (
      <div className={`fr-row fr-tier-${tier} fr-state-verified`}>
        <div className="fr-header">
          <Check size={12} className="fr-icon fr-icon-confirmed" aria-hidden />
          <span className="fr-label">{label}</span>
        </div>
        <div className="fr-value">
          <span className="fr-value-text">{shownValue ?? "Confirmed"}</span>
        </div>
        <div className="fr-footer">
          <div className="fr-prov">Confirmed by you</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fr-row fr-tier-${tier} fr-state-${state}`}>
      <div className="fr-header">
        <StateIndicator state={state} />
        <span className="fr-label">{label}</span>
        {whyItMatters && (
          <HelpPopover label="Why this matters" buttonClass="fr-help-btn">
            {whyItMatters}
          </HelpPopover>
        )}
      </div>

      {helperMicrocopy && state !== "missing" && (
        <div className="fr-helper">{helperMicrocopy}</div>
      )}

      <div className="fr-value">{renderValue({ ...props, value: shownValue })}</div>

      <div className="fr-footer">
        <div className="fr-prov">
          {renderProvenance({ state, source, staleAgeInDays, staleConsequence, pendingDfyMessage })}
          {checkedNote && <div className="fr-note">{checkedNote}</div>}
        </div>
        {/* DEMO: with Edit mode off the page is read-only, so the buttons are hidden. */}
        <div className="fr-actions" hidden={!editMode}>
          {state === "verified" && (
            <>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Edit
              </button>
              <button
                type="button"
                className="fr-btn-tertiary"
                disabled={busy !== null}
                onClick={() => void runCheck("reverify", onReVerify)}
              >
                <RefreshCw size={12} className={busy === "reverify" ? "fr-spin" : undefined} />{" "}
                {checkLabel("reverify", "Re-verify")}
              </button>
            </>
          )}
          {state === "needs_review" && (
            <>
              <button type="button" className="fr-btn-primary" onClick={() => handleConfirm("needs_review")}>
                Yes, this is right
              </button>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Edit
              </button>
              {source && (
                <>
                  <button type="button" className="fr-btn-tertiary" onClick={docChooser.open}>
                    Try a different document
                  </button>
                  {docChooser.input}
                  {docChooser.choosing && <span className="fr-note">Choose a file in the window that opened.</span>}
                </>
              )}
            </>
          )}
          {state === "attested" && (
            <>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Edit
              </button>
              {chatEditable && (
                <button type="button" className="fr-btn-tertiary" onClick={handleTellHunter}>
                  Tell Hunter in chat <ArrowUpRight size={12} />
                </button>
              )}
            </>
          )}
          {state === "inferred" && (
            <>
              <button type="button" className="fr-btn-primary" onClick={() => handleConfirm("inferred")}>
                Yes, that's right
              </button>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Set this myself
              </button>
            </>
          )}
          {state === "stale" && (
            <button
              type="button"
              className="fr-btn-tertiary"
              disabled={busy !== null}
              onClick={() => void runCheck("recheck", onReVerify)}
            >
              {checkLabel("recheck", "Re-check now")}
            </button>
          )}
          {state === "missing" && (
            <>
              <button type="button" className="fr-btn-primary" onClick={onAdd ?? openEdit}>
                Add now
              </button>
              {dfy && dfyServiceId && dfy.leadField !== false && (
                <button type="button" className="fr-btn-secondary" onClick={() => setDfyOpen(true)}>
                  Have us do it — {formatPrice(dfy.price)}
                </button>
              )}
              {dfy && dfyServiceId && dfy.leadField === false && (
                <button type="button" className="fr-btn-tertiary" onClick={() => setDfyOpen(true)}>
                  Included in our {dfy.service} <ArrowUpRight size={12} />
                </button>
              )}
            </>
          )}
          {state === "conflict" && (
            <>
              {conflictValues.map((cv) => (
                <button
                  key={cv.source}
                  type="button"
                  className="fr-btn-secondary"
                  onClick={() => handleResolve(cv.source)}
                >
                  Use {cv.source}
                </button>
              ))}
              <button type="button" className="fr-btn-tertiary" onClick={openEdit}>
                Neither — let me type it
              </button>
            </>
          )}
          {state === "pending_dfy" && (
            <button type="button" className="fr-btn-tertiary" onClick={handleViewEnrollment}>
              View enrollment
            </button>
          )}
          {state === "error" && (
            <>
              <button
                type="button"
                className="fr-btn-primary"
                disabled={busy !== null}
                onClick={() => void runCheck("retry", onTryAgain)}
              >
                {checkLabel("retry", "Try again")}
              </button>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Use a different value
              </button>
              {dfy && dfyServiceId && (
                <button type="button" className="fr-btn-secondary" onClick={() => setDfyOpen(true)}>
                  Have us do it — {formatPrice(dfy.price)}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <EditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        fieldLabel={label}
        helperMicrocopy={helperMicrocopy}
        inputType={inputType}
        options={editOptions}
        initialValue={initialValue}
        onSave={handleSave}
        validate={validate}
        placeholder={editPlaceholder}
      />
      {dfy && dfyServiceId && (
        <DfyOrderDialog
          open={dfyOpen}
          onOpenChange={setDfyOpen}
          serviceId={dfyServiceId}
          target={fieldId ? { kind: "field", fieldId } : { kind: "none" }}
        />
      )}
      <DfyEnrollmentDialog open={enrollOpen} onOpenChange={setEnrollOpen} orderId={dfyOrderId} />
    </div>
  );
}

function inferInputType(p: FieldRowProps): EditInputType {
  // DEMO: a field can name the kind of input it needs.
  if (p.editType) return p.editType;
  const v = typeof p.value === "string" ? p.value : "";
  if (v.length > 80) return "textarea";
  return "text";
}

function renderValue(p: FieldRowProps): ReactNode {
  const { state, value, conflictValues = [], errorMessage, helperMicrocopy } = p;

  switch (state) {
    case "verified":
    case "attested":
      return <span className="fr-value-text">{value}</span>;
    case "inferred":
      return <span className="fr-value-text fr-italic fr-muted">{value}</span>;
    case "stale":
      return <span className="fr-value-text fr-stale">{value}</span>;
    case "needs_review":
      return (
        <Card variant="compact" className="ui-card--fr ui-card--fr-warn">
          <div className="fr-card-lead">Found in {p.source} — review and confirm?</div>
          <div className="fr-value-text">{value}</div>
        </Card>
      );
    case "missing":
      return (
        <span className="fr-value-empty">
          {helperMicrocopy ?? "Not provided yet"}
        </span>
      );
    case "conflict":
      return (
        <div className="fr-conflict">
          <ul className="fr-conflict-list">
            {conflictValues.map((cv) => (
              <li key={cv.source} className="fr-conflict-row">
                <Circle size={8} className="fr-conflict-bullet" aria-hidden />
                <span className="fr-conflict-src">From {cv.source}:</span>
                <span className="fr-value-text">{cv.value}</span>
              </li>
            ))}
          </ul>
          <div className="fr-conflict-prompt">Which is correct?</div>
        </div>
      );
    case "pending_dfy":
      return <span className="fr-value-pending">Our team is preparing this</span>;
    case "error":
      return (
        <Card variant="compact" className="ui-card--fr ui-card--fr-error">
          <div className="fr-value-text fr-error-value">{value}</div>
          {errorMessage && <div className="fr-error-msg">{errorMessage}</div>}
        </Card>
      );
    default:
      return null;
  }
}

function renderProvenance({
  state,
  source,
  staleAgeInDays,
  staleConsequence,
  pendingDfyMessage,
}: {
  state: FieldRowState;
  source?: string;
  staleAgeInDays?: number;
  staleConsequence?: string;
  pendingDfyMessage?: string;
}): ReactNode {
  switch (state) {
    case "verified":
      return source ? <>Verified — {source}</> : null;
    case "attested":
      return source ?? null;
    case "inferred":
      return source ? <>Hunter's guess based on {source}</> : null;
    case "stale":
      return (
        <>
          Last checked {staleAgeInDays ?? "—"} days ago
          {staleConsequence ? <> — {staleConsequence}</> : null}
        </>
      );
    case "pending_dfy":
      return pendingDfyMessage ?? null;
    default:
      return null;
  }
}
