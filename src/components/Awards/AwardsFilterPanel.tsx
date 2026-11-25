// The Awards filter panel: seven categories, one shown at a time.
//
// The panel holds every structured field of an award. Free text (city, office, winner,
// contract number) goes in the search box. The pick lists come from GET /awards/facets,
// so each choice finds at least one award. While the lists load, they are empty.

import { useState } from "react";
import { BarChart3, Briefcase, Clock, Gavel, Landmark, MapPin, Users } from "lucide-react";
import type { AwardFacet, AwardFacets } from "../../lib/awardsApi";
import { sentenceCase } from "../../lib/format";
import { plainNaics, plainPricing, plainPsc } from "../../lib/vocab/plainCodes";
import {
  AWARDED_PRESETS,
  BID_PRESETS,
  ENDS_PRESETS,
  NO_AWARD_FILTERS,
  SIZE_PRESETS,
  WHO_COULD_BID,
  awardChips,
  facetLabels,
  type AwardFilters,
  type AwardSection,
  type BuyerChoice,
  type CompetedChoice,
  type WhoCouldBid,
  type WorkChoice,
} from "../../lib/filters/awardFilters";
import {
  CheckList,
  Choices,
  Field,
  FilterPanel,
  PaneHeading,
  RangeField,
  Segments,
  ToggleCard,
} from "../Filters/FilterPanel";
import { StatePicker } from "../Filters/StatePicker";

const COPY = {
  // The shared panel no longer renders the kicker, the subtitle or the pane sub text.
  kicker: "",
  title: "Filter awards",
  sub: "",
  // `more`: there is another page and no exact total, so the number is a floor ("25+").
  apply: (n: number | null, more = false) =>
    n === null
      ? "Show awards"
      : `Show ${n.toLocaleString("en-US")}${more ? "+" : ""} ${n === 1 && !more ? "award" : "awards"}`,
  applyNone: "No awards match",
  sections: {
    work: "Kind of work",
    where: "Place",
    buyer: "Buyer",
    bought: "How it was bought",
    size: "Size",
    firms: "Small firms",
    time: "Dates",
  } as Record<AwardSection, string>,
  work: {
    q: "What kind of work?",
    mine: "My work",
    any: "Any work",
    pick: "Pick",
    pickQ: "Which kinds of work?",
    pickSearch: "Search kinds of work",
    pscQ: "What service was bought?",
    pscSearch: "Search services",
  },
  where: {
    q: "Where was the work?",
  },
  buyer: {
    kindQ: "Military or not?",
    all: "All",
    defense: "Military",
    civilian: "Non-military",
    pickQ: "Which buyers?",
    search: "Search buyers",
  },
  bought: {
    whoQ: "Who could bid?",
    competedQ: "Was it competed?",
    any: "Any",
    yes: "Competed",
    no: "Not competed",
    bidsQ: "How many bids?",
    bidsSay: "Got",
    fewest: "Lowest",
    most: "Highest",
    priceQ: "How is the price set?",
  },
  size: {
    // Size is the money paid so far, the figure on each award card.
    sizeQ: "How much was paid?",
    sizeHelp: "Type 250k or 1.5m.",
    sizeSay: "Paid",
    min: "Lowest",
    max: "Highest",
  },
  firms: {
    q: "Small firms on the job",
    plan: "The winner must plan work for small firms",
    used: "The winner used small firms",
  },
  time: {
    awardedQ: "When was it won?",
    awardedSay: "Won",
    endsQ: "When does it end?",
    endsSay: "Ends",
    from: "From",
    to: "To",
  },
  count: (n: number) => `${n} ${n === 1 ? "award" : "awards"}`,
};

const ICONS = {
  work: Briefcase,
  where: MapPin,
  buyer: Landmark,
  bought: Gavel,
  size: BarChart3,
  firms: Users,
  time: Clock,
};

const NO_FACETS: AwardFacets = { naics: [], psc: [], agencies: [], pricing: [] };

const tog = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

