import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { AwardCard } from "../components/Awards/AwardCard";
import { AwardsFilterPanel } from "../components/Awards/AwardsFilterPanel";
import { AwardDetailDialog } from "../components/Awards/AwardDetailDialog";
import { SavedPartnerAwards } from "../components/Awards/SavedPartnerAwards";
import { makeHighlighter } from "../components/Search/Highlight";
import { SearchHead } from "../components/Search/SearchHead";
import { SavedAwardsView } from "../components/Awards/SavedAwardsView";
import { AppliedChips, FilterButton } from "../components/Filters/FilterPanel";
import { SuccessCenterLink } from "../components/Partners/SuccessCenterLink";
import {
  AWARD_FILTERS,
  AWARD_SORTS,
  awardFiltersToRequest,
  fetchAwardFacets,
  fetchAwards,
  type AwardFacets,
  type AwardInterpretation,
  type AwardListResult,
  type AwardRecord,
  type AwardSort,
} from "../lib/awardsApi";
import {
  NO_AWARD_FILTERS,
  awardChips,
  facetLabels,
  readAwardFilters,
  type AwardFilters,
} from "../lib/filters/awardFilters";
import { interpretationChips } from "../lib/awards/interpretation";
import { useMemberState } from "../lib/memberState";
import { serviceStates } from "../lib/awards/relevance";
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
  /**
   * The filter panel, so a reload, the Back button and a shared link keep it. Absent
   * means a new visit: her own kind of work in her own states.
   */
  f?: AwardFilters;
  sort?: AwardSort;
  q?: string;
  page?: number;
  /** Absolute path to return to, INCLUDING its own search params. */
  from?: string;
  /** What the member reads after "← Back to". Specific: a company name, not "Awards". */
  fromLabel?: string;
  /** The award open in the detail window, if any. */
  award?: string;
}

/** Parses and bounds the URL state; unknown values fall back to the defaults. */
function validateSearch(input: Record<string, unknown>): AwardsSearch {
  const sort = input.sort === "recent" || input.sort === "largest" ? input.sort : "relevant";

  const page = Number(input.page);

  return {
    view: input.view === "saved" ? "saved" : undefined,
    f: readAwardFilters(input.f),
    sort,
    // The router reads "?q=722310" as a number, so a code search must be turned back
    // into text, or the box opens empty.
    q: typeof input.q === "string" ? input.q : typeof input.q === "number" ? String(input.q) : "",
    // Bounded to match the API: deep paging is a collection scan, not a cheap offset.
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 200) : 1,
    from: typeof input.from === "string" && input.from ? input.from : undefined,
    fromLabel: typeof input.fromLabel === "string" && input.fromLabel ? input.fromLabel : undefined,
    award:
      typeof input.award === "string" && input.award
        ? input.award.replace(/^"(.*)"$/s, "$1")
        : typeof input.award === "number"
          ? String(input.award)
          : undefined,
  };
}

