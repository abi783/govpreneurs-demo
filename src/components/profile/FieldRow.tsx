import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Circle,
  Clock,
  HelpCircle,
  Loader2,
  Minus,
  RefreshCw,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useRouter } from "@tanstack/react-router";
import { EditModal, type EditInputType } from "./EditModal";
import { Card } from "../ui/Card";

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

const noop = (label: string) => () => console.log("FieldRow action:", label);

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
  } = props;
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const inputType: EditInputType = inferInputType(props);
  const initialValue = typeof value === "string" ? value : undefined;

  const openEdit = () => setEditOpen(true);

  const handleTellHunter = () => {
    console.log("Tell Hunter elicit:", { field: label, prompt: `elicit:${label}` });
    router.navigate({ to: "/opportunities" });
  };
  const handleConfirm = (kind: "needs_review" | "inferred") => {
    if (onConfirm) return onConfirm();
    console.log(`confirm: ${label} →`, kind === "inferred" ? "attested" : "verified");
    setConfirmed(true);
  };
  const handleResolve = (chosenSource: string) => {
    if (onResolveConflict) return onResolveConflict(chosenSource);
    console.log(`resolve conflict: ${label} →`, chosenSource);
    setConfirmed(true);
  };
  const handleTryAgain = () => {
    if (onTryAgain) return onTryAgain();
    console.log(`validator retry: ${label}`);
  };
  const handleViewEnrollment = () => {
    if (onViewEnrollment) return onViewEnrollment();
    console.log(`would route to /roadmap#${label}`);
  };

  if (confirmed) {
    return (
      <div className={`fr-row fr-tier-${tier} fr-state-verified`}>
        <div className="fr-header">
          <Check size={12} className="fr-icon fr-icon-confirmed" aria-hidden />
          <span className="fr-label">{label}</span>
        </div>
        <div className="fr-value">
          <span className="fr-value-text">{value ?? "Confirmed"}</span>
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
          <Tooltip.Provider delayDuration={150}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button type="button" className="fr-help-btn" aria-label="Why this matters">
                  <HelpCircle size={14} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="rh-tooltip" side="top" sideOffset={6}>
                  {whyItMatters}
                  <Tooltip.Arrow className="rh-tooltip-arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>

      {helperMicrocopy && state !== "missing" && (
        <div className="fr-helper">{helperMicrocopy}</div>
      )}

      <div className="fr-value">{renderValue(props)}</div>

      <div className="fr-footer">
        <div className="fr-prov">{renderProvenance({ state, source, staleAgeInDays, staleConsequence, pendingDfyMessage })}</div>
        <div className="fr-actions">
          {state === "verified" && (
            <>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Edit
              </button>
              <button type="button" className="fr-btn-tertiary" onClick={onReVerify ?? noop("re-verify")}>
                <RefreshCw size={12} /> Re-verify
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
                <button type="button" className="fr-btn-tertiary" onClick={noop("try-different-doc")}>
                  Try a different document
                </button>
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
            <button type="button" className="fr-btn-tertiary" onClick={onReVerify ?? noop("recheck")}>
              Re-check now
            </button>
          )}
          {state === "missing" && (
            <>
              <button type="button" className="fr-btn-primary" onClick={onAdd ?? openEdit}>
                Add now
              </button>
              {dfy && dfy.leadField !== false && (
                <button type="button" className="fr-btn-secondary" onClick={noop("dfy-" + dfy.service)}>
                  Have us do it — {formatPrice(dfy.price)}
                </button>
              )}
              {dfy && dfy.leadField === false && (
                <button type="button" className="fr-btn-tertiary" onClick={noop("dfy-ref-" + dfy.service)}>
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
              <button type="button" className="fr-btn-primary" onClick={handleTryAgain}>
                Try again
              </button>
              <button type="button" className="fr-btn-tertiary" onClick={onEdit ?? openEdit}>
                Use a different value
              </button>
              {dfy && (
                <button type="button" className="fr-btn-secondary" onClick={noop("dfy-" + dfy.service)}>
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
        initialValue={initialValue}
      />
    </div>
  );
}

function inferInputType(p: FieldRowProps): EditInputType {
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
