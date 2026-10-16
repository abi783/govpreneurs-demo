import { useState } from "react";
import { X, Plus } from "lucide-react";
import { ChipPopover } from "./ChipPopover";
import {
  MultiSelectEditor,
  SingleSelectEditor,
  GenericTextEditor,
  WORK_TYPE_OPTIONS,
  REGION_OPTIONS,
  MATCH_TIER_OPTIONS,
  VALUE_OPTIONS,
  summarizeMulti,
} from "./ChipEditors";

export interface ModeFilter {
  prime: boolean;
  partner: boolean;
}
export interface ScopeFilter {
  fed: boolean;
  sled: boolean;
}

export interface ActiveFilters {
  workType: string;
  region: string;
  maxValueLabel: string;
  openToNew: boolean;
  modeFilter: ModeFilter;
  scopeFilter: ScopeFilter;
  competition?: string;
  eligibility?: string;
  matchTier?: string;
  setAside?: string;
  timing?: string;
  pastPerformance?: string;
  bonding?: string;
  clearance?: string;
  solicitationType?: string;
  postedRecently?: string;
}

function modeChipLabel(m: ModeFilter): string {
  if (m.prime && m.partner) return "All types";
  if (m.prime) return "Prime only";
  if (m.partner) return "Partner only";
  return "No types";
}

function scopeChipLabel(s: ScopeFilter): string {
  if (s.fed && s.sled) return "All sources";
  if (s.fed) return "Fed only";
  if (s.sled) return "SLED only";
  return "No sources";
}

type ChipKey = keyof ActiveFilters;

const DIMENSIONS: Array<{ key: ChipKey; label: string }> = [
  { key: "workType", label: "Work type" },
  { key: "region", label: "Where" },
  { key: "maxValueLabel", label: "Contract size" },
  { key: "setAside", label: "Set-asides" },
  { key: "timing", label: "Timing" },
  { key: "pastPerformance", label: "Past performance required" },
  { key: "bonding", label: "Bonding requirement" },
  { key: "clearance", label: "Security clearance" },
  { key: "solicitationType", label: "Solicitation type" },
  { key: "postedRecently", label: "Posted recently" },
  { key: "matchTier", label: "Match strength" },
];

function chipLabel(key: ChipKey, filters: ActiveFilters): string {
  switch (key) {
    case "workType": {
      const parts = filters.workType.split(", ").filter(Boolean);
      if (filters.workType === "All work types") return "All work";
      return parts.length > 1 ? summarizeMulti(parts) : filters.workType;
    }
    case "region":
      return filters.region;
    case "maxValueLabel":
      return filters.maxValueLabel === "Any size" ? "Any size" : filters.maxValueLabel;
    case "openToNew":
      return "Open to new bidders";
    case "matchTier": {
      const parts = (filters.matchTier ?? "").split(", ").filter(Boolean);
      return parts.length > 1
        ? `${parts[0].replace(/ matches$/, "")} + ${parts[1].replace(/ matches$/, "")} matches`
        : (filters.matchTier ?? "");
    }
    default:
      return (filters[key] as string | undefined) ?? "";
  }
}

function ChipEditorBody({
  dimension,
  filters,
  draftRef,
}: {
  dimension: ChipKey;
  filters: ActiveFilters;
  draftRef: { current: string };
}) {
  const setDraft = (v: string) => {
    draftRef.current = v;
  };
  switch (dimension) {
    case "workType":
      return (
        <MultiSelectEditor
          options={WORK_TYPE_OPTIONS}
          initial={filters.workType}
          onChange={setDraft}
        />
      );
    case "region":
      return (
        <SingleSelectEditor
          name="region"
          options={REGION_OPTIONS}
          initial={filters.region}
          onChange={setDraft}
        />
      );
    case "maxValueLabel":
      return (
        <SingleSelectEditor
          name="size"
          options={VALUE_OPTIONS}
          initial={filters.maxValueLabel}
          onChange={setDraft}
        />
      );
    case "matchTier":
      return (
        <MultiSelectEditor
          options={MATCH_TIER_OPTIONS}
          initial={filters.matchTier ?? ""}
          onChange={setDraft}
        />
      );
    default:
      return (
        <GenericTextEditor
          initial={(filters[dimension] as string | undefined) ?? ""}
          onChange={setDraft}
          placeholder="Type a value…"
        />
      );
  }
}

