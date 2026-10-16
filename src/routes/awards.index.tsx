import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { AwardCard } from "../components/Awards/AwardCard";
import { SavedAwardsView } from "../components/Awards/SavedAwardsView";
import { SuccessCenterLink } from "../components/Partners/SuccessCenterLink";
import {
  AWARD_FILTERS,
  AWARD_SORTS,
  DEFAULT_AWARD_FILTERS,
  fetchAwards,
  type AwardFilterId,
  type AwardListResult,
  type AwardRecord,
  type AwardSort,
} from "../lib/awardsApi";
import { useSavedAwards } from "../lib/useSavedAwards";

/**
 * Every key is optional so `<Link to="/awards">` needs no `search` prop. A route
 * whose search type has required keys forces every caller to pass a full object (or
 * reach for an `as never` escape hatch) — a known contributor to this repo's
 * typecheck baseline. Defaults are applied in the component, not the type.
 */
interface AwardsSearch {
  /** `saved` shows the bookmark shelf; anything else shows the feed. */
  view?: "saved";
  filters?: AwardFilterId[];
  sort?: AwardSort;
  q?: string;
  page?: number;
  /** Absolute path to return to, INCLUDING its own search params. */
  from?: string;
  /** What the member reads after "← Back to". Specific: a company name, not "Awards". */
  fromLabel?: string;
}

const FILTER_IDS = AWARD_FILTERS.map((f) => f.id);

/** Parses and bounds the URL state; unknown values fall back to the defaults. */
function validateSearch(input: Record<string, unknown>): AwardsSearch {
  const raw = Array.isArray(input.filters)
    ? input.filters
    : typeof input.filters === "string"
      ? input.filters.split(",")
      : undefined;
  const filters = raw
    ? (raw.filter((f): f is AwardFilterId =>
        FILTER_IDS.includes(f as AwardFilterId),
      ) as AwardFilterId[])
    : DEFAULT_AWARD_FILTERS;

  const sort = input.sort === "recent" || input.sort === "largest" ? input.sort : "relevant";

  const page = Number(input.page);

  return {
    view: input.view === "saved" ? "saved" : undefined,
    filters,
    sort,
    q: typeof input.q === "string" ? input.q : "",
    // Bounded to match the API: deep paging is a collection scan, not a cheap offset.
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 200) : 1,
    from: typeof input.from === "string" && input.from ? input.from : undefined,
    fromLabel: typeof input.fromLabel === "string" && input.fromLabel ? input.fromLabel : undefined,
  };
}

export const Route = createFileRoute("/awards/")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Awards — Know your market · GovPreneurs" },
      {
        name: "description",
        content: "Who buys the work you sell, who won it, and what comes up for bid again.",
      },
    ],
  }),
  component: AwardsPage,
});

