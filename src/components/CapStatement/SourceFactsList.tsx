import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Check, Pencil, X } from "lucide-react";
import type { CapFacts } from "../../lib/capStatementBuilder";
import type { KnowledgeSource } from "../../lib/knowledgeBase";
import { fmtMoneyShort, fmtUsd } from "../../demo/profile/dates";

export type FactKey =
  | "company"
  | "uei_cage"
  | "naics"
  | "past_performance"
  | "bonding"
  | "certifications"
  | "differentiators"
  | "target_work";

interface SourceFact {
  key: FactKey;
  label: string;
  value: string | null;
  source: string;
  missingTab?: string;
  editable?: boolean;
}

// DEMO: every fact comes from the profile (the story plus the visitor's changes).
function pickFacts(m: CapFacts, knowledge: KnowledgeSource[]): SourceFact[] {
  const samFile = knowledge.find((f) => f.name.toLowerCase().includes("sam.gov registration"));
  const jobs = m.pastPerformance;
  const biggest = jobs.reduce((n, e) => Math.max(n, e.value), 0);
  return [
    {
      key: "company",
      label: "Company",
      value: `${m.businessName} · ${m.city}, ${m.state}`,
      source: "Profile · Identity",
      editable: true,
    },
    {
      key: "uei_cage",
      label: "UEI / CAGE",
      value: m.uei && m.cage ? `${m.uei} · ${m.cage}` : null,
      source: samFile ? samFile.name : "SAM.gov",
      missingTab: "identity",
    },
    {
      key: "naics",
      label: "Primary NAICS",
      value: `${m.primaryNaics} — ${m.primaryNaicsLabel}`,
      source: "SAM.gov",
    },
    {
      key: "past_performance",
      label: "Past performance",
      value: jobs.length ? `${jobs.length} jobs in your profile · up to ${fmtMoneyShort(biggest)}` : null,
      source: "Profile · Past Performance",
      missingTab: "past-performance",
      editable: jobs.length > 0,
    },
    {
      key: "bonding",
      label: "Bonding",
      value: `Largest bond carried: ${fmtUsd(m.largestBond)}`,
      source: "Profile · Bidder Profile",
      editable: true,
    },
    {
      key: "certifications",
      label: "Certifications",
      value:
        [...m.certifications, `${m.foodHandlers} of ${m.employees} staff food-handler certified`].join(" · ") || null,
      source: "Profile · Certifications",
      editable: true,
    },
    {
      key: "differentiators",
      label: "Differentiators",
      value: m.differentiators.join(" · ") || null,
      source: "Profile · Capabilities",
      missingTab: "capabilities",
      editable: m.differentiators.length > 0,
    },
    {
      key: "target_work",
      label: "Target work",
      value: m.targetAgencies.length ? m.targetAgencies.join(", ") : null,
      source: "Profile · Positioning",
      missingTab: "positioning",
      editable: m.targetAgencies.length > 0,
    },
  ];
}

export type FactOverrides = Partial<Record<FactKey, string>>;

export function SourceFactsList({
  member,
  knowledge,
  overrides,
  onOverrideChange,
  confirmed,
  onConfirmedChange,
}: {
  member: CapFacts;
  knowledge: KnowledgeSource[];
  overrides: FactOverrides;
  onOverrideChange: (key: FactKey, value: string | null) => void;
  confirmed: Set<FactKey>;
  onConfirmedChange: (key: FactKey, next: boolean) => void;
}) {
  const facts = pickFacts(member, knowledge);
  const [editingKey, setEditingKey] = useState<FactKey | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (f: SourceFact) => {
    setEditingKey(f.key);
    setDraft(overrides[f.key] ?? f.value ?? "");
  };
  const cancelEdit = () => {
    setEditingKey(null);
    setDraft("");
  };
  const saveEdit = (key: FactKey) => {
    onOverrideChange(key, draft.trim() || null);
    onConfirmedChange(key, true);
    setEditingKey(null);
    setDraft("");
  };

  return (
    <ul className="cs-facts">
      {facts.map((f) => {
        const isEditing = editingKey === f.key;
        const displayValue = overrides[f.key] ?? f.value;
        const isConfirmed = confirmed.has(f.key);
        const isEdited = overrides[f.key] !== undefined;
        return (
          <li
            key={f.key}
            className={`cs-fact${displayValue ? "" : " is-missing"}${isConfirmed ? " is-confirmed" : ""}`}
          >
            <div className="cs-fact-head">
              {displayValue ? (
                <Check size={12} className="cs-fact-check" />
              ) : (
                <AlertCircle size={12} className="cs-fact-warn" />
              )}
              <span className="cs-fact-label">{f.label}</span>
              {isEdited && <span className="cs-fact-edited">edited</span>}
            </div>

            {displayValue && !isEditing && (
              <>
                <div className="cs-fact-value">{displayValue}</div>
                <div className="cs-fact-src-row">
                  <div className="cs-fact-src">{f.source}</div>
                  <div className="cs-fact-actions">
                    {f.editable && (
                      <button
                        type="button"
                        className="cs-fact-btn"
                        onClick={() => startEdit(f)}
                      >
                        <Pencil size={11} /> Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className={`cs-fact-confirm${isConfirmed ? " is-on" : ""}`}
                      onClick={() => onConfirmedChange(f.key, !isConfirmed)}
                      aria-pressed={isConfirmed}
                    >
                      <Check size={11} strokeWidth={3} />
                      {isConfirmed ? "Confirmed" : "Confirm"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {isEditing && (
              <div className="cs-fact-edit">
                <textarea
                  className="cs-fact-edit-ta"
                  value={draft}
                  rows={Math.max(2, draft.split("\n").length)}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label={`Edit ${f.label}`}
                  autoFocus
                />
                <div className="cs-fact-edit-actions">
                  <button type="button" className="cs-fact-btn" onClick={cancelEdit}>
                    <X size={11} /> Cancel
                  </button>
                  <button
                    type="button"
                    className="cs-fact-btn cs-fact-btn--primary"
                    onClick={() => saveEdit(f.key)}
                  >
                    <Check size={11} strokeWidth={3} /> Save
                  </button>
                </div>
              </div>
            )}

            {!displayValue && (
              <div className="cs-fact-missing">
                Not in your profile yet — Ava will leave this section out unless you{" "}
                {f.missingTab ? (
                  <Link
                    to="/business-profile"
                    search={{ tab: f.missingTab as never }}
                    className="cs-fact-link"
                  >
                    add it here
                  </Link>
                ) : (
                  <Link
                    to="/business-profile"
                    search={{ tab: "knowledge" as never }}
                    className="cs-fact-link"
                  >
                    add it to your knowledge
                  </Link>
                )}
                .
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
