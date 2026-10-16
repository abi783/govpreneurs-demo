import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import {
  PastPerformanceCard,
  type PastPerformanceEntry as CardEntry,
} from "../PastPerformanceCard";
import { PastPerformanceModal } from "../PastPerformanceModal";
import {
  businessProfile,
  type PastPerformanceEntry as MockEntry,
} from "../../../lib/mock/businessProfile";

function formatPeriod(iso: string): string {
  // "2024-03-15" → "Mar 2024"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function customerTypeLabel(t: MockEntry["customerType"]): string {
  switch (t) {
    case "federal_prime":
      return "Federal Prime";
    case "federal_sub":
      return "Federal Sub";
    case "state":
      return "State government";
    case "local":
      return "Local government";
    case "commercial":
      return "Commercial";
  }
}

function toCardEntry(e: MockEntry): CardEntry {
  return {
    id: e.id,
    title: e.projectTitle,
    customer: e.customerName,
    customerType: customerTypeLabel(e.customerType),
    contractType: e.contractType,
    periodStart: formatPeriod(e.periodStart),
    periodEnd: formatPeriod(e.periodEnd),
    value: e.totalValue,
    naics: e.naicsCode,
    scope: e.scopeDescription,
    referenceName: e.referencePOCName,
    referenceTitle: e.referencePOCTitle,
    status: e.state === "needs_review" ? "needs_review" : "attested",
  };
}

function formatTotal(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

export function PastPerformanceTab() {
  const [addOpen, setAddOpen] = useState(false);
  const pp = businessProfile.pastPerformance;
  const entries = pp.entries.map(toCardEntry);

  // Counts derived from the canonical mock so summary line stays in sync.
  const localCount = pp.entries.filter(
    (e) => e.customerType === "local" || e.customerType === "state",
  ).length;

  return (
    <div className="pp-tab">
      <header className="pp-tab-header">
        <h2 className="pp-tab-title">Past Performance</h2>
        <div className="pp-tab-actions">
          <button
            type="button"
            className="pp-btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} aria-hidden /> Add a project
          </button>
          <button
            type="button"
            className="pp-btn-secondary"
            onClick={() => console.log("Bulk import clicked")}
          >
            <Upload size={16} aria-hidden /> Bulk import
          </button>
        </div>
      </header>
      <div className="pp-summary">
        {entries.length} entries · Total {formatTotal(pp.totalValue)} ·{" "}
        {pp.federalCount} federal, {localCount} local, {pp.commercialCount}{" "}
        commercial
      </div>

      <div className="pp-list">
        {entries.map((e) => (
          <PastPerformanceCard key={e.id} entry={e} />
        ))}
      </div>

      <PastPerformanceModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
