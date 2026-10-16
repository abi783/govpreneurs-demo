import { useState } from "react";
import { Check, Edit2, Sparkles, X } from "lucide-react";
import { useEditMode } from "./BusinessProfileMode";

export type PpStatus = "attested" | "needs_review";

export interface PastPerformanceEntry {
  id: string;
  title: string;
  customer: string;
  customerType: string;
  /** DEMO: the story has no contract type, so the card only shows one when it has one. */
  contractType?: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  naics: string;
  scope: string;
  referenceName?: string;
  referenceTitle?: string;
  cpars?: string;
  status: PpStatus;
  /** DEMO: where a "needs review" entry came from. */
  extractedFrom?: string;
}

// DEMO: what the card's buttons do is decided by the tab, which saves in the demo store.
export interface PastPerformanceActions {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onNotReal?: (id: string) => void;
}

function formatValue(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function PastPerformanceCard({
  entry,
  actions = {},
}: {
  entry: PastPerformanceEntry;
  actions?: PastPerformanceActions;
}) {
  const [expanded, setExpanded] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const editMode = useEditMode();
  const isNeedsReview = entry.status === "needs_review";

  return (
    <article className="pp-card" data-needs-review={isNeedsReview ? "true" : "false"}>
      {isNeedsReview && (
        <div className="pp-extracted-banner">
          <Sparkles size={12} aria-hidden />
          <span>{entry.extractedFrom ?? "Added from a file"} — review and confirm?</span>
        </div>
      )}

      <header className="pp-card-header">
        <h3 className="pp-card-title">{entry.title}</h3>
        {!isNeedsReview && editMode && (
          <div className="pp-card-icons">
            <button
              type="button"
              className="pp-card-icon-btn"
              aria-label="Edit project"
              onClick={() => actions.onEdit?.(entry.id)}
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="pp-card-icon-btn"
              aria-label="Delete project"
              onClick={() => setAskDelete(true)}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </header>

      {askDelete && (
        <div className="pp-extracted-banner" role="alertdialog" aria-label="Delete this project?">
          <span>Delete this project from your profile?</span>
          <div className="pp-needs-review-actions">
            <button
              type="button"
              className="pp-btn-primary pp-btn-sm"
              onClick={() => {
                actions.onDelete?.(entry.id);
                setAskDelete(false);
              }}
            >
              Yes, delete it
            </button>
            <button type="button" className="pp-btn-secondary pp-btn-sm" onClick={() => setAskDelete(false)}>
              Keep it
            </button>
          </div>
        </div>
      )}

      <div className="pp-card-sub">
        {entry.customer} · {entry.customerType}
        {entry.contractType ? ` · ${entry.contractType}` : ""}
      </div>
      <div className="pp-card-meta">
        {entry.periodStart} – {entry.periodEnd} · {formatValue(entry.value)} · NAICS {entry.naics}
      </div>

      <p className="pp-card-scope" data-expanded={expanded ? "true" : "false"}>
        {entry.scope}
      </p>
      {entry.scope.length > 160 && (
        <button
          type="button"
          className="pp-card-more-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "less" : "...more"}
        </button>
      )}

      {entry.referenceName && (
        <div className="pp-card-ref">
          <Check size={12} className="pp-card-ref-icon" aria-hidden />
          Reference: {entry.referenceName}
          {entry.referenceTitle ? `, ${entry.referenceTitle}` : ""}
        </div>
      )}
      {entry.cpars && <div className="pp-card-cpars">CPARS: {entry.cpars}</div>}

      {isNeedsReview && editMode && (
        <div className="pp-needs-review-actions">
          <button
            type="button"
            className="pp-btn-primary pp-btn-sm"
            onClick={() => actions.onConfirm?.(entry.id)}
          >
            Confirm this
          </button>
          <button
            type="button"
            className="pp-btn-secondary pp-btn-sm"
            onClick={() => actions.onEdit?.(entry.id)}
          >
            Edit details
          </button>
          <button
            type="button"
            className="pp-btn-tertiary pp-btn-sm"
            onClick={() => actions.onNotReal?.(entry.id)}
          >
            This isn't a real project
          </button>
        </div>
      )}
    </article>
  );
}
