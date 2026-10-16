import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type MouseEvent } from "react";
import { Bookmark, BookmarkCheck, Clock3, RotateCcw } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { isEmbeddedInGhl, requestCrossPageNav } from "../lib/ghlNav";
import { AMIRA_FIRM } from "../demo/explore/firms";
import { useSavedAwards } from "../lib/useSavedAwards";
import {
  atLeastSubs,
  awardedAgo,
  collapseAwardMoney,
  competitionSummary,
  fetchAward,
  usd,
  whatHappensNext,
  whyThisAward,
  type AwardRecord,
} from "../lib/awardsApi";

interface DetailSearch {
  /** Absolute path to return to, INCLUDING its own search params. */
  from?: string;
  /** What the member reads after "← Back to". Specific: a company name, not "Partners". */
  fromLabel?: string;
}

/**
 * PRD back-trail contract: the label must be specific (a title), never the
 * generic "this award" a member can't tell apart from any other. Truncated so
 * the "← Back to …" trail never wraps to multiple lines.
 */
function backTrailLabel(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "this award";
  if (trimmed.length <= 40) return trimmed;
  return `${trimmed.slice(0, 39).trimEnd()}…`;
}

export const Route = createFileRoute("/awards/$awardId")({
  validateSearch: (input: Record<string, unknown>): DetailSearch => ({
    from: typeof input.from === "string" && input.from ? input.from : undefined,
    fromLabel: typeof input.fromLabel === "string" && input.fromLabel ? input.fromLabel : undefined,
  }),
  component: AwardDetailPage,
});

/**
 * One award, in full. The order answers the questions in the order they are asked:
 * what was bought · who won it and for how much · how much competition · do they
 * hire small firms · what happens next · where this comes from.
 *
 * Four things are deliberately absent because the data source cannot support them,
 * and inventing them would put a fabricated fact in front of a member: a contracting
 * officer by name, named losing bidders, "this prime is hiring subs now", and a
 * subcontracting goal percentage.
 */
