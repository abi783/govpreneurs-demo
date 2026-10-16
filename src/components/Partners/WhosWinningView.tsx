import { useEffect, useState } from "react";
import { Handshake, MapPin } from "lucide-react";
import { fetchMarket, usd, type MarketEvent, type MarketSummary } from "../../lib/partnersApi";
import { SuccessCenterLink } from "./SuccessCenterLink";

/**
 * "Who's winning" — the market lens: how much money moved through the member's
 * lane last year, and the recent wins that made it up.
 *
 * Answers the question a member has BEFORE they can use a ranked partner list:
 * "is there money in what I do, near me, and who is taking it?" Awards owns the
 * contract record; this is the same records read as a market.
 *
 * WHAT IS DELIBERATELY NOT HERE. The reference design ends each card with a
 * subcontracting goal percentage and a cert-match claim ("your SDVOSB cert helps
 * them hit their 28% small-business goal"). Both are inventions of its mock data:
 *   • the goal percentage does not exist in the public record — the only related
 *     field is a plan TYPE, and estimating a percentage is banned outright;
 *   • nothing links "this prime wants this cert in a sub" — that is the
 *     accessibility signal the spec already omits for want of a research agent.
 * Rather than reword them into something vaguer but equally unfounded, they are
 * cut, and the line below is built from what the record does support.
 */
export function WhosWinningView({
  onOpenCompany,
  onSwitchToFind,
}: {
  onOpenCompany: (awardeeKey: number) => void;
  onSwitchToFind: () => void;
}) {
  const [market, setMarket] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMarket(ctrl.signal)
      .then(setMarket)
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load your market.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  if (loading) return <p className="awards-note">Looking at what sold in your area…</p>;

  if (error) {
    return (
      <div className="card card-padded">
        <p className="t-body-sm">{error}</p>
      </div>
    );
  }

  // Two different facts that both total to zero, so two different answers. "$0"
  // would read as a broken page for one and as a lie about a real market for the
  // other.
  if (market?.state === "no_trade") {
    return (
      <div className="card card-padded">
        <h2 className="t-heading">Tell us what you do</h2>
        <p className="t-body-sm">
          Once we know the kind of work you do, we can show you what the government bought near
          you last year — and who won it.
        </p>
        <SuccessCenterLink />
      </div>
    );
  }

  if (market?.state === "quiet_market" || market?.events.length === 0) {
    return (
      <div className="card card-padded">
        <h2 className="t-heading">Your area was quiet this year</h2>
        <p className="t-body-sm">
          We could not find jobs like yours bought near you in the last year. That happens in
          smaller trades — it does not mean there is no work, only that none of it showed up
          close by. Widening the states you work in usually helps.
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSwitchToFind}>
          See companies to team up with
        </button>
      </div>
    );
  }

  const m = market!;

  return (
    <div className="whos-winning">
      {/* Three short sentences, not one dense line with two middots. Same facts,
          nothing to parse. Totals are OBLIGATED dollars — money actually paid
          out — never the ceiling a contract could theoretically reach. */}
      <section className="market-strip" aria-label="Your market">
        <p className="market-strip__headline">
          Last year the government paid{" "}
          <span className="market-strip__num">{usd(m.totalAwardedUsd12mo)}</span> for work like
          yours near you.
        </p>
        <p className="market-strip__headline market-strip__headline--second">
          That was{" "}
          <span className="market-strip__num">
            {m.awardCount12mo.toLocaleString("en-US")}
          </span>{" "}
          {m.awardCount12mo === 1 ? "job" : "separate jobs"}. Most were around{" "}
          <span className="market-strip__num">{usd(m.medianAwardUsd)}</span>.
        </p>
        <p className="market-strip__sub">The money is real — here is who is taking it.</p>
      </section>

      <section className="whos-winning__feed" aria-label="Recent wins">
        {m.events.map((e) => (
          <EventCard key={e.awardId} event={e} onOpenCompany={onOpenCompany} />
        ))}
      </section>

      <p className="award-note">
        Based on contract awards published by the government. Dates are when the work started,
        which can be later than when the job was signed.
      </p>
    </div>
  );
}

/** One win. The company name opens the same panel every other surface opens. */
function EventCard({
  event,
  onOpenCompany,
}: {
  event: MarketEvent;
  onOpenCompany: (awardeeKey: number) => void;
}) {
  const where = [event.city, event.state].filter(Boolean).join(", ");
  // Bound once so the closure below carries a number, not a nullable field —
  // and so the name only becomes a button when there is somewhere to go.
  const key = event.winner.awardeeKey;
  return (
    <article className="ww-card">
      <div className="ww-card__head">
        {key !== null ? (
          <button type="button" className="ww-card__name" onClick={() => onOpenCompany(key)}>
            {event.winner.name}
          </button>
        ) : (
          <span className="ww-card__name ww-card__name--plain">{event.winner.name}</span>
        )}
      </div>

      <p className="ww-card__what">
        Won <b>{event.title}</b> for {event.agency}.
      </p>

      <div className="ww-card__facts">
        {/* Omitted rather than shown as "$0" or "—": an unreported dollar figure
            is not a zero-dollar job, and the other facts still stand without it. */}
        {event.obligated !== null && <span className="mono">{usd(event.obligated)}</span>}
        {ago(event.awardedAt) && <span>{ago(event.awardedAt)}</span>}
        {where && (
          <span>
            <MapPin size={12} aria-hidden /> {where}
          </span>
        )}
      </div>

      <div className="ww-card__why">
        <Handshake size={14} aria-hidden />
        <span>{whyThisMatters(event)}</span>
      </div>
    </article>
  );
}

/**
 * Why a member should care about this win — from the record only.
 *
 * Every branch is a fact we hold. No claim about what the prime wants in a sub,
 * and no comparison to the member's own ceiling: that field does not exist
 * anywhere in the product, so "too big for you" would be asserted, not known.
 */
function whyThisMatters(e: MarketEvent): string {
  const v = e.obligated;
  if (v !== null && v >= 5_000_000) {
    return "A job this size is rarely done by one company. That is where smaller firms get brought in.";
  }
  if (v !== null && v >= 500_000) {
    return "A job this size usually needs help from smaller firms. Worth knowing who they are.";
  }
  return "They buy work like yours in your area — worth knowing who wins it.";
}

/** "about 3 months ago". Null when we do not know — we never guess a date. */
function ago(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days < 0) return null;
  if (days < 45) return `about ${days} days ago`;
  if (days < 550) return `about ${Math.round(days / 30)} months ago`;
  return `about ${Math.round(days / 365)} years ago`;
}
