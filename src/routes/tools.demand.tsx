import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { StatHeadline } from "@/components/Tools/StatHeadline";
import { StatBreakdown } from "@/components/Tools/StatBreakdown";
import { SnapshotTeaser } from "@/components/Tools/SnapshotTeaser";
import { SoftAskBar } from "@/components/Tools/SoftAskBar";
import { ToolFreshness } from "@/components/Tools/ToolShell";
import { ToolRail } from "@/components/Tools/ToolRail";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { useSnapshotUnlock } from "@/lib/tools/useSnapshotUnlock";
import { toolsHead } from "@/lib/tools/toolsHead";
import {
  getBrowseByCategory,
  getDemand,
  getRelatedNaics,
  getToolsToken,
  postResult,
  type BrowseCategory,
  type DemandResult,
  type NaicsStat,
  type RelatedNaicsLink,
} from "@/lib/tools/api";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Mirrors backend/src/public-tools/naics-links.ts's categorySlug exactly —
// duplicated here (rather than adding `slug` to the /related response) since
// `category` is already on NaicsStat and this is a one-line pure function.
const categorySlug = (category: string): string =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface DemandSearch {
  q?: string;
  naics?: string;
}

// The 6 most common industries from the browse-by-industry list, for the
// one-line "Try:" quick-chip row. Plain labels, not full industry names —
// they prefill the query and run the same free-text classifier as typing.
const QUICK_INDUSTRIES = [
  "Cleaning",
  "IT",
  "Construction",
  "Trucking",
  "Consulting",
  "Landscaping",
];

// The router's default search parser JSON.parses each value, so an all-digit
// NAICS code like "238320" arrives here as the number 238320, not a string —
// coerce rather than reject, or a numeric-looking ?naics= deep link is
// silently dropped (e.g. the "Find related NAICS codes" cross-link).
const asSearchString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;

export const Route = createFileRoute("/tools/demand")({
  validateSearch: (search: Record<string, unknown>): DemandSearch => ({
    q: asSearchString(search.q),
    naics: asSearchString(search.naics),
  }),
  head: () =>
    toolsHead(
      "Does the Government Buy What You Sell?",
      "Free demand check: enter what you sell and see real federal spending by NAICS code — which agencies buy it, how much, and how many contracts were awarded.",
    ),
  component: DemandPage,
});

interface DemandPageProps {
  /** Set by the /tools/demand/$naics shim route — an exact NAICS code read
   *  from the URL path rather than a ?q=/?naics= search param. */
  naicsFromPath?: string;
}

