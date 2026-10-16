import { useMemo } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import {
  type OpportunityFilters,
  type MultiFacet,
  setValues,
  computeAvailableFacets,
  prefilledValues,
} from "../../lib/opportunityFilters";
import type { CardOpportunity } from "../../lib/mock/opportunities";
import { DUE_WINDOWS, NOTICE_TYPES, SET_ASIDES, VEHICLES } from "../../lib/vocab/filterOptions";
import { FACET_GLOSS, OPTION_GLOSS } from "../../lib/filterGlosses";
import { JargonGloss } from "./JargonGloss";
import { PscFacet } from "./PscFacet";
import { SearchableMultiSelect, type MSOption } from "./SearchableMultiSelect";
import { SegmentedControl } from "./SegmentedControl";

// Temporarily hidden — kept in code for later re-enable.
const SHOW_PSC = false;
const SHOW_SMART_TOGGLES = false;

function setMulti(f: OpportunityFilters, facet: MultiFacet, values: string[]): OpportunityFilters {
  return setValues(f, facet, values);
}

// Set-aside eligibility grouping.
//
// The two headings, and the question Hunter is asked. The question goes to the
// dock over the same `commandbar:ask-hunter` event the command bar uses; the
// panel computes no eligibility answer of its own.
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
// SAM's `cert_flag` confirms — and that flag is what decides whether a
// set-aside bid is responsive. Flattening the two would be a claim we cannot
// support.
//
// MISSING BACKEND FIELD: per-set-aside provenance (`self_certified` |
// `certified`) on `GET /opportunities/filters/defaults`. Until it exists, do
// not synthesise it, infer it or default it.
function QualifyBadge() {
  return (
    <span className="of-qual">
      {QUALIFY_GROUP}
      <span className="of-qual__source"> · from your profile</span>
    </span>
  );
}

function SectionHead({ facet }: { facet: keyof typeof FACET_GLOSS }) {
  const { label, gloss } = FACET_GLOSS[facet];
  return (
    <span className="of-section-head">
      {label}
      <JargonGloss gloss={gloss} />
    </span>
  );
}

