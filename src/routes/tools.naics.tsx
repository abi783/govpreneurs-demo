import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatHeadline } from "@/components/Tools/StatHeadline";
import { StatBreakdown } from "@/components/Tools/StatBreakdown";
import { SnapshotTeaser } from "@/components/Tools/SnapshotTeaser";
import { SoftAskBar } from "@/components/Tools/SoftAskBar";
import { ToolFreshness } from "@/components/Tools/ToolShell";
import { ToolRail } from "@/components/Tools/ToolRail";
import { IndustryBrowser } from "@/components/Tools/IndustryBrowser";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { useSnapshotUnlock } from "@/lib/tools/useSnapshotUnlock";
import { toolsHead } from "@/lib/tools/toolsHead";
import { getNaics, searchNaics, getToolsToken, postResult, type NaicsStat } from "@/lib/tools/api";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

interface NaicsSearch {
  q?: string;
  naics?: string;
  industry?: string;
}

// The router's default search parser JSON.parses each value, so an all-digit
// NAICS code like "238320" arrives here as the number 238320, not a string —
// coerce rather than reject, or a plain string check silently drops every
// numeric-looking ?naics= / ?q= deep link (e.g. from the demand tool).
const asSearchString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;

export const Route = createFileRoute("/tools/naics")({
  validateSearch: (search: Record<string, unknown>): NaicsSearch => ({
    q: asSearchString(search.q),
    naics: asSearchString(search.naics),
    industry: asSearchString(search.industry),
  }),
  head: () =>
    toolsHead(
      "NAICS Code Lookup for Government Contracts",
      "Search 2022 NAICS codes by keyword and see which ones federal agencies actually buy under — so you pick the right code for SAM.gov and your bids. Free.",
    ),
  component: NaicsPage,
});

function NaicsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [query, setQuery] = useState(search.q ?? "");
  const [results, setResults] = useState<NaicsStat[]>([]);
  const [selected, setSelected] = useState<NaicsStat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!!getToolsToken());
  const [industrySlug, setIndustrySlug] = useState<string | null>(search.industry ?? null);
  const [showBrowser, setShowBrowser] = useState(!search.q && !search.naics);
  const postedFor = useRef<string | null>(null);
  const gateContainerRef = useRef<HTMLDivElement>(null);
  const { headingRef, justUnlocked, trackGateViewed, onUnlocked } = useSnapshotUnlock("naics");

  useEffect(() => {
    if (selected && !unlocked) trackGateViewed(selected.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, unlocked]);

  useEffect(() => {
    if (!selected || !getToolsToken()) return;
    if (postedFor.current === selected.code) return;
    postedFor.current = selected.code;
    void postResult({ tool: "naics", naics: selected.code, title: selected.title }).catch(() => {
      /* best-effort */
    });
  }, [selected]);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchNaics(q);
      setResults(res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const stat = await getNaics(code);
      setSelected(stat);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search.naics) {
      void selectCode(search.naics);
    } else if (search.q) {
      setQuery(search.q);
      void runSearch(search.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEmbedBridge(selected ? "result" : "input");

  const selectIndustrySlug = (slug: string | null) => {
    setIndustrySlug(slug);
    void navigate({ search: slug ? { industry: slug } : {} });
  };

  const selectFromIndustry = (code: string) => {
    setResults([]);
    setShowBrowser(false);
    setSelected(null);
    void selectCode(code);
    void navigate({ search: { naics: code } });
  };

  const main = (
    <div className="tool-main">
      <h1 className="tool-page-title">NAICS code search for federal contractors</h1>
      <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
        Search by industry or code to see federal award activity, ranked by 3-year award count.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSelected(null);
          setShowBrowser(false);
          void runSearch(query);
          void navigate({ search: { q: query } });
        }}
        className="tool-search-row"
        style={{ marginTop: "var(--s-4)" }}
      >
        <Input
          aria-label="Search NAICS codes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. janitorial, 561720"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

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

      {loading && !selected && results.length === 0 && (
        <div
          aria-hidden
          style={{
            marginTop: "var(--s-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-1)",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="tool-skel"
              style={{ height: 48, borderRadius: "var(--r-sm)" }}
            />
          ))}
        </div>
      )}

      {!selected && results.length > 0 && (
        <ul
          style={{
            marginTop: "var(--s-4)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {results.map((r) => (
            <li key={r.code} className="tool-naics-row">
              <button
                type="button"
                onClick={() => {
                  setSelected(r);
                  setShowBrowser(false);
                  void navigate({ search: { naics: r.code } });
                }}
                className="tool-naics-row__btn"
              >
                <span className="tool-mono tool-naics-row__code">{r.code}</span>
                <span className="t-body-sm tool-naics-row__title">{r.title}</span>
                <span className="tool-mono t-body-sm tool-naics-row__figure">
                  {compactUsd.format(r.obligated)}
                </span>
                <span className="tool-mono t-body-sm tool-naics-row__figure">
                  {r.awardCount.toLocaleString()}
                </span>
                <span className="tool-mono t-body-sm tool-naics-row__figure">
                  {r.medianValue != null ? compactUsd.format(r.medianValue) : "n/a"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !selected && results.length === 0 && query.trim() && !error && (
        <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-4)" }}>
          No NAICS codes matched "{query}". Try a broader term or a 2–6 digit code.
        </p>
      )}

      {!selected && results.length === 0 && (
        <>
          {showBrowser ? (
            <IndustryBrowser
              selectedSlug={industrySlug}
              onSelectSlug={selectIndustrySlug}
              onSelectCode={selectFromIndustry}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowBrowser(true)}
              className="t-body-sm"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginTop: "var(--s-4)",
                cursor: "pointer",
                color: "var(--blue-7)",
                fontWeight: 600,
              }}
            >
              Browse industries
            </button>
          )}
        </>
      )}

      {selected && (
        <div style={{ marginTop: "var(--s-4)" }}>
          <StatHeadline stat={selected} />
          <ToolFreshness asOf={selected.asOf} />

          <div ref={headingRef as React.RefObject<HTMLDivElement>}>
            {!unlocked && (
              <SnapshotTeaser
                stat={selected}
                source="naics"
                context={{ naics: selected.code }}
                gateContainerRef={gateContainerRef}
                onUnlocked={() => {
                  setUnlocked(true);
                  onUnlocked(selected.code);
                  // Refetch with the token so the breakdown fields arrive.
                  void selectCode(selected.code);
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
                <StatBreakdown stat={selected} />
              </>
            )}
          </div>

          <div
            className="tool-crosslink-row"
            style={{ marginTop: "var(--s-5)", gap: "var(--s-3)" }}
          >
            <Link to="/tools/demand" search={{ naics: selected.code }} className="t-body-sm">
              See demand for this code →
            </Link>
            <Link to="/tools/scorecard" className="t-body-sm">
              Check if you're ready to bid →
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "Search all 1,012 NAICS codes by keyword or number",
          "Ranked by 3-year federal award count",
          "Your market snapshot — competition, set-asides, timing, top buyers — plus a PDF",
        ]}
        lastResult={
          selected ? { title: selected.title, createdAt: new Date().toISOString() } : null
        }
        hideSignIn={!unlocked && !!selected}
        crossLinks={[
          { label: "Check demand for a trade", to: "/tools/demand" },
          { label: "Bid readiness scorecard", to: "/tools/scorecard" },
        ]}
      />
      {selected && (
        <SoftAskBar
          tool="naics"
          code={selected.code}
          unlocked={unlocked}
          gateRef={gateContainerRef}
        />
      )}
    </div>
  );
}