function AwardDetailPage() {
  usePageMeta({});
  const { awardId } = Route.useParams();
  const s = Route.useSearch();
  const navigate = useNavigate();

  const [award, setAward] = useState<AwardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  // Same shelf the list uses, so a save here is already reflected there.
  const { isSaved, toggle } = useSavedAwards();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setMissing(false);
    fetchAward(awardId, ctrl.signal)
      .then(setAward)
      .catch(() => {
        if (!ctrl.signal.aborted) setMissing(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [awardId]);

  if (loading) return <p className="awards-note">Loading this award…</p>;

  if (missing || !award) {
    return (
      <div className="card card-padded">
        <h1 className="t-heading">That award is not in your market.</h1>
        <Link to="/awards" className="btn btn-primary btn-sm">
          Back to awards
        </Link>
      </div>
    );
  }

  const ago = awardedAgo(award);
  const happensNext = whatHappensNext(award);
  const collapsedMoney = collapseAwardMoney(award);
  const justAwarded = award.recency.justAwarded === true;
  const where = [award.location.city, award.location.state].filter(Boolean).join(", ");
  // DEMO: Amira won one of these awards herself. Her own company has no partner file to open.
  const isMine = award.winner.awardeeKey === AMIRA_FIRM.key;

  // Two ways back, because a member arrives with two different intents: they either
  // want the rest of the awards, or to carry on with what they were doing. Offering
  // only one strands the other.
  const cameFromElsewhere = Boolean(s.from && s.fromLabel && !s.from.startsWith("/awards"));

  // Partners is now a SEPARATE GHL custom-menu-link from Awards, and this app runs
  // inside a GHL iframe. A plain in-app nav here would only change the route inside
  // the CURRENT iframe — the sidebar would stay on "Awards" while Partners rendered
  // nested inside it. So when embedded we use the parent relay: requestCrossPageNav
  // posts a REQUEST_NAVIGATION intent to window.parent (whose custom JS maps the
  // "partners" page key to the Partners menu-link and navigates the TOP frame), and
  // stashes the in-app route in shared-origin localStorage. The Partners app then
  // boots and consumePendingNavIntent (__root.tsx) lands on that route. Standalone
  // (local dev, not iframed) the native <Link> navigation reaches it directly, so we
  // only intercept the click when embedded — preventDefault stops the in-iframe route
  // change, everything else (middle-click, ctrl-click, keyboard activation) is
  // untouched.
  const handleViewInPartners = (e: MouseEvent, awardeeKey: number) => {
    if (!isEmbeddedInGhl()) return;
    e.preventDefault();
    const route = `/partners?view=find&company=${awardeeKey}&from=${encodeURIComponent(
      `/awards/${awardId}`,
    )}&fromLabel=${encodeURIComponent(backTrailLabel(award.title))}`;
    requestCrossPageNav("partners", route);
  };

  return (
    <div className="award-detail">
      <nav className="backnav" aria-label="Go back">
        <Link to="/awards" className="backlink">
          ← All awards
        </Link>
        {cameFromElsewhere && (
          <button type="button" className="backlink" onClick={() => navigate({ to: s.from! })}>
            ← Back to {s.fromLabel}
          </button>
        )}
      </nav>

      <header className="award-detail__head">
        <p className="t-label">{award.agency.abbrev ?? award.agency.name} bought this</p>
        <h1 className="t-display-lg">{award.title}</h1>
        <p className="award-detail__sub">{[where, award.workType].filter(Boolean).join(" · ")}</p>
        <div className="award-detail__actions">
          {(justAwarded || award.recency.comingUpAgain) && (
            <span className={`award-flag${justAwarded ? " award-flag--hot" : ""}`}>
              {justAwarded ? (
                <>
                  <Clock3 size={12} aria-hidden /> Just awarded
                </>
              ) : (
                <>
                  <RotateCcw size={12} aria-hidden /> Up for bid again
                </>
              )}
            </span>
          )}
          {/* awards-prd §3: "Any award can be bookmarked from the list OR the detail
              page." The shelf shares one hook with the list, so a save here shows up
              there without a refetch, and the optimistic rollback comes for free. */}
          <button
            type="button"
            className={`btn btn-sm btn-secondary${isSaved(award.awardId) ? " is-on" : ""}`}
            aria-pressed={isSaved(award.awardId)}
            onClick={() => toggle(award.awardId, "from an award page")}
          >
            {isSaved(award.awardId) ? (
              <>
                <BookmarkCheck size={14} aria-hidden /> Saved
              </>
            ) : (
              <>
                <Bookmark size={14} aria-hidden /> Save this award
              </>
            )}
          </button>
        </div>
      </header>

      <p className="award-detail__why">{whyThisAward(award)}</p>

      <section className="award-block">
        <h2 className="award-block__h">Who won it, and for how much</h2>
        <div className="award-money">
          <b className="mono award-money__main">{usd(collapsedMoney ? collapsedMoney.figure : award.obligated)}</b>
          <span>
            {collapsedMoney
              ? collapsedMoney.explainNoGrowth
                ? "The government committed the full amount up front. This job has no room to grow."
                : "The amount actually paid out on this job."
              : award.ceiling && award.obligated && award.ceiling > award.obligated
                ? `Paid out so far, of a job that could reach ${usd(award.ceiling)}.`
                : "The amount actually paid out on this job."}
          </span>
        </div>
        {/* Three distinct figures the record carries, shown only when present
            (0/null are placeholders, not "$0", see awardsApi.usd) — unless they all
            agree, in which case one cell replaces them (see collapseAwardMoney). */}
        {collapsedMoney ? (
          <dl className="award-facts">
            <div>
              <dt>Worth</dt>
              <dd className="mono">{usd(collapsedMoney.figure)}</dd>
            </div>
          </dl>
        ) : (
          (award.obligated || award.currentValue || award.ceiling) && (
            <dl className="award-facts">
              {award.obligated ? (
                <div>
                  <dt>Paid out so far</dt>
                  <dd className="mono">{usd(award.obligated)}</dd>
                </div>
              ) : null}
              {award.currentValue ? (
                <div>
                  <dt>Current value</dt>
                  <dd className="mono">{usd(award.currentValue)}</dd>
                </div>
              ) : null}
              {award.ceiling ? (
                <div>
                  <dt>Could reach</dt>
                  <dd className="mono">{usd(award.ceiling)}</dd>
                </div>
              ) : null}
            </dl>
          )
        )}
        <dl className="award-facts">
          <div>
            <dt>Winner</dt>
            <dd>
              {/* An award's winner IS a company in Partners — but only when we hold
                  the join key. Without it the link would land on nothing.
                  `company` goes over as a NUMBER: TanStack JSON-stringifies search
                  values, so a string serialised as company=%2210113502%22 and the
                  Partners side parsed Number('"10113502"') → NaN, which silently
                  never opened the panel. A number serialises unquoted. */}
              {award.winner.awardeeKey !== null && !isMine ? (
                <Link
                  to="/partners"
                  search={
                    {
                      view: "find",
                      company: award.winner.awardeeKey,
                      from: `/awards/${award.awardId}`,
                      fromLabel: backTrailLabel(award.title),
                    } as never
                  }
                  className="award-winner-link"
                  onClick={(e) => handleViewInPartners(e, award.winner.awardeeKey!)}
                >
                  {award.winner.name}
                </Link>
              ) : isMine ? (
                `${award.winner.name} (you)`
              ) : (
                award.winner.name
              )}
            </dd>
          </div>
          {/* Omitted rather than shown as "unknown" — we claim nothing we can't back. */}
          {ago && (
            <div>
              <dt>Work started</dt>
              <dd>about {ago}</dd>
            </div>
          )}
          <div>
            <dt>Buyer</dt>
            <dd>{award.agency.name}</dd>
          </div>
          {where && (
            <div>
              <dt>Where</dt>
              <dd>{where}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* How many bid is public. WHO bid is not — losing bidders are not disclosed,
          so we give the count and say plainly that the names are not published.
          Fix #5: a low bid count reads as "small field" ONLY when the award was
          actually open to competition — a sole-source award gets its own honest
          sentence instead, and an unknown extentCompeted asserts neither. */}
      {award.offersReceived !== null && (
        <section className="award-block">
          <h2 className="award-block__h">How much competition there was</h2>
          <p className="t-body-sm">
            <b className="mono">{award.offersReceived}</b>{" "}
            {award.offersReceived === 1 ? "firm" : "firms"} bid this job.{" "}
            {competitionSummary(award)}
          </p>
          <p className="award-note">
            The number of bids is public. Who they were is not — the government does not publish
            losing bidders.
          </p>
        </section>
      )}

      <section className="award-block">
        <h2 className="award-block__h">Do they hire small firms?</h2>
        {award.bench ? (
          <>
            <p className="t-body-sm">
              {award.winner.name} has brought in {atLeastSubs(award.bench)} on work like this
              {award.bench.repeatSubs > 0
                ? `, and went back to ${award.bench.repeatSubs} of them more than once.`
                : "."}
            </p>
            {award.bench.sampleSubs.length > 0 && (
              <ul className="award-subs">
                {award.bench.sampleSubs.map((sub) => (
                  <li key={sub.name}>
                    <span className="award-subs__name">{sub.name}</span>
                    <span className="mono award-subs__vol">
                      {sub.awards} {sub.awards === 1 ? "job" : "jobs"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="t-body">We do not know.</p>
            <p className="t-body-sm">
              We cannot see any subcontracts on record for this job. That does not mean they do not
              hire small firms — only the biggest subcontracts get reported.
            </p>
          </>
        )}
        <p className="award-note">
          Counts come from public filings that only cover the largest subcontracts, so treat them as
          &ldquo;at least this many&rdquo;.
        </p>
      </section>

      {/* The fifth PRD section (awards-prd §3), and the one that tells a member what to
          DO. Everything above says what happened; this says whether to call today or
          prepare for a date. Suppressed entirely when we know neither the rebid date nor
          the award's age — an unknown timeline gets no advice rather than a guess. */}
      {happensNext && (
        <section className="award-block">
          <h2 className="award-block__h">What happens next</h2>
          <p className="t-body-sm">{happensNext}</p>
        </section>
      )}

      {/* No "who signed it" section: the contract schema has no officer name field,
          so any name here would be invented. */}

      <section className="award-block award-block--source">
        <h2 className="award-block__h">Where this comes from</h2>
        <p className="award-note">
          Award records are published by the government after the contract is signed.{" "}
          {award.recency.reportingLagNote}
        </p>
        {isMine ? (
          <p className="award-note">
            This is your own job. Ask the contracting officer for a performance rating (CPARS) so
            the next buyer can read it.
          </p>
        ) : (
          <p className="award-note">
            We cannot tell you who to call at {award.winner.name} — the government publishes
            company records, not people. Start at their website and ask for whoever handles
            subcontracting.
          </p>
        )}
        {award.sourceUrl && (
          <p className="award-note">
            <a href={award.sourceUrl} target="_blank" rel="noreferrer">
              See the public record for this award
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