export function AdvancedFiltersPanel({
  filters,
  onChange,
  opps,
}: {
  filters: OpportunityFilters;
  onChange: (next: OpportunityFilters) => void;
  /** Currently loaded opportunities — facet options are scoped to what's actually present. */
  opps: CardOpportunity[];
}) {
  const available = useMemo(() => computeAvailableFacets(opps), [opps]);

  // NAICS selection now lives in WorkPicker ("What you do" section) — it owns
  // filters.naics via the trade→code resolution (see
  // opportunityFilters.resolveNaicsSelection). No standalone NAICS control
  // here anymore.
  // Set-asides are a fixed catalog of program types — always show the full
  // static list. Server-side filtering matches the whole corpus, so gating the
  // chips to the loaded rows (via the client regex) would wrongly hide types
  // whose HigherGov codes the regex doesn't recognise (e.g. HZC, SBA).
  // The member's own set-asides come from the profile defaults the route has
  // already fetched — read here, never fetched again. With none on file the
  // list stays flat: an empty "You qualify" heading would answer a question we
  // have no data for.
  const qualifying = new Set(
    prefilledValues(filters, "setAsides").filter((id) => SET_ASIDES.some((s) => s.id === id)),
  );
  const showQualifying = qualifying.size > 0;
  const setAsideOpts: MSOption[] = [...SET_ASIDES]
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
  const noticeOpts: MSOption[] = NOTICE_TYPES.filter((n) => available.noticeTypes.has(n.id)).map(
    (n) => ({
      id: n.id,
      label: n.label,
      gloss: OPTION_GLOSS[`noticeTypes:${n.id}`],
    }),
  );
  const vehicleOpts: MSOption[] = VEHICLES.map((v) => ({
    id: v.id,
    label: v.label,
    gloss: OPTION_GLOSS[`vehicles:${v.id}`],
  }));
  const agencyOpts: MSOption[] = useMemo(
    () =>
      [...available.agencies]
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ id: name, label: name })),
    [available.agencies],
  );

  return (
    <Accordion.Root
      type="multiple"
      defaultValue={["setAsides", "agencies", "noticeTypes"]}
      className="of-accordion"
    >
      <FacetSection value="setAsides" head={<SectionHead facet="setAsides" />}>
        <SearchableMultiSelect
          options={setAsideOpts}
          selected={filters.setAsides}
          onChange={(v) => onChange(setMulti(filters, "setAsides", v))}
          groupCheckAll={showQualifying ? [QUALIFY_GROUP, OTHER_GROUP] : undefined}
        />
        <button type="button" className="of-qual-ask" onClick={askHunterAboutQualifying}>
          Ask Hunter: do I qualify?
        </button>
      </FacetSection>

      <FacetSection value="agencies" head={<SectionHead facet="agencies" />}>
        <SearchableMultiSelect
          options={agencyOpts}
          selected={filters.agencies}
          onChange={(v) => onChange(setMulti(filters, "agencies", v))}
          placeholder="Search agency"
        />
      </FacetSection>

      <FacetSection value="noticeTypes" head={<SectionHead facet="noticeTypes" />}>
        <SearchableMultiSelect
          options={noticeOpts}
          selected={filters.noticeTypes}
          onChange={(v) => onChange(setMulti(filters, "noticeTypes", v))}
        />
      </FacetSection>

      <div className="of-accordion__more">
        <span>More filters</span>
      </div>

      {SHOW_PSC && (
        <FacetSection value="psc" head={<SectionHead facet="psc" />}>
          <PscFacet
            selected={filters.psc}
            onChange={(v) => onChange(setMulti(filters, "psc", v))}
          />
        </FacetSection>
      )}

      {/* "Place of performance" (ZIP) section removed — location filtering
          lives in the Where section (LocationPicker: state + city). */}

      <FacetSection value="vehicles" head={<SectionHead facet="vehicles" />}>
        <SearchableMultiSelect
          options={vehicleOpts}
          selected={filters.vehicles}
          onChange={(v) => onChange(setMulti(filters, "vehicles", v))}
        />
      </FacetSection>

      <FacetSection value="status" head={<SectionHead facet="status" />}>
        {/* Client-model-only for now — filters.status is not yet emitted by
            toServerFilters/ServerFilters (confirmed in
            opportunityFilters.serverfilters.test.ts's "does not emit ...
            status" case), so selecting a non-default option here does not
            change what the server returns. */}
        {/* TODO: wire filters.status into toServerFilters/ServerFilters once
            the backend accepts a status filter, so this control actually
            changes what's fetched rather than only the client-side model. */}
        <SegmentedControl
          ariaLabel="Status"
          value={filters.status}
          onChange={(id) => onChange({ ...filters, status: id as OpportunityFilters["status"] })}
          options={[
            { value: "active", label: "Active only" },
            { value: "include_expiring", label: "Include expiring" },
            { value: "all", label: "Include all" },
          ]}
        />
      </FacetSection>

      {SHOW_SMART_TOGGLES && (
        <FacetSection value="toggles" head={<SectionHead facet="toggles" />}>
          <div className="of-checkbox-list">
            {(
              [
                ["excludeNoBid", 'Exclude items I marked "No bid"'],
                ["favoritesOnly", "Only show favorites"],
                ["civilianOnly", "Only civilian agencies"],
                ["dodOnly", "Only DoD agencies"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="of-check">
                <input
                  type="checkbox"
                  checked={filters.toggles[key]}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      toggles: { ...filters.toggles, [key]: e.target.checked },
                    })
                  }
                />
                <span>
                  {label} <JargonGloss gloss={OPTION_GLOSS[`toggles:${key}`] ?? ""} />
                </span>
              </label>
            ))}
          </div>
        </FacetSection>
      )}

      {/* Hidden helpers — referenced for completeness but not surfaced as accordion */}
      <input type="hidden" data-of-due={filters.dueWindow.join(",")} />
      {/* dueWindow is surfaced in the Simple bar */}
      {/* Keep DUE_WINDOWS in tree-shake graph */}
      <span hidden>{DUE_WINDOWS.length}</span>
    </Accordion.Root>
  );
}

function FacetSection({
  value,
  head,
  children,
}: {
  value: string;
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value} className="of-acc-item">
      <Accordion.Header>
        <Accordion.Trigger className="of-acc-trigger">
          {head}
          <ChevronDown size={13} className="of-acc-chev" aria-hidden />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="of-acc-content">{children}</Accordion.Content>
    </Accordion.Item>
  );
}
