import { useState } from "react";
import { Check, Edit2, Sparkles, X } from "lucide-react";

export type PpStatus = "attested" | "needs_review";

export interface PastPerformanceEntry {
  id: string;
  title: string;
  customer: string;
  customerType: string;
  contractType: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  naics: string;
  scope: string;
  referenceName?: string;
  referenceTitle?: string;
  cpars?: string;
  status: PpStatus;
}

const log = (action: string, id: string) =>
  console.log("PastPerformance action:", action, id);

function formatValue(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function PastPerformanceCard({ entry }: { entry: PastPerformanceEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isNeedsReview = entry.status === "needs_review";

  return (
    <article className="pp-card" data-needs-review={isNeedsReview ? "true" : "false"}>
      {isNeedsReview && (
        <div className="pp-extracted-banner">
          <Sparkles size={12} aria-hidden />
          <span>Extracted from your capability statement draft — review and confirm?</span>
        </div>
      )}

      <header className="pp-card-header">
        <h3 className="pp-card-title">{entry.title}</h3>
        {!isNeedsReview && (
          <div className="pp-card-icons">
            <button
              type="button"
              className="pp-card-icon-btn"
              aria-label="Edit project"
              onClick={() => log("edit", entry.id)}
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="pp-card-icon-btn"
              aria-label="Delete project"
              onClick={() => log("delete", entry.id)}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </header>

      <div className="pp-card-sub">
        {entry.customer} · {entry.customerType} · {entry.contractType}
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

      {isNeedsReview && (
        <div className="pp-needs-review-actions">
          <button
            type="button"
            className="pp-btn-primary pp-btn-sm"
            onClick={() => log("confirm", entry.id)}
          >
            Confirm this
          </button>
          <button
            type="button"
            className="pp-btn-secondary pp-btn-sm"
            onClick={() => log("edit-details", entry.id)}
          >
            Edit details
          </button>
          <button
            type="button"
            className="pp-btn-tertiary pp-btn-sm"
            onClick={() => log("not-a-real-project", entry.id)}
          >
            This isn't a real project
          </button>
        </div>
      )}
    </article>
  );
}