/** A pick-list row for a code: the plain name, then the code and the award count. */
const codeItems = (facets: AwardFacet[], plain: (code: string, official: string) => string) =>
  facets.map((f) => ({
    id: f.id,
    label: plain(f.id, f.label),
    detail: `${f.id} · ${COPY.count(f.count)}`,
  }));

/** A pick-list row for a name, such as an agency. A proper name keeps its own capitals. */
const nameItems = (facets: AwardFacet[]) =>
  facets.map((f) => ({ id: f.id, label: f.label, detail: COPY.count(f.count) }));

export function AwardsFilterPanel({
  open,
  onClose,
  filters,
  onChange,
  memberStates,
  resultCount,
  moreResults = false,
  facets = NO_FACETS,
}: {
  open: boolean;
  onClose: () => void;
  filters: AwardFilters;
  onChange: (next: AwardFilters) => void;
  /** Her service-area states, listed first in the state picker. */
  memberStates: string[];
  resultCount: number | null;
  /** More pages exist and no exact total: the count is a floor. */
  moreResults?: boolean;
  /** The pick-list choices. Empty while they load. */
  facets?: AwardFacets;
}) {
  const [section, setSection] = useState<AwardSection>("work");
  const chips = awardChips(filters, facetLabels(facets));
  const counts = (s: AwardSection) => chips.filter((c) => c.section === s).length;
  const set = (p: Partial<AwardFilters>) => onChange({ ...filters, ...p });
  const Icon = ICONS[section];

  return (
    <FilterPanel
      variant="centered"
      open={open}
      onClose={onClose}
      kicker={COPY.kicker}
      title={COPY.title}
      subtitle={COPY.sub}
      sections={(Object.keys(COPY.sections) as AwardSection[]).map((id) => ({
        id,
        label: COPY.sections[id],
        count: counts(id),
      }))}
      active={section}
      onSection={setSection}
      chips={chips}
      onRemoveChip={(key) => {
        const c = chips.find((x) => x.key === key);
        if (c) onChange(c.remove(filters));
      }}
      onClearAll={() => onChange(NO_AWARD_FILTERS)}
      applyLabel={resultCount === 0 ? COPY.applyNone : COPY.apply(resultCount, moreResults)}
    >
      {section === "work" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.work} sub="" />
          <Field title={COPY.work.q}>
            <Segments<WorkChoice>
              label={COPY.work.q}
              value={filters.work}
              onChange={(work) => set({ work, naics: work === "pick" ? filters.naics : [] })}
              options={[
                { value: "mine", label: COPY.work.mine },
                { value: "any", label: COPY.work.any },
                { value: "pick", label: COPY.work.pick },
              ]}
            />
          </Field>
          {filters.work === "pick" && (
            <Field title={COPY.work.pickQ}>
              <CheckList
                label={COPY.work.pickQ}
                placeholder={COPY.work.pickSearch}
                items={codeItems(facets.naics, plainNaics)}
                selected={filters.naics}
                onToggle={(code) => set({ naics: tog(filters.naics, code) })}
              />
            </Field>
          )}
          <Field title={COPY.work.pscQ}>
            <CheckList
              label={COPY.work.pscQ}
              placeholder={COPY.work.pscSearch}
              items={codeItems(facets.psc, plainPsc)}
              selected={filters.psc}
              onToggle={(code) => set({ psc: tog(filters.psc, code) })}
            />
          </Field>
        </>
      )}

      {section === "where" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.where} sub="" />
          <Field title={COPY.where.q}>
            <StatePicker
              label={COPY.where.q}
              value={filters.states}
              onChange={(states) => set({ states })}
              memberStates={memberStates}
            />
          </Field>
        </>
      )}

      {section === "buyer" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.buyer} sub="" />
          <Field title={COPY.buyer.kindQ}>
            <Segments<BuyerChoice>
              label={COPY.buyer.kindQ}
              value={filters.buyer}
              onChange={(buyer) => set({ buyer })}
              options={[
                { value: "all", label: COPY.buyer.all },
                { value: "defense", label: COPY.buyer.defense },
                { value: "civilian", label: COPY.buyer.civilian },
              ]}
            />
          </Field>
          <Field title={COPY.buyer.pickQ}>
            <CheckList
              label={COPY.buyer.pickQ}
              placeholder={COPY.buyer.search}
              items={nameItems(facets.agencies)}
              selected={filters.agencies}
              onToggle={(a) => set({ agencies: tog(filters.agencies, a) })}
            />
          </Field>
        </>
      )}

      {section === "bought" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.bought} sub="" />
          <Field title={COPY.bought.whoQ}>
            <Choices<WhoCouldBid>
              label={COPY.bought.whoQ}
              options={WHO_COULD_BID}
              selected={filters.who}
              onToggle={(w) => set({ who: tog(filters.who, w) })}
            />
          </Field>
          <Field title={COPY.bought.competedQ}>
            <Segments<CompetedChoice>
              label={COPY.bought.competedQ}
              value={filters.competed}
              onChange={(competed) => set({ competed })}
              options={[
                { value: "any", label: COPY.bought.any },
                { value: "yes", label: COPY.bought.yes },
                { value: "no", label: COPY.bought.no },
              ]}
            />
          </Field>
          <Field title={COPY.bought.bidsQ}>
            <RangeField
              label={COPY.bought.bidsQ}
              kind="count"
              value={filters.bids}
              onChange={(bids) => set({ bids })}
              presets={BID_PRESETS}
              minLabel={COPY.bought.fewest}
              maxLabel={COPY.bought.most}
              sayPrefix={COPY.bought.bidsSay}
            />
          </Field>
          {facets.pricing.length > 0 && (
            <Field title={COPY.bought.priceQ}>
              <Choices<string>
                label={COPY.bought.priceQ}
                options={facets.pricing.map((p) => ({
                  id: p.id,
                  label: plainPricing(p.label),
                  term: sentenceCase(p.label),
                }))}
                selected={filters.pricing}
                onToggle={(p) => set({ pricing: tog(filters.pricing, p) })}
              />
            </Field>
          )}
        </>
      )}

      {section === "size" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.size} sub="" />
          <Field title={COPY.size.sizeQ} help={COPY.size.sizeHelp}>
            <RangeField
              label={COPY.size.sizeQ}
              kind="money"
              value={filters.size}
              onChange={(size) => set({ size })}
              presets={SIZE_PRESETS}
              minLabel={COPY.size.min}
              maxLabel={COPY.size.max}
              sayPrefix={COPY.size.sizeSay}
            />
          </Field>
        </>
      )}

      {section === "firms" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.firms} sub="" />
          <Field title={COPY.firms.q}>
            {/* The choice row's spacing, so the two cards do not touch. */}
            <div className="fp-choices" role="group" aria-label={COPY.firms.q}>
              <ToggleCard
                checked={filters.subPlan}
                onChange={(subPlan) => set({ subPlan })}
                title={COPY.firms.plan}
              />
              <ToggleCard
                checked={filters.hasSubs}
                onChange={(hasSubs) => set({ hasSubs })}
                title={COPY.firms.used}
              />
            </div>
          </Field>
        </>
      )}

      {section === "time" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.time} sub="" />
          <Field title={COPY.time.awardedQ}>
            <RangeField
              label={COPY.time.awardedQ}
              kind="time"
              value={filters.awarded}
              onChange={(awarded) => set({ awarded })}
              presets={AWARDED_PRESETS}
              minLabel={COPY.time.from}
              maxLabel={COPY.time.to}
              direction="ago"
              sayPrefix={COPY.time.awardedSay}
            />
          </Field>
          <Field title={COPY.time.endsQ}>
            <RangeField
              label={COPY.time.endsQ}
              kind="time"
              value={filters.ends}
              onChange={(ends) => set({ ends })}
              presets={ENDS_PRESETS}
              minLabel={COPY.time.from}
              maxLabel={COPY.time.to}
              direction="ahead"
              sayPrefix={COPY.time.endsSay}
            />
          </Field>
        </>
      )}
    </FilterPanel>
  );
}