export const Route = createFileRoute("/awards/")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Awards · GovPreneurs" },
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
    sort: raw.sort ?? ("relevant" as AwardSort),
    q: raw.q ?? "",
    page: raw.page ?? 1,
  };

  // The trail only makes sense when the member came from somewhere that is not here.
  const cameFromElsewhere = Boolean(raw.from && raw.fromLabel && !raw.from.startsWith("/awards"));

  const [panelOpen, setPanelOpen] = useState(false);
  // The filters live in the URL. A new visit (no "f") starts with no filter on: every kind
  // of work, all of the US. The "Best match" sort still puts her kind of work first.
  // (Decided 19 Nov 2026: no filter is on before she picks one.)
  const { profile } = useMemberState();
  const areas = serviceStates(profile);
  const filtersKey = raw.f ? JSON.stringify(raw.f) : "";
  const panelFilters = useMemo<AwardFilters>(
    () => (filtersKey ? readAwardFilters(JSON.parse(filtersKey)) : undefined) ?? NO_AWARD_FILTERS,
    [filtersKey],
  );

  const [result, setResult] = useState<AwardListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needle, setNeedle] = useState(search.q);
  // The last (trimmed) term we put in the URL, so its echo never rewrites the box.
  const lastPushed = useRef(search.q);
  // A chip she removed from "Understood as": her edited reading, sent back so the server
  // does not ask the model again. It belongs to one question, so a new search drops it.
  const [edited, setEdited] = useState<{ q: string; value: AwardInterpretation } | null>(null);
  const override = edited && edited.q === search.q ? edited.value : undefined;
  const { isSaved, toggle, saved } = useSavedAwards();
  const [facets, setFacets] = useState<AwardFacets | undefined>(undefined);

  // The pick lists in the filter panel. If they fail, the lists stay empty.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchAwardFacets(ctrl.signal)
      .then(setFacets)
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  // Every filter applies while she searches, so every chip stays on screen.
  const hl = makeHighlighter(search.q);
  const chips = awardChips(panelFilters, facets && facetLabels(facets));
  const request = awardFiltersToRequest(panelFilters);

  // Provenance travels with the save, so the shelf can say where it came from.
  const onToggleSaved = (a: AwardRecord) =>
    toggle(a.awardId, a.recency.justAwarded ? "from Awards · just awarded" : "from Awards");

  // Keep the box in step when the URL changes underneath us (back button, a shared
  // link), without fighting the user's typing.
  useEffect(() => {
    if (search.q !== lastPushed.current) {
      lastPushed.current = search.q;
      setNeedle(search.q);
    }
  }, [search.q]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const { filters, panel } = awardFiltersToRequest(panelFilters);
    fetchAwards(
      {
        filters,
        panel,
        sort: search.sort,
        q: search.q,
        page: search.page,
        interpreted: override,
      },
      ctrl.signal,
    )
      .then(setResult)
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setResult(null); // never leave the last good count on screen next to an error
        console.warn("awards load failed", err);
        setError("Could not load awards.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [panelFilters, search.sort, search.q, search.page, override]);

  const patch = (next: Partial<AwardsSearch>, replace = false) =>
    // Any change other than paging returns to page 1 — staying on page 7 of a
    // different result set shows a member an empty page for no reason.
    navigate({
      search: (prev: AwardsSearch) => ({
        ...prev,
        ...next,
        page: next.page ?? 1,
      }),
      replace,
    });

  // Typing replaces the entry (Back leaves the page, not one letter at a time), and
  // waits for a pause so each keystroke is not a server search.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const term = needle.trim();
      if (term === lastPushed.current) return;
      lastPushed.current = term;
      patch({ q: term }, true);
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle]);

  // A filter change replaces the URL entry, so the Back button leaves the page and does
  // not step through every tick. The new-visit filters keep the URL short.
  const setPanelFilters = (next: AwardFilters) => {
    const isDefault = JSON.stringify(next) === JSON.stringify(NO_AWARD_FILTERS);
    navigate({
      search: (prev: AwardsSearch) => ({ ...prev, f: isDefault ? undefined : next, page: 1 }),
      replace: true,
    });
  };

  // One handler for the "Clear all" chip and the empty state's "Clear filters".
  const clearFilters = () => setPanelFilters(NO_AWARD_FILTERS);

  // When the award window closes, the focus goes back to the card that opened it. The
  // window does this too. This is the fallback, for when the list drew the card again.
  const lastOpened = useRef<string | null>(null);
  useEffect(() => {
    if (raw.award) {
      lastOpened.current = raw.award;
      return;
    }
    const id = lastOpened.current;
    lastOpened.current = null;
    if (!id) return;
    const timer = window.setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      document.querySelector<HTMLElement>(`[data-award-id="${CSS.escape(id)}"]`)?.focus();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [raw.award]);

  return (
    <div className="awards-page">
      <header className="awards-head">
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

      {/* Same order as Partners: search and Filters, the filters that are on, then the tabs. */}
      {search.view !== "saved" && (
        <div className="partners-toolbar">
          <div className="partners-toolbar__row">
            <label className="partners-toolbar__search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={needle}
                maxLength={100}
                placeholder="Search awards or kind of work"
                aria-label="Search awards by company, kind of work, place or number"
                onChange={(e) => {
                  setNeedle(e.target.value);
                }}
              />
            </label>
            <FilterButton count={chips.length} onOpen={() => setPanelOpen(true)} />
          </div>
          <AppliedChips
            chips={chips}
            onRemove={(key) => {
              const c = chips.find((x) => x.key === key);
              if (c) setPanelFilters(c.remove(panelFilters));
            }}
            onClear={clearFilters}
          />
          {result?.interpreted && search.q && (
            <div className="fp-chips" role="group" aria-label="Understood as">
              <span className="t-body-sm">Understood as:</span>
              {interpretationChips(result.interpreted).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="fp-chip"
                  aria-label={`Remove: ${c.label}`}
                  onClick={() => setEdited({ q: search.q, value: c.remove(result.interpreted!) })}
                >
                  {c.label}
                  <X size={13} strokeWidth={2} aria-hidden />
                </button>
              ))}
              {result.interpreted.unsupported && (
                <p className="t-body-sm" style={{ opacity: 0.7, margin: 0, flexBasis: "100%" }}>
                  {result.interpreted.unsupported}
                </p>
              )}
            </div>
          )}
        </div>
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
          {/* Her saved partners first, on the first page. The same filters and search apply. */}
          {search.page === 1 && (
            <SavedPartnerAwards
              isSaved={isSaved}
              onToggleSaved={onToggleSaved}
              filters={request.filters}
              panel={request.panel}
              q={search.q}
            />
          )}

          <div className="awards-sortrow">
            {search.q && error ? null : search.q ? (
              <SearchHead
                count={result ? (result.total ?? result.awards.length) : 0}
                more={result?.total === undefined && Boolean(result?.hasMore)}
                noun="award"
                nouns="awards"
                q={search.q}
              />
            ) : (
              <h2 className="t-heading awards-all__h">
                {/* "All awards" only when nothing narrows the list. Else the count. */}
                {chips.length === 0 ? (
                  "All awards"
                ) : result ? (
                  <>
                    <span className="mono">{result.total ?? result.awards.length}</span>
                    {result.total === undefined && result.hasMore ? "+" : ""}{" "}
                    {(result.total ?? result.awards.length) === 1 ? "award" : "awards"}
                  </>
                ) : (
                  "Awards"
                )}
              </h2>
            )}
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

          <AwardsFilterPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            filters={panelFilters}
            onChange={setPanelFilters}
            memberStates={areas}
            resultCount={result ? (result.total ?? result.awards.length) : null}
            moreResults={result?.total === undefined && Boolean(result?.hasMore)}
            facets={facets}
          />

          {!loading && !error && result && !result.needsProfile && (
            <>
              {result.awards.length === 0 ? (
                <div className="card card-padded awards-empty">
                  <h2 className="t-heading">
                    {search.q ? (
                      <>
                        No awards match <q>{search.q}</q>
                        {chips.length > 0 ? " with these filters" : ""}.
                      </>
                    ) : chips.length > 0 ? (
                      "No awards match these filters."
                    ) : (
                      "There are no awards to show."
                    )}
                  </h2>
                  <div className="awards-empty__acts">
                    {chips.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    )}
                    {search.q && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setNeedle("");
                          patch({ q: "" }, true);
                        }}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="awards-list">
                  {result.awards.map((a) => (
                    <AwardCard
                      key={a.awardId}
                      award={a}
                      saved={isSaved(a.awardId)}
                      onToggleSaved={onToggleSaved}
                      matchedBecause={search.q ? result.matchedBecause?.[a.awardId] : undefined}
                      hl={hl}
                    />
                  ))}
                </div>
              )}

              {/* Paging: "More" stays until the last page. */}
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

      <AwardDetailDialog
        awardId={raw.award ?? null}
        q={search.q}
        onClose={() =>
          navigate({ search: (p: AwardsSearch) => ({ ...p, award: undefined }), replace: true })
        }
        isSaved={isSaved}
        onToggleSaved={onToggleSaved}
      />
    </div>
  );
}
