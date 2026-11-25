import { useEffect, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { AwardCard } from "./AwardCard";
import {
  fetchAwards,
  type AwardFilterId,
  type AwardPanelFilters,
  type AwardRecord,
} from "../../lib/awardsApi";
import { matchAward } from "../../lib/search/match";
import { fetchPipeline, type PipelineEntry } from "../../lib/partnersApi";

/** The most awards we show under one saved company. */
const PER_COMPANY = 5;

interface Group {
  entry: PipelineEntry;
  awards: AwardRecord[];
}

/**
 * "From partners you saved": the awards each saved company won, one group per
 * company, above the main list.
 *
 * Production's POST /awards has no filter by winner, so we search by the company
 * name and keep only the awards whose winner is that company (same awardeeKey).
 * The page filters apply here too, so the groups never show what the list below
 * leaves out. The page search applies to the awards that come back.
 * A company with no matching award gets no group. With no group, the section hides.
 */
export function SavedPartnerAwards({
  isSaved,
  onToggleSaved,
  filters,
  panel,
  q,
}: {
  isSaved: (awardId: string) => boolean;
  onToggleSaved: (award: AwardRecord) => void;
  /** The page's filters, as `awardFiltersToRequest` gives them. */
  filters: AwardFilterId[];
  panel?: AwardPanelFilters;
  /** The page's search text. Empty means no search. */
  q: string;
}) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  /** The groups she opened. Every group starts closed. */
  const [open, setOpen] = useState<Set<number>>(new Set());

  // One key for the request, so the effect runs again only when the filters change.
  const requestKey = JSON.stringify({ filters, panel, q: q.trim() });

  useEffect(() => {
    const ctrl = new AbortController();
    const {
      filters: named,
      panel: limits,
      q: needle,
    } = JSON.parse(requestKey) as {
      filters: AwardFilterId[];
      panel?: AwardPanelFilters;
      q: string;
    };
    (async () => {
      const entries = await fetchPipeline(ctrl.signal);
      const found = await Promise.all(
        entries.map(async (entry) => {
          const result = await fetchAwards(
            { q: entry.companyName, filters: named, panel: limits, sort: "recent", limit: 20 },
            ctrl.signal,
          );
          const awards = result.awards
            .filter((a) => a.winner.awardeeKey === entry.awardeeKey)
            .filter((a) => !needle || matchAward(a, needle) !== null)
            .slice(0, PER_COMPANY);
          return { entry, awards };
        }),
      );
      if (ctrl.signal.aborted) return;
      const withAwards = found.filter((g) => g.awards.length > 0);
      setGroups(withAwards);
    })().catch(() => {
      // Not worth an error banner: the main list below still works.
      if (!ctrl.signal.aborted) setGroups([]);
    });
    return () => ctrl.abort();
  }, [requestKey]);

  if (!groups || groups.length === 0) return null;

  const toggle = (key: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section className="spa" aria-labelledby="spa-title">
      <header className="spa__head">
        <h2 id="spa-title" className="t-heading">
          <Users size={18} aria-hidden /> From partners you saved
        </h2>
      </header>
      {groups.map(({ entry, awards }) => {
        const isOpen = open.has(entry.awardeeKey);
        const panelId = `spa-panel-${entry.awardeeKey}`;
        return (
          <div key={entry.awardeeKey} className={`spa-group${isOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="spa-group__toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(entry.awardeeKey)}
            >
              <span className="spa-group__name">{entry.companyName}</span>
              <span className="spa-group__count">
                {awards.length} {awards.length === 1 ? "award" : "awards"}
              </span>
              <ChevronDown size={18} className="spa-group__chev" aria-hidden />
            </button>
            {isOpen && (
              <div id={panelId} className="awards-list spa-group__list">
                {awards.map((a) => (
                  <AwardCard
                    key={a.awardId}
                    award={a}
                    saved={isSaved(a.awardId)}
                    onToggleSaved={onToggleSaved}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
