// The Filters menu on the forecasts list — the Opportunities drawer's design
// (src/components/Hunter/FiltersDrawer.tsx) with its classes and section nav, asking
// the questions a forecast can answer: the kind of work and its NAICS codes, where
// (the member's states, or the states and cities she chooses), who may bid, how big
// and in what value range, when the buyer published it and expects to post it, and
// whether it was bought before or is still open.
//
// The server counts (ARCHITECTURE-forecasts-paginated.md, section 9). The state,
// city and NAICS options and their counts are page 1's `facets`. The fixed-choice
// groups show no counts. Choices apply as they are made, and the Show button reads
// the server's `total` for them.
//
// While page 1 of new choices loads, the lists keep the last known options and the
// member's chosen ones, with no count, and say the counts are loading. A list never
// says "no forecast names …" unless the current counts say so.

import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { JargonGloss } from "../Hunter/JargonGloss";
import { SearchableMultiSelect } from "../Hunter/SearchableMultiSelect";
import { SectionNav } from "../Hunter/SectionNav";
import { SegmentedControl } from "../Hunter/SegmentedControl";
import { ValueRangeInputs } from "../Hunter/ValueRangeControl";
import { FILTERS } from "../../lib/forecasts/copy";
import { stateName } from "../../lib/forecasts/engine";
import { useNaicsDescriptionMap } from "../../lib/useNaicsDescriptions";
import {
  EMPTY_FILTERS,
  EXPECTED_WINDOWS,
  POSTED_WITHIN_CHOICES,
  SIZE_BUCKETS,
  WHO_KINDS,
  WORK_KINDS,
  activeFilterCount,
  type ForecastFilters,
  type SizeBucket,
} from "../../lib/forecasts/filters";
import type { ForecastFacetOption, ForecastFacetsDto } from "../../lib/forecastsApi";
import type { ForecastFacetsState } from "../../lib/forecasts/useForecastList";
import type { DrawerSectionId } from "../../lib/filterCounts";

type SectionId = Exclude<DrawerSectionId, "advanced">;
const SECTIONS: SectionId[] = ["what", "where", "fit", "timing"];

/** The control's value for "any posted date". */
const ANY_DATE = "any";

/** No options: the page-1 counts are not back yet. */
const NO_FACETS: ForecastFacetsDto = { states: [], cities: [], naics: [] };

/** One option of a state, city or NAICS list. A null count is not known yet. */
interface ListOption {
  value: string;
  count: number | null;
}

/** The options of one list. With current facets: the server's options and counts.
 *  Otherwise: the last known values, then each chosen value they lack, with no count. */
function listOptions(
  known: readonly ForecastFacetOption[],
  chosen: readonly string[],
  current: boolean,
): ListOption[] {
  if (current) return known.map((o) => ({ value: o.value, count: o.count }));
  const values = [...new Set([...known.map((o) => o.value), ...chosen])];
  return values.map((value) => ({ value, count: null }));
}

/** The count words, or nothing while the count is not known. */
function countWords(count: number | null): string | undefined {
  return count == null ? undefined : FILTERS.forecastCount(count);
}

/** What a list says while its counts do not answer the current choices. */
function notCurrentLine(state: ForecastFacetsState): string {
  return state === "failed" ? FILTERS.optionsFailed : FILTERS.optionsPending;
}

/** The line under a list while its counts are not current, when it has options.
 *  With no option, the list itself shows the line. */
function OptionsLine({ line, shown }: { line: string | null; shown: boolean }) {
  if (!line || !shown) return null;
  return (
    <p className="fc-filters__note" role="status">
      {line}
    </p>
  );
}

/** The preset day counts, plus the chosen count when it is not a preset, in order.
 *  A count from the URL or from Hunter then always shows as the chosen option. */
function postedChoices(chosen: number | null): number[] {
  if (chosen == null || POSTED_WITHIN_CHOICES.includes(chosen)) return POSTED_WITHIN_CHOICES;
  return [...POSTED_WITHIN_CHOICES, chosen].sort((a, b) => a - b);
}