export function DemandPage({ naicsFromPath }: DemandPageProps = {}) {
  const search = useSearch({ strict: false }) as DemandSearch;
  const navigate = useNavigate();
  const [query, setQuery] = useState(search.q ?? naicsFromPath ?? "");
  const [result, setResult] = useState<DemandResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!!getToolsToken());
  const [related, setRelated] = useState<RelatedNaicsLink[]>([]);
  const [browseCategories, setBrowseCategories] = useState<BrowseCategory[]>([]);
  const postedFor = useRef<string | null>(null);
  const gateContainerRef = useRef<HTMLDivElement>(null);
  const { headingRef, justUnlocked, trackGateViewed, onUnlocked } = useSnapshotUnlock("demand");

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getDemand(q);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Best-effort: save the result to the signed-in user's history once per
  // distinct code. Silently skipped when signed out or on any failure.
  useEffect(() => {
    if (!result?.naics || !getToolsToken()) return;
    if (postedFor.current === result.naics.code) return;
    postedFor.current = result.naics.code;
    void postResult({
      tool: "demand",
      naics: result.naics.code,
      title: result.naics.title,
    }).catch(() => {
      /* best-effort */
    });
  }, [result]);

  // Prefill + auto-run from ?q=, ?naics=, or a /tools/demand/$naics path.
  useEffect(() => {
    const initial = search.q ?? search.naics ?? naicsFromPath;
    if (initial) {
      setQuery(initial);
      void runSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (result?.naics && !unlocked) trackGateViewed(result.naics.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, unlocked]);

  // Related-codes list, visible only on a /tools/demand/$naics page — a
  // crawlable + user-visible internal link, not a crawler-only sitemap entry.
  useEffect(() => {
    if (!naicsFromPath || !result?.naics) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    getRelatedNaics(result.naics.code)
      .then((res) => {
        if (!cancelled) setRelated(res.related);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naicsFromPath, result?.naics?.code]);

  // "Browse by category" section, generic /tools/demand page only.
  useEffect(() => {
    if (naicsFromPath || isEmbedMode()) return;
    let cancelled = false;
    getBrowseByCategory()
      .then((res) => {
        if (!cancelled) setBrowseCategories(res.categories);
      })
      .catch(() => {
        if (!cancelled) setBrowseCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [naicsFromPath]);

  useEmbedBridge(result ? "result" : "input");

  const pickAlternative = (stat: NaicsStat) => {
    setQuery(stat.title);
    void runSearch(stat.code);
    void navigate({ to: "/tools/demand", search: { naics: stat.code } });
  };

  const main = (
    <div className="tool-main">
      <h1 className="tool-page-title">Does the federal government buy what you sell?</h1>
      <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
        Describe your business in a few words — e.g. "commercial painting" — and see federal award
        activity in your category.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(query);
          void navigate({ to: "/tools/demand", search: { q: query } });
        }}
        className="tool-search-row"
        style={{ marginTop: "var(--s-4)" }}
      >
        <Input
          aria-label="What does your business do?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. commercial painting"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Check demand"}
        </Button>
      </form>

      {!isEmbedMode() && (
        <p
          className="t-body-sm"
          style={{
            marginTop: "var(--s-2)",
            color: "var(--n-8)",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s-1) var(--s-2)",
            alignItems: "baseline",
          }}
        >
          <span>Try:</span>
          {QUICK_INDUSTRIES.map((name, i) => (
            <span key={name}>
              <button
                type="button"
                onClick={() => {
                  setQuery(name);
                  void runSearch(name);
                  void navigate({ to: "/tools/demand", search: { q: name } });
                }}
                className="t-body-sm"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--blue-7)",
                  fontWeight: 600,
                }}
              >
                {name}
              </button>
              {i < QUICK_INDUSTRIES.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      )}

      {error && (
        <p
          className="t-body-sm"
          style={{
            color: "var(--urg-7)",
            marginTop: "var(--s-3)",
            display: "flex",
            alignItems: "center",
            gap: "var(--s-2)",
          }}
        >
          {error}
          <button
            type="button"
            onClick={() => void runSearch(query)}
            className="btn btn-secondary btn-sm"
          >
            Retry
          </button>
        </p>
      )}

      {loading && !result && (
        <div aria-hidden style={{ marginTop: "var(--s-4)" }}>
          <span
            className="tool-skel"
            style={{ display: "block", height: 96, borderRadius: "var(--r-md)" }}
          />
        </div>
      )}

      {result && result.naics === null && (
        <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-4)" }}>
          We could not match that to a category. Try describing the work in a few words, e.g.
          "commercial painting".
        </p>
      )}

      {result?.naics && (
        <div style={{ marginTop: "var(--s-4)" }}>
          <StatHeadline stat={result.naics} />
          <ToolFreshness asOf={result.naics.asOf} />

          {result.alternatives.length > 0 && (
            <div style={{ marginTop: "var(--s-4)" }}>
              <div className="t-label" style={{ marginBottom: "var(--s-2)" }}>
                Not the right trade? Try:
              </div>
              <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
                {result.alternatives.map((alt) => (
                  <Chip
                    key={alt.code}
                    variant="filter"
                    role="button"
                    tabIndex={0}
                    onClick={() => pickAlternative(alt)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickAlternative(alt);
                      }
                    }}
                    className="tool-focusable-chip"
                    style={{ cursor: "pointer" }}
                  >
                    {alt.code} · {alt.title}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div ref={headingRef as React.RefObject<HTMLDivElement>}>
            {!unlocked && (
              <SnapshotTeaser
                stat={result.naics}
                source="demand"
                context={{ naics: result.naics.code }}
                gateContainerRef={gateContainerRef}
                onUnlocked={() => {
                  setUnlocked(true);
                  onUnlocked(result.naics?.code);
                  // The anonymous response carried the headline only; refetch
                  // with the token so the breakdown fields arrive.
                  void runSearch(query);
                }}
              />
            )}

            {unlocked && (
              <>
                {justUnlocked && (
                  <p className="t-body-sm tool-unlocked-toast">
                    Unlocked — your snapshot is ready. Download the PDF any time.
                  </p>
                )}
                <StatBreakdown stat={result.naics} />
              </>
            )}
          </div>

          {naicsFromPath && result.naics.category && (
            <p className="t-body-sm" style={{ marginTop: "var(--s-3)", color: "var(--n-8)" }}>
              Part of:{" "}
              <Link
                to="/tools/demand/category/$slug"
                params={{ slug: categorySlug(result.naics.category) }}
              >
                {result.naics.category}
              </Link>
            </p>
          )}

          <div
            className="tool-crosslink-row"
            style={{ marginTop: "var(--s-5)", gap: "var(--s-3)" }}
          >
            <Link to="/tools/naics" search={{ naics: result.naics.code }} className="t-body-sm">
              Find related NAICS codes →
            </Link>
            <Link to="/tools/scorecard" className="t-body-sm">
              Check if you're ready to bid →
            </Link>
          </div>

          {naicsFromPath && related.length > 0 && (
            <div style={{ marginTop: "var(--s-5)" }}>
              <div className="t-label" style={{ marginBottom: "var(--s-2)" }}>
                Related NAICS codes
              </div>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-1)",
                  paddingLeft: 0,
                  listStyle: "none",
                }}
              >
                {related.map((r) => (
                  <li key={r.code}>
                    <Link
                      to="/tools/demand/$naics"
                      params={{ naics: r.code }}
                      className="t-body-sm"
                    >
                      {r.title} · {compactUsd.format(r.obligated)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!naicsFromPath && !isEmbedMode() && browseCategories.length > 0 && (
        <details className="tool-browse-categories" style={{ marginTop: "var(--s-5)" }}>
          <summary className="t-label" style={{ cursor: "pointer" }}>
            Browse by category
          </summary>
          <div
            style={{
              marginTop: "var(--s-3)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-4)",
            }}
          >
            {browseCategories.map((group) => (
              <div key={group.category}>
                <Link
                  to="/tools/demand/category/$slug"
                  params={{ slug: group.slug }}
                  className="t-body-sm"
                  style={{ fontWeight: 600, marginBottom: "var(--s-1)", display: "block" }}
                >
                  {group.category}
                </Link>
                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s-1)",
                    paddingLeft: 0,
                    listStyle: "none",
                  }}
                >
                  {group.codes.map((c) => (
                    <li key={c.code}>
                      <Link
                        to="/tools/demand/$naics"
                        params={{ naics: c.code }}
                        className="t-body-sm"
                      >
                        {c.title} · {compactUsd.format(c.obligated)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "Federal award activity for any trade, in seconds",
          "Your market snapshot — competition, set-asides, timing, top buyers — plus a PDF",
          "Cross-links to NAICS search and the readiness scorecard",
        ]}
        lastResult={
          result?.naics ? { title: result.naics.title, createdAt: new Date().toISOString() } : null
        }
        hideSignIn={!unlocked && !!result?.naics}
        crossLinks={[
          { label: "Search NAICS codes", to: "/tools/naics" },
          { label: "Bid readiness scorecard", to: "/tools/scorecard" },
        ]}
      />
      {result?.naics && (
        <SoftAskBar
          tool="demand"
          code={result.naics.code}
          unlocked={unlocked}
          gateRef={gateContainerRef}
        />
      )}
    </div>
  );
}
