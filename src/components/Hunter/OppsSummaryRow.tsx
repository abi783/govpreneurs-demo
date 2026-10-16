import { useState, useRef, useEffect, type ReactNode } from "react";
import { BookmarkPlus, ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  useBusinessProfile,
  weightingDimensions,
  type BusinessProfile,
} from "../../lib/businessProfile";
import { capabilityStatementUrl } from "../../lib/preview";
import { useGhlUser } from "../../lib/ghlUser";
import { CountTicker } from "./CountTicker";
import { SaveSearchPopover } from "./SaveSearchPopover";

export type SortKey = "match" | "newest" | "deadline" | "timeLeft" | "value" | "smallest" | "saved";

const SORT_LABELS: Record<SortKey, string> = {
  match: "Best match",
  newest: "Newly posted",
  deadline: "Closing soonest",
  timeLeft: "Most time left",
  value: "Biggest first",
  smallest: "Smallest first",
  saved: "Recently saved",
};

/** The keys that a feed offers when it does not pass its own `sortKeys`. */
const DEFAULT_SORT_KEYS: SortKey[] = ["match", "newest", "deadline", "value", "saved"];

function SortDropdown({
  sort,
  onSortChange,
  keys,
}: {
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  keys: SortKey[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="opps-sort-menu" ref={ref}>
      <button
        type="button"
        className="opps-sort-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="opps-sort-menu__label">Sort</span>
        <span className="opps-sort-menu__value">{SORT_LABELS[sort]}</span>
        <ChevronDown size={12} className={`opps-sort-menu__chev${open ? " is-open" : ""}`} />
      </button>
      {open && (
        <ul className="opps-sort-menu__list" role="listbox">
          {keys.map((k) => (
            <li key={k} role="option" aria-selected={k === sort}>
              <button
                type="button"
                className={`opps-sort-menu__item${k === sort ? " is-active" : ""}`}
                onClick={() => {
                  onSortChange(k);
                  setOpen(false);
                }}
              >
                {SORT_LABELS[k]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Max real values shown per weighting dimension before collapsing to "+N more". */
const MAX_DIMENSION_ITEMS = 3;

/** Joins a dimension's values, capping at {@link MAX_DIMENSION_ITEMS} with a
 *  "+N more" tail; falls back to a generic phrase when nothing is on file. */
function formatDimension(values: string[], fallback: string): string {
  if (values.length === 0) return fallback;
  const shown = values.slice(0, MAX_DIMENSION_ITEMS).join(", ");
  const extra = values.length - MAX_DIMENSION_ITEMS;
  return extra > 0 ? `${shown} +${extra} more` : shown;
}

/** The generic, values-free weighting explanation — shown while the profile is
 *  still loading (avoids flashing the capability-statement prompt). */
function GenericReasoning() {
  return (
    <p className="opps-summary__reasoning">
      Weighted by <strong>scope fit</strong> (how closely an opportunity matches your business
      categories), <strong>location</strong>, <strong>certification eligibility</strong> (your
      set-asides), and <strong>past performance</strong>.
    </p>
  );
}

/** The "Why these?" reasoning. With a capability statement on file, it names the
 *  user's real scope/location/certifications; without one, it prompts to add it. */
function WhyReasoning({ profile, loading }: { profile: BusinessProfile | null; loading: boolean }) {
  const { session } = useGhlUser();
  if (loading || !profile) return <GenericReasoning />;

  if (!profile.capabilityStatementUrl) {
    // Out to the Roadmap, where the upload actually happens — same destination
    // as the preview banner. This used to point at the in-app /business-profile
    // route, which has no upload control, so the CTA asked for something the
    // member could not do. target="_blank" because we run inside the GHL iframe.
    const href = session?.locationId ? capabilityStatementUrl(session.locationId) : null;
    return (
      <p className="opps-summary__reasoning">
        Matches use general scope only right now.{" "}
        {href ? (
          <a href={href} className="chip-inline-link">
            Add a capability statement
          </a>
        ) : (
          "Add a capability statement"
        )}{" "}
        so Hunter weights these to your real profile.
      </p>
    );
  }

  const { scopeFit, location, certEligibility } = weightingDimensions(profile);
  return (
    <p className="opps-summary__reasoning">
      Weighted by <strong>scope fit</strong> (
      {formatDimension(scopeFit, "your business categories")}), <strong>location</strong> (
      {location ?? "your locations"}), <strong>certification eligibility</strong> (
      {formatDimension(certEligibility, "your set-asides")}), and <strong>past performance</strong>.
    </p>
  );
}

export function OppsSummaryRow({
  matchCount,
  newThisWeek,
  activeCount,
  sort,
  onSortChange,
  onOpenFilters,
  onSaveSearch,
  headlineOverride,
  sublineOverride,
  noun = "matches",
  showWhy = true,
  showNewThisWeek = true,
  summaryAction,
  sortKeys,
}: {
  matchCount: number;
  newThisWeek: number;
  activeCount: number;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  onOpenFilters: () => void;
  /** Persists the current filters under `name`. Takes the SAME handler the
   *  FiltersDrawer footer takes — one save path, two entry points. */
  onSaveSearch: (name: string) => void;
  headlineOverride?: string;
  sublineOverride?: string;
  noun?: string;
  showWhy?: boolean;
  /** Hide the "N new this week" segment — meaningless on the Saved feed, which
   *  lists the member's own bookmarks rather than freshly-posted opps. */
  showNewThisWeek?: boolean;
  /** Optional element rendered inline beside the count (e.g. the Saved feed's
   *  "Go to Pipeline" link). */
  summaryAction?: ReactNode;
  sortKeys?: SortKey[];
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const { profile, loading: profileLoading } = useBusinessProfile();

  return (
    <div className="opps-summary-wrap">
      <div className="opps-summary-row">
        <div className="opps-summary__summary">
          {headlineOverride ? (
            <span className="opps-summary__count">{headlineOverride}</span>
          ) : (
            <>
              <span className="opps-summary__count">
                <CountTicker value={matchCount} className="opps-summary__count-num" /> {noun}
              </span>
              {showNewThisWeek && newThisWeek > 0 && (
                <>
                  <span className="opps-summary__sep" aria-hidden>
                    ·
                  </span>
                  <span className="opps-summary__new">{newThisWeek} new this week</span>
                </>
              )}
            </>
          )}
          {showWhy && (
            <button
              type="button"
              className="opps-summary__why"
              onClick={() => setWhyOpen((v) => !v)}
              aria-expanded={whyOpen}
            >
              {whyOpen ? "Hide reasoning" : "Why these?"}
            </button>
          )}
          {summaryAction}
        </div>

        <div className="opps-summary__controls">
          <button
            type="button"
            className="opps-summary__btn opps-summary__btn--primary"
            onClick={onOpenFilters}
            aria-label="Open filters"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeCount > 0 && <span className="opps-summary__badge">{activeCount}</span>}
          </button>
          <SortDropdown
            sort={sort}
            onSortChange={onSortChange}
            keys={sortKeys ?? DEFAULT_SORT_KEYS}
          />
          <SaveSearchPopover onSave={onSaveSearch}>
            <button
              type="button"
              className="opps-summary__btn"
              aria-label="Save this search"
              title="Save this search"
            >
              <BookmarkPlus size={14} />
              <span>Save</span>
            </button>
          </SaveSearchPopover>
        </div>
      </div>

      {sublineOverride && <p className="opps-summary__subline">{sublineOverride}</p>}
      {showWhy && whyOpen && <WhyReasoning profile={profile} loading={profileLoading} />}
    </div>
  );
}
