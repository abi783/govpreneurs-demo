// Partners — the company lens on the award record, in two views:
//   • Find partners — companies already winning your kind of work (real award data)
//   • My partners — the outreach list you are working through
//
// The mock-backed `matches`/`browse`/`list` views were retired: landing a member on
// invented companies is worse than landing them on a smaller real page. Their URLs
// still resolve — validateSearch remaps them onto the real views.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePageMeta } from "../components/Layout/page-meta";
import { FindPartnersView } from "../components/Partners/FindPartnersView";
import { WhosWinningView } from "../components/Partners/WhosWinningView";
import { MyPartnersView } from "../components/Partners/MyPartnersView";

type View = "market" | "find" | "mine";

interface PartnersSearch {
  /** Undefined until resolved — see resolveView. An explicit param always wins. */
  view?: View;
  q: string;
  company?: string;
  /** Absolute path to return to, INCLUDING its own search params. */
  from?: string;
  /** What the member reads after "← Back to". Specific: a company name, not "Partners". */
  fromLabel?: string;
}

/** Legacy views map onto the real one that answers the same question. */
const LEGACY_VIEW: Record<string, View> = {
  matches: "find",
  browse: "find",
  list: "mine",
  // The reference design names this tab `whos-winning`; ours is `market`. Both
  // resolve, so a link written against either spelling lands in the right place.
  "whos-winning": "market",
};

/**
 * Read a search param that may arrive as a number, or as a string wrapped in one
 * layer of double quotes.
 *
 * TanStack JSON-stringifies search values, so a string emitted as `company` used to
 * land here as `"10113502"` — quotes included — and `Number('"10113502"')` is NaN, so
 * the detail panel never opened. Emitters now send numbers, but quoted links are out
 * in the wild (bookmarks, shared URLs), so strip one layer here too.
 */
function param(value: unknown): string | undefined {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string" || !value) return undefined;
  const unquoted = value.replace(/^"(.*)"$/s, "$1");
  return unquoted || undefined;
}

function validateSearch(input: Record<string, unknown>): PartnersSearch {
  // `tab` is the reference design's param name, `view` is ours. Accept both.
  const raw = param(input.view) ?? param(input.tab) ?? "";
  const known = raw === "market" || raw === "find" || raw === "mine";
  // undefined, NOT a default: an unasked-for view is resolved from where the
  // member actually is (see resolveView). An explicit param always wins.
  const view: View | undefined = known ? (raw as View) : LEGACY_VIEW[raw];
  return {
    view,
    q: typeof input.q === "string" ? input.q : "",
    company: param(input.company),
    from: param(input.from),
    fromLabel: param(input.fromLabel),
  };
}

export const Route = createFileRoute("/partners")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Partners — Know your market · GovPreneurs" },
      {
        name: "description",
        content:
          "Companies winning the work you do — and how to reach them to team up. Ranked fits and your outreach list in one place.",
      },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  usePageMeta({});
  const navigate = useNavigate({ from: "/partners" });
  const s = Route.useSearch();

  function patch(p: Partial<PartnersSearch>, opts?: { replace?: boolean }) {
    navigate({ search: (prev: PartnersSearch) => ({ ...prev, ...p }), replace: opts?.replace });
  }

  // Default landing tab is always "find" — Find partners is the point of the
  // surface. An explicit ?view= / ?tab= always wins; a company deep-link
  // (Awards -> winner -> drawer) also always means "find", same as before.
  const openCompanyKey = s.company ? Number(s.company) : null;
  const hasCompanyDeepLink = openCompanyKey !== null && !Number.isNaN(openCompanyKey);

  const view: View = s.view ?? "find";

  const detailOpen = view === "find" && hasCompanyDeepLink;

  // The trail only makes sense when the member came from somewhere that is not here.
  const cameFromElsewhere = Boolean(s.from && s.fromLabel && !s.from.startsWith("/partners"));
  // With the detail panel open, a page-level link sits behind the overlay — visible
  // but unusable — so the trail moves inside the panel instead of rendering twice.
  const backTo = cameFromElsewhere ? s.from : undefined;

  return (
    <div>
      <header style={{ marginBottom: "var(--s-4)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>
          Know your market
        </div>
        <h1 className="t-display-lg">Partners</h1>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 720 }}>
          Companies winning the work you do — and how to reach them to team up.
        </p>
        <p className="exp-scan-scope">
          Every prime we track in your space, ranked by how well they fit what you do — plus the
          outreach list you&rsquo;re working through.
        </p>
      </header>

      {cameFromElsewhere && !detailOpen && (
        <nav className="backnav" aria-label="Go back">
          <Link to={s.from!} className="backlink">
            ← Back to {s.fromLabel}
          </Link>
        </nav>
      )}

      {/* Presentation order only: Find partners · Who's winning · My partners.
          The `view` values, URL params and legacy redirect map are untouched —
          only the rendered/tab order changed, so shared URLs keep working. */}
      <nav className="partners-tabs" role="tablist" aria-label="Partners views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "find"}
          className={`partners-tab${view === "find" ? " is-active" : ""}`}
          onClick={() => patch({ view: "find" })}
        >
          Find partners
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "market"}
          className={`partners-tab${view === "market" ? " is-active" : ""}`}
          onClick={() => patch({ view: "market" })}
        >
          Who&rsquo;s winning
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "mine"}
          className={`partners-tab${view === "mine" ? " is-active" : ""}`}
          onClick={() => patch({ view: "mine" })}
        >
          My partners
        </button>
      </nav>

      {view === "market" && (
        <WhosWinningView
          onOpenCompany={(key) => patch({ view: "find", company: String(key) })}
          onSwitchToFind={() => patch({ view: "find" })}
        />
      )}

      {view === "find" && (
        <FindPartnersView
          openCompanyKey={detailOpen ? openCompanyKey : null}
          onOpenCompany={(awardeeKey) =>
            patch({ company: awardeeKey === null ? undefined : String(awardeeKey) })
          }
          backTo={backTo}
          backLabel={s.fromLabel}
          // A trade-less member has no ranked feed to show here — send them to the
          // market view instead, where "Tell us what you do" already renders with a
          // route to fix it. Only when the view was journey-resolved (no explicit
          // ?view=), so a member who asked for "find" by URL is never bounced.
          onNeedsProfile={s.view ? undefined : () => patch({ view: "market" }, { replace: true })}
        />
      )}

      {view === "mine" && <MyPartnersView onSwitchToFind={() => patch({ view: "find" })} />}
    </div>
  );
}