function defaultDraftFor(dim: ChipKey, filters: ActiveFilters): string {
  switch (dim) {
    case "workType":
      return filters.workType;
    case "region":
      return filters.region;
    case "maxValueLabel":
      return filters.maxValueLabel;
    case "matchTier":
      return filters.matchTier ?? "";
    default:
      return (filters[dim] as string | undefined) ?? "";
  }
}

export function RefinementChips({
  filters,
  onRemove,
  onApplyChip,
  onModeFilterChange,
  onScopeFilterChange,
  onEditQuery,
  parsedQuery,
  onOpenAdvanced,
}: {
  filters: ActiveFilters;
  onRemove: (key: ChipKey) => void;
  onApplyChip: (key: ChipKey, value: string) => void;
  onModeFilterChange: (next: ModeFilter) => void;
  onScopeFilterChange: (next: ScopeFilter) => void;
  onEditQuery: () => void;
  parsedQuery?: string | null;
  onOpenAdvanced?: () => void;
}) {
  const [openChip, setOpenChip] = useState<ChipKey | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<"list" | "edit">("list");
  const [addDim, setAddDim] = useState<ChipKey | null>(null);

  const chipKeys: ChipKey[] = ["workType", "region", "maxValueLabel"];
  const chips = chipKeys.map((k) => ({ key: k, label: chipLabel(k, filters) }));
  if (filters.openToNew) chips.push({ key: "openToNew", label: chipLabel("openToNew", filters) });
  (
    [
      "competition",
      "eligibility",
      "matchTier",
      "setAside",
      "timing",
      "pastPerformance",
      "bonding",
      "clearance",
      "solicitationType",
      "postedRecently",
    ] as ChipKey[]
  ).forEach((k) => {
    const v = filters[k];
    if (typeof v === "string" && v) chips.push({ key: k, label: chipLabel(k, filters) });
  });

  return (
    <div>
      <div className="chip-row">
        {chips.map((c) => {
          const isOpen = openChip === c.key;
          const draftRef = { current: defaultDraftFor(c.key, filters) };
          return (
            <span key={c.key} className="chip-anchor">
              <button
                type="button"
                className="chip-filter"
                onClick={() => setOpenChip(isOpen ? null : c.key)}
              >
                <span>{c.label}</span>
                {c.key !== "openToNew" || filters.openToNew ? (
                  <span
                    className="x"
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${c.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenChip(null);
                      onRemove(c.key);
                    }}
                  >
                    <X />
                  </span>
                ) : null}
              </button>
              {isOpen && c.key !== "openToNew" && (
                <ChipPopover
                  open
                  onClose={() => setOpenChip(null)}
                  onApply={() => {
                    onApplyChip(c.key, draftRef.current);
                    setOpenChip(null);
                  }}
                >
                  <ChipEditorBody dimension={c.key} filters={filters} draftRef={draftRef} />
                </ChipPopover>
              )}
            </span>
          );
        })}

        {/* Mode compound chip */}
        <span className="chip-anchor">
          <button
            type="button"
            className="chip-filter"
            onClick={() => {
              setModeOpen((o) => !o);
              setScopeOpen(false);
            }}
          >
            <span>{modeChipLabel(filters.modeFilter)}</span>
            <span
              className="x"
              role="button"
              tabIndex={-1}
              aria-label="Reset Prime/Partner"
              onClick={(e) => {
                e.stopPropagation();
                setModeOpen(false);
                onModeFilterChange({ prime: true, partner: true });
              }}
            >
              <X />
            </span>
          </button>
          {modeOpen && (
            <ChipPopover open onClose={() => setModeOpen(false)} hideFooter>
              <div className="chip-pop-list">
                {(["prime", "partner"] as const).map((k) => (
                  <label key={k} className="chip-pop-row">
                    <input
                      type="checkbox"
                      checked={filters.modeFilter[k]}
                      onChange={() =>
                        onModeFilterChange({ ...filters.modeFilter, [k]: !filters.modeFilter[k] })
                      }
                    />
                    <span style={{ textTransform: "capitalize" }}>{k}</span>
                  </label>
                ))}
              </div>
            </ChipPopover>
          )}
        </span>

        {/* Scope compound chip */}
        <span className="chip-anchor">
          <button
            type="button"
            className="chip-filter"
            onClick={() => {
              setScopeOpen((o) => !o);
              setModeOpen(false);
            }}
          >
            <span>{scopeChipLabel(filters.scopeFilter)}</span>
            <span
              className="x"
              role="button"
              tabIndex={-1}
              aria-label="Reset Fed/SLED"
              onClick={(e) => {
                e.stopPropagation();
                setScopeOpen(false);
                onScopeFilterChange({ fed: true, sled: true });
              }}
            >
              <X />
            </span>
          </button>
          {scopeOpen && (
            <ChipPopover open onClose={() => setScopeOpen(false)} hideFooter>
              <div className="chip-pop-list">
                {(["fed", "sled"] as const).map((k) => (
                  <label key={k} className="chip-pop-row">
                    <input
                      type="checkbox"
                      checked={filters.scopeFilter[k]}
                      onChange={() =>
                        onScopeFilterChange({
                          ...filters.scopeFilter,
                          [k]: !filters.scopeFilter[k],
                        })
                      }
                    />
                    <span>{k === "fed" ? "Fed" : "SLED"}</span>
                  </label>
                ))}
              </div>
            </ChipPopover>
          )}
        </span>

        <span className="chip-anchor">
          <button
            type="button"
            className="chip-add"
            onClick={() => {
              setAddOpen((o) => !o);
              setAddStep("list");
              setAddDim(null);
            }}
          >
            <Plus style={{ width: 12, height: 12, strokeWidth: 2 }} />
            Add filter
          </button>
          {addOpen && addStep === "list" && (
            <ChipPopover open onClose={() => setAddOpen(false)} hideFooter>
              <div className="chip-pop-list">
                {DIMENSIONS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className="chip-pop-pickrow"
                    onClick={() => {
                      setAddDim(d.key);
                      setAddStep("edit");
                    }}
                  >
                    {d.label}
                  </button>
                ))}
                {onOpenAdvanced && (
                  <button
                    type="button"
                    className="chip-pop-pickrow chip-pop-pickrow--advanced"
                    onClick={() => {
                      setAddOpen(false);
                      onOpenAdvanced();
                    }}
                  >
                    Advanced filters…
                  </button>
                )}
              </div>
            </ChipPopover>
          )}
          {addOpen && addStep === "edit" && addDim && (
            <AddFilterEditor
              dimension={addDim}
              onCancel={() => {
                setAddStep("list");
                setAddDim(null);
              }}
              onApply={(value) => {
                onApplyChip(addDim, value);
                setAddOpen(false);
              }}
            />
          )}
        </span>
        {parsedQuery && (
          <button type="button" className="chip-inline-link" onClick={onEditQuery}>
            · Edit query
          </button>
        )}
      </div>
    </div>
  );
}

function AddFilterEditor({
  dimension,
  onCancel,
  onApply,
}: {
  dimension: ChipKey;
  onCancel: () => void;
  onApply: (value: string) => void;
}) {
  const draftRef = { current: "" };
  const empty: ActiveFilters = {
    workType: "",
    region: "",
    maxValueLabel: "",
    openToNew: false,
    modeFilter: { prime: true, partner: true },
    scopeFilter: { fed: true, sled: true },
  };
  return (
    <ChipPopover
      open
      onClose={onCancel}
      onApply={() => {
        if (draftRef.current.trim()) onApply(draftRef.current);
        else onCancel();
      }}
    >
      <ChipEditorBody dimension={dimension} filters={empty} draftRef={draftRef} />
    </ChipPopover>
  );
}
