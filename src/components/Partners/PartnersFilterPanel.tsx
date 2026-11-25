// The Find partners filter panel: seven categories, one shown at a time.
// Design approved by Shyam on 10 Nov 2026. Buyers and certifications added on 19 Nov 2026.
//
// All filtering is client-side — the partner list is precomputed and small enough
// (typically a few hundred companies) that in-browser filtering is fast. The pick lists
// come from the same list (partnerPickLists), so each choice finds at least one company.

import { useState } from "react";
import { BadgeCheck, BarChart3, Briefcase, EyeOff, Landmark, MapPin, Users } from "lucide-react";
import type { PartnerVerdict } from "../../lib/partnersApi";
import { CERT_GROUPS } from "../../lib/filters/smallBusinessPrograms";
import { StatePicker } from "../Filters/StatePicker";
import {
  FIRMS_PRESETS,
  JOBS_PRESETS,
  KIND_CHOICES,
  LAST_WON_PRESETS,
  NEXT_ENDS_PRESETS,
  NO_PARTNER_FILTERS,
  PARTNER_SIZE_PRESETS,
  REPEAT_PRESETS,
  TREND_CHOICES,
  partnerChips,
  type BenchTrend,
  type CertId,
  type MatchChoice,
  type PartnerBuyerKind,
  type PartnerFilters,
  type PartnerPickLists,
  type PartnerSection,
} from "../../lib/filters/partnerFilters";
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

// Short words only. An empty help, sub or note is not rendered, so "" removes it.
const COPY = {
  kicker: "",
  title: "Filter companies",
  sub: "",
  apply: (n: number) => `Show ${n} ${n === 1 ? "company" : "companies"}`,
  applyNone: "No companies match",
  sections: {
    work: "Their work",
    where: "Where",
    buyers: "Buyers",
    people: "Small firms",
    size: "Size and activity",
    certs: "Certifications",
    hidden: "Hidden",
  } as Record<PartnerSection, string>,
  work: {
    sub: "",
    matchQ: "How close to your work?",
    matchHelp: "",
    both: "Both",
    exact: "Same work",
    close: "Similar work",
    kindQ: "What kind of company?",
    kindHelp: "",
    winsQ: "What work do they win?",
    winsSearch: "Search kinds of work",
  },
  buyers: {
    kindQ: "Military or not?",
    all: "All",
    defense: "Military",
    civilian: "Non-military",
    pickQ: "Which buyers?",
    search: "Search buyers",
  },
  where: {
    sub: "",
    q: "Where do they work?",
  },
  people: {
    sub: "",
    firmsQ: "How many small firms do they use?",
    firmsHelp: "",
    firmsSay: "Uses",
    repeatQ: "How many they used again?",
    repeatHelp: "",
    repeatSay: "Used again:",
    // Numbers and money: Lowest and Highest. Dates: From and To. The same on Awards.
    least: "Lowest",
    most: "Highest",
    tradesQ: "Which trades do they hire?",
    tradesSearch: "Search trades",
    trendQ: "Is their use of small firms growing?",
    mentorQ: "Mentor program",
    mentorTitle: "Has a mentor program",
    mentorDetail: "",
  },
  size: {
    sub: "",
    sizeQ: "How big is a usual job?",
    sizeHelp: "",
    sizeSay: "Usual job:",
    min: "Lowest",
    max: "Highest",
    lastQ: "When did they last win?",
    lastHelp: "",
    lastNote: "",
    lastSay: "Last won",
    from: "From",
    to: "To",
    jobsQ: "How many jobs on record?",
    jobsSay: "Jobs on record:",
    nextQ: "When does their next job end?",
    nextSay: "Ends",
  },
  // One question for each group in CERT_GROUPS. The group title is the question.
  // One question for each group in CERT_GROUPS. The group title is the question.
  certs: {
    checkedQ: "Who checked it?",
    checkedTitle: "Only certifications that the government checked",
    checkedDetail:
      "Checked by the Small Business Administration (SBA). Off: also shows what companies say.",
  },
  hidden: {
    sub: "",
    q: "Companies you hid",
    title: "Show them again",
    detail: (n: number) => (n === 1 ? "1 company" : `${n} companies`),
    none: "You have not hidden any companies.",
  },
};

const ICONS = {
  work: Briefcase,
  where: MapPin,
  buyers: Landmark,
  people: Users,
  size: BarChart3,
  certs: BadgeCheck,
  hidden: EyeOff,
};

