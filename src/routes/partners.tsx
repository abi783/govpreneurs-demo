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
import { MyPartnersView } from "../components/Partners/MyPartnersView";
import { useMemberState } from "../lib/memberState";
import {
  NO_PARTNER_FILTERS,
  readPartnerFilters,
  type PartnerFilters,
} from "../lib/filters/partnerFilters";

type View = "find" | "mine";

interface PartnersSearch {
  /** Undefined until resolved — see resolveView. An explicit param always wins. */
  view?: View;
  q: string;
  company?: string;
  /** Absolute path to return to, INCLUDING its own search params. */
  from?: string;
  /** What the member reads after "← Back to". Specific: a company name, not "Partners". */
  fromLabel?: string;
  /** The Find partners filters, so a reload, Back or a shared link keeps them. */
  f?: PartnerFilters;
}

/** Legacy views map onto the real one that answers the same question. */
const LEGACY_VIEW: Record<string, View> = {
  matches: "find",
  browse: "find",
  list: "mine",
  // Who's winning was removed. Its old links land on Find partners.
  market: "find",
  "whos-winning": "find",
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
  const known = raw === "find" || raw === "mine";
  // undefined, NOT a default: an unasked-for view is resolved from where the
  // member actually is (see resolveView). An explicit param always wins.
  const view: View | undefined = known ? (raw as View) : LEGACY_VIEW[raw];
  // A search of digits only ("722310") arrives as a number, so take that too.
  const q =
    typeof input.q === "number" ? String(input.q) : typeof input.q === "string" ? input.q : "";
  const f = input.f === undefined ? undefined : readPartnerFilters(input.f);
  return {
    view,
    q,
    company: param(input.company),
    from: param(input.from),
    fromLabel: param(input.fromLabel),
    f: f && JSON.stringify(f) !== JSON.stringify(NO_PARTNER_FILTERS) ? f : undefined,
  };
}

export const Route = createFileRoute("/partners")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Partners · GovPreneurs" },
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

  // An explicit ?view= / ?tab= always wins. A company deep-link
  // (Awards -> winner -> drawer) always means "find".
  const openCompanyKey = s.company ? Number(s.company) : null;
  const hasCompanyDeepLink = openCompanyKey !== null && !Number.isNaN(openCompanyKey);

  // My partners opens first. Find partners is one tab to the right.
  // A search link with no view (?q=722310) opens Find partners, where the search shows.
  const view: View = s.view ?? (hasCompanyDeepLink || s.q ? "find" : "mine");

  // Production ranks partners from her NAICS codes (her trades); with none, the
  // API returns needsProfile (backend partners.controller.ts). States only narrow
  // the list. So the one thing we must have is her trade, from My Business.
  const { profile, loading: profileLoading } = useMemberState();
  // While the profile loads, treat it as ready so the gate never flashes.
  const profileReady = profileLoading || profile.trades.length > 0;

  const detailOpen = view === "find" && hasCompanyDeepLink;

  // The trail only makes sense when the member came from somewhere that is not here.
  const cameFromElsewhere = Boolean(s.from && s.fromLabel && !s.from.startsWith("/partners"));
  // With the detail panel open, a page-level link sits behind the overlay — visible
  // but unusable — so the trail moves inside the panel instead of rendering twice.
  const backTo = cameFromElsewhere ? s.from : undefined;

  // Presentation order only: My partners · Find partners.
  // Find partners places the tabs under its search bar; the other views show them here.
  const tabs = (
    <nav className="partners-tabs" role="tablist" aria-label="Partners views">
      <button
        type="button"
        role="tab"
        aria-selected={view === "mine"}
        className={`partners-tab${view === "mine" ? " is-active" : ""}`}
        onClick={() => patch({ view: "mine" })}
      >
        My partners
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "find"}
        className={`partners-tab${view === "find" ? " is-active" : ""}`}
        onClick={() => patch({ view: "find" })}
      >
        Find partners
      </button>
    </nav>
  );

  return (
    <div>
      <header style={{ marginBottom: "var(--s-4)" }}>
        <h1 className="t-display-lg">Partners</h1>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 720 }}>
          Companies winning the work you do — and how to reach them to team up.
        </p>
      </header>

      {cameFromElsewhere && !detailOpen && (
        <nav className="backnav" aria-label="Go back">
          <Link to={s.from!} className="backlink">
            ← Back to {s.fromLabel}
          </Link>
        </nav>
      )}

      {view !== "find" && tabs}

      {view === "find" && !profileReady && (
        <>
          {tabs}
          <div className="card card-padded pboard-empty">
            <h2 className="t-heading">Fill out your My Business page first</h2>
            <p className="t-body-sm">
              We find partners from the kind of work you do. Add it on My Business, and we can find
              the right partners for you.
            </p>
            <Link
              to="/business-profile"
              search={{ tab: "positioning" }}
              className="pstep-btn pboard-empty__btn"
            >
              Go to My Business
            </Link>
          </div>
        </>
      )}

      {view === "find" && profileReady && (
        <FindPartnersView
          openCompanyKey={detailOpen ? openCompanyKey : null}
          onOpenCompany={(awardeeKey) =>
            patch({ company: awardeeKey === null ? undefined : String(awardeeKey) })
          }
          backTo={backTo}
          backLabel={s.fromLabel}
          tabs={tabs}
          q={s.q}
          onSearch={(q) => patch({ q }, { replace: true })}
          filters={s.f ?? NO_PARTNER_FILTERS}
          onFiltersChange={(next) =>
            patch(
              { f: JSON.stringify(next) === JSON.stringify(NO_PARTNER_FILTERS) ? undefined : next },
              { replace: true },
            )
          }
        />
      )}

      {view === "mine" && (
        <MyPartnersView
          onSwitchToFind={() => patch({ view: "find" })}
          profileReady={profileReady}
        />
      )}
    </div>
  );
}
