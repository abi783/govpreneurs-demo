import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Check, Pencil, X } from "lucide-react";
import type { CurrentMember } from "../../lib/mock/currentMember";
import type { KnowledgeSource } from "../../lib/knowledgeBase";

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

function pickFacts(m: CurrentMember, knowledge: KnowledgeSource[]): SourceFact[] {
  const hasPastProjects = knowledge.some((f) => f.name.toLowerCase().includes("past projects"));
  const hasInsurance = knowledge.some((f) => f.name.toLowerCase().includes("insurance"));
  const hasLicense = knowledge.some((f) => f.name.toLowerCase().includes("nc gc license"));
  return [
    {
      key: "company",
      label: "Company",
      value: `${m.businessName} · ${m.hqCity}, ${m.hqState}`,
      source: "Profile · Identity",
      editable: true,
    },
    {
      key: "uei_cage",
      label: "UEI / CAGE",
      value: m.uei && m.cage ? `${m.uei} · ${m.cage}` : null,
      source: "SAM.gov",
      missingTab: "identity",
    },
    {
      key: "naics",
      label: "Primary NAICS",
      value: `${m.primaryNaics} — ${m.naicsDescription}`,
      source: "SAM.gov",
    },
    {
      key: "past_performance",
      label: "Past performance",
      value: hasPastProjects
        ? `${m.pastPerformanceCount} commercial roofing projects · up to $890K`
        : `${m.pastPerformanceCount} projects in your profile`,
      source: hasPastProjects
        ? "Williams Construction — Past Projects.docx"
        : "Profile · Past Performance",
      editable: true,
    },
    {
      key: "bonding",
      label: "Bonding capacity",
      value: hasInsurance ? "Up to ~$890K per contract" : null,
      source: hasInsurance ? "Insurance & Bonding.pdf" : "Add to knowledge base",
      editable: hasInsurance,
    },
    {
      key: "certifications",
      label: "Certifications",
      value:
        [
          m.samBusinessTypes.includes("sdvosb_eligible") ? "SDVOSB-eligible" : null,
          hasLicense ? "NC GC license (active)" : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      source: hasLicense ? "NC GC License.pdf · Profile" : "Profile · Certifications",
      editable: true,
    },
    {
      key: "differentiators",
      label: "Differentiators",
      value:
        "Fort Bragg-area focus · 15+ yrs commercial roofing · 300-mile mobilization radius",
      source: "Profile · Capabilities",
      editable: true,
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
  member: CurrentMember;
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