function AwardsPage() {
  usePageMeta({});
  const raw = Route.useSearch();
  const navigate = Route.useNavigate();

  // The search type is fully optional (see AwardsSearch) so callers can link here
  // bare; defaults land here instead of in the type.
  const search = {
    view: raw.view,
    filters: raw.filters ?? DEFAULT_AWARD_FILTERS,
    sort: raw.sort ?? ("relevant" as AwardSort),
    q: raw.q ?? "",
    page: raw.page ?? 1,
  };

  // The trail only makes sense when the member came from somewhere that is not here.
  const cameFromElsewhere = Boolean(raw.from && raw.fromLabel && !raw.from.startsWith("/awards"));

  const [result, setResult] = useState<AwardListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needle, setNeedle] = useState(search.q);
  const { isSaved, toggle, saved } = useSavedAwards();

  // Provenance travels with the save, so the shelf can say where it came from.
  const onToggleSaved = (a: AwardRecord) =>
    toggle(a.awardId, a.recency.justAwarded ? "from Awards · just awarded" : "from Awards");

  // Keep the box in step when the URL changes underneath us (back button, a shared
  // link), without fighting the user's typing.
  useEffect(() => setNeedle(search.q), [search.q]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchAwards(
      {
        filters: search.filters,
        sort: search.sort,
        q: search.q,
        page: search.page,
      },
      ctrl.signal,
    )
      .then(setResult)
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong loading awards.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [search.filters, search.sort, search.q, search.page]);

  const patch = (next: Partial<AwardsSearch>) =>
    // Any change other than paging returns to page 1 — staying on page 7 of a
    // different result set shows a member an empty page for no reason.
    navigate({
      search: (prev: AwardsSearch) => ({
        ...prev,
        ...next,
        page: next.page ?? 1,
      }),
    });

  const toggleFilter = (id: AwardFilterId) =>
    patch({
      filters: search.filters.includes(id)
        ? search.filters.filter((f) => f !== id)
        : [...search.filters, id],
    });

  return (
    <div className="awards-page">
      <header className="awards-head">
        <div className="t-label">Know your market</div>
        <h1 className="t-display-lg">Awards</h1>
        <p className="t-body-sm awards-head__lede">
          Who buys the work you sell, who won it, and what comes up for bid again.
        </p>
      </header>

      {cameFromElsewhere && (
        <nav className="backnav" aria-label="Go back">
          <Link to={raw.from!} className="backlink">
            ← Back to {raw.fromLabel}
          </Link>
        </nav>
      )}

      <nav className="partners-tabs" role="tablist" aria-label="Awards views">
        <button
          type="button"
          role="tab"
          aria-selected={search.view !== "saved"}
          className={`partners-tab${search.view !== "saved" ? " is-active" : ""}`}
          onClick={() => navigate({ search: (p: AwardsSearch) => ({ ...p, view: undefined }) })}
        >
          The market
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={search.view === "saved"}
          className={`partners-tab${search.view === "saved" ? " is-active" : ""}`}
          onClick={() => navigate({ search: (p: AwardsSearch) => ({ ...p, view: "saved" }) })}
        >
          Saved
        </button>
      </nav>

      {search.view === "saved" && (
        <SavedAwardsView
          saved={saved}
          onToggleSaved={onToggleSaved}
          onBrowse={() => navigate({ search: (p: AwardsSearch) => ({ ...p, view: undefined }) })}
        />
      )}

      {search.view !== "saved" && (
        <>
          {/* Filters are named questions, not filter primitives — and they are shown
          rather than hidden, so a member can always see why a job is in front of
          them and remove the reason. */}
          <div className="awards-controls">
            <div className="awards-filters" role="group" aria-label="Narrow these awards">
              {AWARD_FILTERS.map((f) => {
                const on = search.filters.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    title={f.hint}
                    className={`award-chip${on ? " is-on" : ""}`}
                    onClick={() => toggleFilter(f.id)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="awards-tools">
              <form
                className="awards-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  patch({ q: needle.trim() });
                }}
              >
                <Search size={14} aria-hidden />
                <input
                  type="search"
                  value={needle}
                  maxLength={100}
                  placeholder="Search a company name"
                  aria-label="Search awards"
                  onChange={(e) => setNeedle(e.target.value)}
                />
              </form>

              <label className="awards-sort">
                <span className="t-label">Sort</span>
                <select
                  value={search.sort}
                  onChange={(e) => patch({ sort: e.target.value as AwardSort })}
                >
                  {AWARD_SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {loading && <p className="awards-note">Finding awards in your lane…</p>}

          {error && !loading && (
            <div className="card card-padded">
              <p className="t-body-sm">{error}</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => patch({})}>
                Try again
              </button>
            </div>
          )}

          {/* The server could not scope the search to a trade, so it ran no query. Say
          what to do about it rather than showing an empty feed, which would read as
          "there is no work in your trade". */}
          {!loading && !error && result?.needsProfile && (
            <div className="card card-padded">
              <h2 className="t-heading">Tell us what you do</h2>
              <p className="t-body-sm">
                We match awards to the kind of work you do. Add your trade to your profile and this
                page fills up.
              </p>
              <SuccessCenterLink />
            </div>
          )}

          {/* A chip the member turned on that narrowed nothing. Saying so beats a
          pressed chip that silently changes no results — which is how this was
          reported: "Near me does nothing". */}
          {!loading && !error && result?.droppedFilters?.length ? (
            <p className="award-note">
              {result.droppedFilters
                .map((id) => AWARD_FILTERS.find((f) => f.id === id)?.label ?? id)
                .join(" and ")}{" "}
              {result.droppedFilters.length > 1 ? "are" : "is"} on, but your profile has nothing to
              narrow by — so {result.droppedFilters.length > 1 ? "they aren't" : "it isn't"}{" "}
              changing these results.
            </p>
          ) : null}

          {!loading && !error && result && !result.needsProfile && (
            <>
              {result.awards.length === 0 ? (
                <div className="card card-padded">
                  <h2 className="t-heading">Nothing matched</h2>
                  <p className="t-body-sm">Try removing a filter above to widen the search.</p>
                </div>
              ) : (
                <div className="awards-list">
                  {result.awards.map((a) => (
                    <AwardCard
                      key={a.awardId}
                      award={a}
                      saved={isSaved(a.awardId)}
                      onToggleSaved={onToggleSaved}
                    />
                  ))}
                </div>
              )}

              {/* No total: counting 33M rows to render a number is not worth the scan. */}
              {(search.page > 1 || result.hasMore) && (
                <nav className="awards-pager" aria-label="More awards">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={search.page <= 1}
                    onClick={() => patch({ page: search.page - 1 })}
                  >
                    Back
                  </button>
                  <span className="t-body-sm">Page {search.page}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={!result.hasMore}
                    onClick={() => patch({ page: search.page + 1 })}
                  >
                    More
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
