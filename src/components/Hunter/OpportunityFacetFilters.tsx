// The Set-aside, Agency, Notice type and Contract vehicle categories of the
// Opportunities Filters window. Each one is its own category in the window, so
// each shows only when she opens it.

import { useMemo } from "react";
import {
  computeAvailableFacets,
  prefilledValues,
  setValues,
  type MultiFacet,
  type OpportunityFilters,
} from "../../lib/opportunityFilters";
import type { CardOpportunity } from "../../lib/mock/opportunities";
import { NOTICE_TYPES, SET_ASIDES, VEHICLES } from "../../lib/vocab/filterOptions";
import { OPTION_GLOSS } from "../../lib/filterGlosses";
import { SearchableMultiSelect, type MSOption } from "./SearchableMultiSelect";

type FilterProps = {
  filters: OpportunityFilters;
  onChange: (next: OpportunityFilters) => void;
};

type OppsProps = FilterProps & {
  /** The loaded opportunities. Their values fill the Agency and Notice type lists. */
  opps: CardOpportunity[];
};

const setMulti = (f: OpportunityFilters, facet: MultiFacet, values: string[]) =>
  setValues(f, facet, values);

// ── Set-aside ────────────────────────────────────────────────────────────────
//
// The member's own set-asides sit under "You qualify", the rest under "Other
// set-asides". The question goes to the Hunter dock over the same
// `commandbar:ask-hunter` event the command bar uses; the window computes no
// eligibility answer of its own.

const QUALIFY_GROUP = "You qualify";
const OTHER_GROUP = "Other set-asides";
const QUALIFY_QUESTION = "Do I qualify for these set-asides?";

/** Opens the Hunter dock with the eligibility question. Hunter answers it. */
function askHunterAboutQualifying() {
  window.dispatchEvent(
    new CustomEvent("commandbar:ask-hunter", { detail: { text: QUALIFY_QUESTION } }),
  );
}

// The badge states where we read the code, and nothing about who checked it.
// `GET /opportunities/filters/defaults` returns `setAsides: string[]` with no
// provenance field, so the client cannot tell a self-certified code from one
// SAM's `cert_flag` confirms. Do not synthesise, infer or default it.
function QualifyBadge() {
  return (
    <span className="of-qual">
      {QUALIFY_GROUP}
      <span className="of-qual__source"> · from your profile</span>
    </span>
  );
}

/** The Set-aside category, with the member's own set-asides first. */
export function SetAsideFilter({ filters, onChange }: FilterProps) {
  // The member's own set-asides come from the profile defaults the route has
  // already fetched — read here, never fetched again. With none on file the
  // list stays flat: an empty "You qualify" heading would answer a question we
  // have no data for.
  const qualifying = new Set(
    prefilledValues(filters, "setAsides").filter((id) => SET_ASIDES.some((s) => s.id === id)),
  );
  const showQualifying = qualifying.size > 0;
  const options: MSOption[] = [...SET_ASIDES]
    .sort((a, b) => Number(qualifying.has(b.id)) - Number(qualifying.has(a.id)))
    .map((s) => ({
      id: s.id,
      label: s.label,
      gloss: OPTION_GLOSS[`setAsides:${s.id}`],
      group: showQualifying ? (qualifying.has(s.id) ? QUALIFY_GROUP : OTHER_GROUP) : undefined,
      // The badge carries the "from your profile" claim, so the plain tag would
      // repeat it.
      badge: qualifying.has(s.id) ? <QualifyBadge /> : undefined,
      prefilled: false,
    }));
  return (
    <div className="fd-control">
      <SearchableMultiSelect
        options={options}
        selected={filters.setAsides}
        onChange={(v) => onChange(setMulti(filters, "setAsides", v))}
        groupCheckAll={showQualifying ? [QUALIFY_GROUP, OTHER_GROUP] : undefined}
        searchable
        placeholder="Search set-asides"
      />
      <button type="button" className="of-qual-ask" onClick={askHunterAboutQualifying}>
        Ask Hunter: do I qualify?
      </button>
    </div>
  );
}

// ── Agency ───────────────────────────────────────────────────────────────────

/**
 * The Agency category. The options are the agency names in the loaded
 * opportunities, A–Z, because the server matches the agency name exactly. An
 * agency she picked stays in the list after the results change.
 */
export function AgencyFilter({ filters, onChange, opps }: OppsProps) {
  const options = useMemo<MSOption[]>(() => {
    const names = new Set(computeAvailableFacets(opps).agencies);
    filters.agencies.forEach((name) => names.add(name));
    return [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ id: name, label: name }));
  }, [opps, filters.agencies]);
  return (
    <div className="fd-control">
      <SearchableMultiSelect
        options={options}
        selected={filters.agencies}
        onChange={(v) => onChange(setMulti(filters, "agencies", v))}
        searchable
        placeholder="Search agencies"
      />
    </div>
  );
}

// ── Notice type ──────────────────────────────────────────────────────────────

/**
 * The Notice type category. It lists the notice types in the loaded
 * opportunities, so no option matches nothing. A type she picked stays listed.
 */
export function NoticeTypeFilter({ filters, onChange, opps }: OppsProps) {
  const options = useMemo<MSOption[]>(() => {
    const present = computeAvailableFacets(opps).noticeTypes;
    return NOTICE_TYPES.filter((n) => present.has(n.id) || filters.noticeTypes.includes(n.id)).map(
      (n) => ({ id: n.id, label: n.label, gloss: OPTION_GLOSS[`noticeTypes:${n.id}`] }),
    );
  }, [opps, filters.noticeTypes]);
  return (
    <div className="fd-control">
      <SearchableMultiSelect
        options={options}
        selected={filters.noticeTypes}
        onChange={(v) => onChange(setMulti(filters, "noticeTypes", v))}
        searchable
        placeholder="Search notice types"
      />
    </div>
  );
}

// ── Contract vehicle ─────────────────────────────────────────────────────────

/** The Contract vehicle category. */
export function VehicleFilter({ filters, onChange }: FilterProps) {
  const options: MSOption[] = VEHICLES.map((v) => ({
    id: v.id,
    label: v.label,
    gloss: OPTION_GLOSS[`vehicles:${v.id}`],
  }));
  return (
    <div className="fd-control">
      <SearchableMultiSelect
        options={options}
        selected={filters.vehicles}
        onChange={(v) => onChange(setMulti(filters, "vehicles", v))}
        searchable
        placeholder="Search contract vehicles"
      />
    </div>
  );
}