const tog = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export function PartnersFilterPanel({
  open,
  onClose,
  filters,
  onChange,
  areaStates,
  hiddenNames,
  resultCount,
  lists,
}: {
  open: boolean;
  onClose: () => void;
  filters: PartnerFilters;
  onChange: (next: PartnerFilters) => void;
  /** Her service states; empty means she works anywhere in the country. */
  areaStates: string[];
  /** The names of the companies she hid, so the Hidden section can list them. */
  hiddenNames: string[];
  /** @deprecated Use hiddenNames. Kept so an older caller still compiles. */
  hiddenCount?: number;
  resultCount: number;
  /** The choices for the pick lists, built from the whole feed. */
  lists: PartnerPickLists;
}) {
  const [section, setSection] = useState<PartnerSection>("work");
  const chips = partnerChips(filters, lists);
  const counts = (s: PartnerSection) => chips.filter((c) => c.section === s).length;
  const set = (p: Partial<PartnerFilters>) => onChange({ ...filters, ...p });
  const Icon = ICONS[section];

  return (
    <FilterPanel
      variant="centered"
      open={open}
      onClose={onClose}
      kicker={COPY.kicker}
      title={COPY.title}
      subtitle={COPY.sub}
      sections={(Object.keys(COPY.sections) as PartnerSection[]).map((id) => ({
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
      onClearAll={() => onChange(NO_PARTNER_FILTERS)}
      applyLabel={resultCount === 0 ? COPY.applyNone : COPY.apply(resultCount)}
    >
      {section === "work" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.work} sub={COPY.work.sub} />
          <Field title={COPY.work.matchQ} help={COPY.work.matchHelp}>
            <Segments<MatchChoice>
              label={COPY.work.matchQ}
              value={filters.match}
              onChange={(match) => set({ match })}
              options={[
                { value: "both", label: COPY.work.both },
                { value: "exact", label: COPY.work.exact },
                { value: "close", label: COPY.work.close },
              ]}
            />
          </Field>
          <Field title={COPY.work.kindQ} help={COPY.work.kindHelp}>
            <Choices<PartnerVerdict>
              label={COPY.work.kindQ}
              options={KIND_CHOICES}
              selected={filters.kinds}
              onToggle={(k) => set({ kinds: tog(filters.kinds, k) })}
            />
          </Field>
          {lists.workTypes.length > 0 && (
            <Field title={COPY.work.winsQ}>
              <CheckList
                label={COPY.work.winsQ}
                placeholder={COPY.work.winsSearch}
                items={lists.workTypes}
                selected={filters.workTypes}
                onToggle={(w) => set({ workTypes: tog(filters.workTypes, w) })}
              />
            </Field>
          )}
        </>
      )}

      {section === "where" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.where} sub={COPY.where.sub} />
          <Field title={COPY.where.q}>
            <StatePicker
              label={COPY.where.q}
              value={filters.states}
              onChange={(states) => set({ states })}
              memberStates={areaStates}
            />
          </Field>
        </>
      )}

      {section === "buyers" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.buyers} sub="" />
          {/* Shown once the list carries buyers. Without them the choice could only say "none". */}
          {(lists.buyers.length > 0 || filters.buyerKind !== "all") && (
            <Field title={COPY.buyers.kindQ}>
              <Segments<PartnerBuyerKind>
                label={COPY.buyers.kindQ}
                value={filters.buyerKind}
                onChange={(buyerKind) => set({ buyerKind })}
                options={[
                  { value: "all", label: COPY.buyers.all },
                  { value: "defense", label: COPY.buyers.defense },
                  { value: "civilian", label: COPY.buyers.civilian },
                ]}
              />
            </Field>
          )}
          {lists.buyers.length > 0 && (
            <Field title={COPY.buyers.pickQ}>
              <CheckList
                label={COPY.buyers.pickQ}
                placeholder={COPY.buyers.search}
                items={lists.buyers}
                selected={filters.buyers}
                onToggle={(b) => set({ buyers: tog(filters.buyers, b) })}
              />
            </Field>
          )}
        </>
      )}

      {section === "people" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.people} sub={COPY.people.sub} />
          <Field title={COPY.people.firmsQ} help={COPY.people.firmsHelp}>
            <RangeField
              label={COPY.people.firmsQ}
              kind="count"
              value={filters.firms}
              onChange={(firms) => set({ firms })}
              presets={FIRMS_PRESETS}
              minLabel={COPY.people.least}
              maxLabel={COPY.people.most}
              sayPrefix={COPY.people.firmsSay}
            />
          </Field>
          <Field title={COPY.people.repeatQ} help={COPY.people.repeatHelp}>
            <RangeField
              label={COPY.people.repeatQ}
              kind="count"
              value={filters.repeat}
              onChange={(repeat) => set({ repeat })}
              presets={REPEAT_PRESETS}
              minLabel={COPY.people.least}
              maxLabel={COPY.people.most}
              sayPrefix={COPY.people.repeatSay}
            />
          </Field>
          {lists.trades.length > 0 && (
            <Field title={COPY.people.tradesQ}>
              <CheckList
                label={COPY.people.tradesQ}
                placeholder={COPY.people.tradesSearch}
                items={lists.trades}
                selected={filters.trades}
                onToggle={(t) => set({ trades: tog(filters.trades, t) })}
              />
            </Field>
          )}
          <Field title={COPY.people.trendQ}>
            <Choices<BenchTrend>
              label={COPY.people.trendQ}
              options={TREND_CHOICES}
              selected={filters.trend}
              onToggle={(t) => set({ trend: tog(filters.trend, t) })}
            />
          </Field>
          <Field title={COPY.people.mentorQ}>
            <ToggleCard
              checked={filters.mentor}
              onChange={(mentor) => set({ mentor })}
              title={COPY.people.mentorTitle}
              detail={COPY.people.mentorDetail}
            />
          </Field>
        </>
      )}

      {section === "size" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.size} sub={COPY.size.sub} />
          <Field title={COPY.size.sizeQ} help={COPY.size.sizeHelp}>
            <RangeField
              label={COPY.size.sizeQ}
              kind="money"
              value={filters.size}
              onChange={(size) => set({ size })}
              presets={PARTNER_SIZE_PRESETS}
              minLabel={COPY.size.min}
              maxLabel={COPY.size.max}
              sayPrefix={COPY.size.sizeSay}
            />
          </Field>
          <Field title={COPY.size.lastQ} help={COPY.size.lastHelp} note={COPY.size.lastNote}>
            <RangeField
              label={COPY.size.lastQ}
              kind="time"
              value={filters.lastWon}
              onChange={(lastWon) => set({ lastWon })}
              presets={LAST_WON_PRESETS}
              minLabel={COPY.size.from}
              maxLabel={COPY.size.to}
              direction="ago"
              sayPrefix={COPY.size.lastSay}
            />
          </Field>
          <Field title={COPY.size.jobsQ}>
            <RangeField
              label={COPY.size.jobsQ}
              kind="count"
              value={filters.jobs}
              onChange={(jobs) => set({ jobs })}
              presets={JOBS_PRESETS}
              minLabel={COPY.people.least}
              maxLabel={COPY.people.most}
              sayPrefix={COPY.size.jobsSay}
            />
          </Field>
          <Field title={COPY.size.nextQ}>
            <RangeField
              label={COPY.size.nextQ}
              kind="time"
              value={filters.nextEnds}
              onChange={(nextEnds) => set({ nextEnds })}
              presets={NEXT_ENDS_PRESETS}
              minLabel={COPY.size.from}
              maxLabel={COPY.size.to}
              direction="ahead"
              sayPrefix={COPY.size.nextSay}
            />
          </Field>
        </>
      )}

      {section === "certs" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.certs} sub="" />
          <Field title={COPY.certs.checkedQ}>
            <ToggleCard
              checked={filters.certifiedOnly}
              onChange={(certifiedOnly) => set({ certifiedOnly })}
              title={COPY.certs.checkedTitle}
              detail={COPY.certs.checkedDetail}
            />
          </Field>
          {CERT_GROUPS.map((g) => (
            <Field key={g.title} title={g.title}>
              <Choices<CertId>
                label={g.title}
                options={g.choices}
                selected={filters.certs}
                onToggle={(c) => set({ certs: tog(filters.certs, c) })}
              />
            </Field>
          ))}
        </>
      )}

      {section === "hidden" && (
        <>
          <PaneHeading icon={Icon} title={COPY.sections.hidden} sub={COPY.hidden.sub} />
          <Field title={COPY.hidden.q}>
            {hiddenNames.length === 0 ? (
              <p className="fp-hidden-none">{COPY.hidden.none}</p>
            ) : (
              <>
                <ToggleCard
                  checked={filters.showHidden}
                  onChange={(showHidden) => set({ showHidden })}
                  title={COPY.hidden.title}
                  detail={COPY.hidden.detail(hiddenNames.length)}
                />
                <ul className="fp-hidden-list">
                  {hiddenNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </>
            )}
          </Field>
        </>
      )}
    </FilterPanel>
  );
}