function Head({ label, gloss }: { label: string; gloss?: string }) {
  return (
    <div className="fd-control__head">
      <span>{label}</span>
      {gloss && <JargonGloss gloss={gloss} />}
    </div>
  );
}

/** The drawer's filters, with the options and counts the server gave. */
export function ForecastFiltersDrawer({
  open,
  onClose,
  facets,
  facetsState,
  total,
  filters,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  /** Page 1's state, city and NAICS options, each with its count, or the last known
   *  ones while `facetsState` is not `current`. Null before any page 1 answered. */
  facets: ForecastFacetsDto | null;
  /** Whether `facets` answer the current choices. */
  facetsState: ForecastFacetsState;
  /** The forecasts the current choices show. Null while loading. */
  total: number | null;
  filters: ForecastFilters;
  onChange: (next: ForecastFilters) => void;
}) {
  const [active, setActive] = useState<SectionId>("what");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const suppressSpyUntil = useRef(0);
  const known = facets ?? NO_FACETS;
  const current = facets != null && facetsState === "current";
  const states = listOptions(known.states, filters.states, current);
  const cities = listOptions(known.cities, filters.cities, current);
  const naics = listOptions(known.naics, filters.naics, current);
  // While the counts are not current, each list says why, never "no forecast names …".
  const pendingLine = current ? null : notCurrentLine(facetsState);
  // The taxonomy's words for each code. A code it does not resolve shows as the code alone.
  const naicsWords = useNaicsDescriptionMap(open ? naics.map((o) => o.value) : []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Scroll-spy, as in the Opportunities drawer: the nav follows the section in view.
  useEffect(() => {
    const el = bodyRef.current;
    if (!open || !el) return;
    const onScroll = () => {
      if (Date.now() < suppressSpyUntil.current) return;
      let current: SectionId = SECTIONS[0];
      for (const id of SECTIONS) {
        const sec = el.querySelector<HTMLElement>(`#fd-sec-${id}`);
        if (sec && sec.offsetTop <= el.scrollTop + 90) current = id;
      }
      setActive(current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  if (!open) return null;

  const jumpTo = (id: DrawerSectionId) => {
    const sec = bodyRef.current?.querySelector<HTMLElement>(`#fd-sec-${id}`);
    if (!sec) return;
    setActive(id as SectionId);
    suppressSpyUntil.current = Date.now() + 1100;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const sectionCount: Record<SectionId, number> = {
    what: (filters.work.length ? 1 : 0) + (filters.naics.length ? 1 : 0),
    where:
      (filters.place !== "any" ? 1 : 0) +
      (filters.states.length ? 1 : 0) +
      (filters.cities.length ? 1 : 0),
    fit:
      (filters.who.length ? 1 : 0) +
      (filters.size !== "any" ? 1 : 0) +
      (filters.valueMin != null || filters.valueMax != null ? 1 : 0),
    timing:
      (filters.expected.length ? 1 : 0) +
      (filters.postedWithin != null ? 1 : 0) +
      (filters.bought !== "any" ? 1 : 0) +
      (filters.status !== "any" ? 1 : 0),
  };

  const toggle = <K extends "work" | "who" | "expected">(
    key: K,
    value: ForecastFilters[K][number],
  ) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div
      className="fd-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={FILTERS.title}
    >
      <aside className="fd-panel fd-panel--wide fc-filters">
        <header className="fd-head">
          <div>
            <div className="t-label">{FILTERS.refine}</div>
            <h2 className="fd-title">{FILTERS.title}</h2>
          </div>
          <button type="button" className="fd-close" onClick={onClose} aria-label={FILTERS.close}>
            <X size={18} />
          </button>
        </header>

        <div className="fd-layout">
          <SectionNav
            sections={SECTIONS.map((id) => ({
              id,
              label: FILTERS.sections[id].label,
              count: sectionCount[id],
            }))}
            activeId={active}
            onJump={jumpTo}
          />
          <div className="fd-body" ref={bodyRef}>
            {/* ── 1 · Kind of work ── */}
            <section id="fd-sec-what" className="fd-sec">
              <div className="fd-sec__head">
                <span className="fd-sec__title">{FILTERS.sections.what.label}</span>
                <span className="fd-sec__sub">{FILTERS.sections.what.sub}</span>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.work} gloss={FILTERS.workGloss} />
                <div className="fd-pillrow" role="group" aria-label={FILTERS.labels.work}>
                  {WORK_KINDS.map((k) => {
                    const on = filters.work.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        className={`fd-pill${on ? " is-on" : ""}`}
                        aria-pressed={on}
                        onClick={() => toggle("work", k)}
                      >
                        <span>{FILTERS.work[k]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="fd-control" role="group" aria-label={FILTERS.labels.naics}>
                <Head label={FILTERS.labels.naics} gloss={FILTERS.naicsGloss} />
                <SearchableMultiSelect
                  options={naics.map((o) => {
                    const words = naicsWords.get(o.value);
                    const count = countWords(o.count);
                    return {
                      id: o.value,
                      label: o.value,
                      mono: true,
                      detail: words && count ? `${words} · ${count}` : (words ?? count),
                    };
                  })}
                  selected={filters.naics}
                  onChange={(codes) => onChange({ ...filters, naics: codes })}
                  placeholder={FILTERS.naicsSearch}
                  emptyText={pendingLine ?? FILTERS.noNaics}
                />
                <OptionsLine line={pendingLine} shown={naics.length > 0} />
                <p className="fc-filters__note">{FILTERS.naicsNote}</p>
              </div>
            </section>

            {/* ── 2 · Where ── */}
            <section id="fd-sec-where" className="fd-sec">
              <div className="fd-sec__head">
                <span className="fd-sec__title">{FILTERS.sections.where.label}</span>
                <span className="fd-sec__sub">{FILTERS.sections.where.sub}</span>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.place} gloss={FILTERS.placeGloss} />
                <SegmentedControl
                  ariaLabel={FILTERS.labels.place}
                  value={filters.place}
                  onChange={(id) => onChange({ ...filters, place: id as ForecastFilters["place"] })}
                  options={(["any", "served"] as const).map((id) => ({
                    value: id,
                    label: FILTERS.place[id],
                  }))}
                />
              </div>
              <div className="fd-control" role="group" aria-label={FILTERS.labels.states}>
                <Head label={FILTERS.labels.states} gloss={FILTERS.statesGloss} />
                <SearchableMultiSelect
                  options={states.map((o) => ({
                    id: o.value,
                    label: stateName(o.value),
                    detail: countWords(o.count),
                  }))}
                  selected={filters.states}
                  onChange={(next) => onChange({ ...filters, states: next })}
                  placeholder={FILTERS.statesSearch}
                  emptyText={pendingLine ?? FILTERS.noStates}
                />
                <OptionsLine line={pendingLine} shown={states.length > 0} />
              </div>
              <div className="fd-control" role="group" aria-label={FILTERS.labels.cities}>
                <Head label={FILTERS.labels.cities} gloss={FILTERS.citiesGloss} />
                <SearchableMultiSelect
                  options={cities.map((o) => ({
                    id: o.value,
                    label: o.value,
                    detail: countWords(o.count),
                  }))}
                  selected={filters.cities}
                  onChange={(next) => onChange({ ...filters, cities: next })}
                  placeholder={FILTERS.citiesSearch}
                  emptyText={pendingLine ?? FILTERS.noCities}
                />
                <OptionsLine line={pendingLine} shown={cities.length > 0} />
                <p className="fc-filters__note">{FILTERS.placeNote}</p>
              </div>
            </section>

            {/* ── 3 · Who may bid and size ── */}
            <section id="fd-sec-fit" className="fd-sec">
              <div className="fd-sec__head">
                <span className="fd-sec__title">{FILTERS.sections.fit.label}</span>
                <span className="fd-sec__sub">{FILTERS.sections.fit.sub}</span>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.who} gloss={FILTERS.whoGloss} />
                <div className="fd-pillrow" role="group" aria-label={FILTERS.labels.who}>
                  {WHO_KINDS.map((k) => {
                    const on = filters.who.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        className={`fd-pill${on ? " is-on" : ""}`}
                        aria-pressed={on}
                        onClick={() => toggle("who", k)}
                      >
                        <span>{FILTERS.who[k]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.size} gloss={FILTERS.sizeGloss} />
                <SegmentedControl
                  ariaLabel={FILTERS.labels.size}
                  value={filters.size}
                  onChange={(id) => onChange({ ...filters, size: id as SizeBucket })}
                  options={SIZE_BUCKETS.map((id) => ({ value: id, label: FILTERS.size[id] }))}
                />
              </div>
              <div className="fd-control" role="group" aria-label={FILTERS.labels.valueRange}>
                <Head label={FILTERS.labels.valueRange} gloss={FILTERS.valueRangeGloss} />
                <ValueRangeInputs
                  value={{ min: filters.valueMin, max: filters.valueMax }}
                  onChange={({ min, max }) =>
                    onChange({ ...filters, valueMin: min, valueMax: max })
                  }
                />
                <p className="fc-filters__note">{FILTERS.valueRangeNote}</p>
              </div>
            </section>

            {/* ── 4 · Timing and history ── */}
            <section id="fd-sec-timing" className="fd-sec">
              <div className="fd-sec__head">
                <span className="fd-sec__title">{FILTERS.sections.timing.label}</span>
                <span className="fd-sec__sub">{FILTERS.sections.timing.sub}</span>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.expected} gloss={FILTERS.expectedGloss} />
                <div className="fd-pillrow" role="group" aria-label={FILTERS.labels.expected}>
                  {EXPECTED_WINDOWS.map((w) => {
                    const on = filters.expected.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        className={`fd-pill${on ? " is-on" : ""}`}
                        aria-pressed={on}
                        onClick={() => toggle("expected", w)}
                      >
                        <span>{FILTERS.expected[w]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.postedWithin} gloss={FILTERS.postedWithinGloss} />
                <SegmentedControl
                  ariaLabel={FILTERS.labels.postedWithin}
                  value={filters.postedWithin == null ? ANY_DATE : String(filters.postedWithin)}
                  onChange={(id) =>
                    onChange({ ...filters, postedWithin: id === ANY_DATE ? null : Number(id) })
                  }
                  options={[null, ...postedChoices(filters.postedWithin)].map((days) => ({
                    value: days == null ? ANY_DATE : String(days),
                    label:
                      days == null ? FILTERS.postedWithin.any : FILTERS.postedWithin.days(days),
                  }))}
                />
                <p className="fc-filters__note">{FILTERS.postedWithinNote}</p>
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.bought} gloss={FILTERS.boughtGloss} />
                <SegmentedControl
                  ariaLabel={FILTERS.labels.bought}
                  value={filters.bought}
                  onChange={(id) =>
                    onChange({ ...filters, bought: id as ForecastFilters["bought"] })
                  }
                  options={(["any", "again", "new"] as const).map((id) => ({
                    value: id,
                    label: FILTERS.bought[id],
                  }))}
                />
              </div>
              <div className="fd-control">
                <Head label={FILTERS.labels.status} />
                <SegmentedControl
                  ariaLabel={FILTERS.labels.status}
                  value={filters.status}
                  onChange={(id) =>
                    onChange({ ...filters, status: id as ForecastFilters["status"] })
                  }
                  options={(["any", "open"] as const).map((id) => ({
                    value: id,
                    label: FILTERS.status[id],
                  }))}
                />
              </div>
            </section>
          </div>
        </div>

        <footer className="fd-foot">
          {activeFilterCount(filters) > 0 && (
            <button
              type="button"
              className="fd-foot__clear"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              <Trash2 size={12} /> {FILTERS.clearAll}
            </button>
          )}
          <button type="button" className="fd-foot__done" onClick={onClose}>
            {total == null ? FILTERS.showPending : FILTERS.show(total)}
          </button>
        </footer>
      </aside>
    </div>
  );
}
