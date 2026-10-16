// One forecast, in the Hunter opportunity card's shape (src/components/Hunter/
// OpportunityCard.tsx): Hunter's take in the top block, the buyer's facts in a fixed
// six-cell grid below. Same classes, so the two lists look like one product. Open cards
// carry no chips under the grid; the tabs already sort by timing. A forecast past its
// expected date carries the "Expected date passed" mark.
//
// Amber belongs to the top block only. The grid is what the buyer published; where a
// value is our reading instead, it carries an "Our read" tag (D-E5).
//
// The take line is Hunter's AI line when the list has one (`aiTake`, from
// POST /forecasts/takes), else the rule-built line the engine always gives. The
// rule-built line is there from the first paint, so no skeleton can stick. An AI
// line is labelled "Hunter's take", never "Why Hunter thinks this fits": it reads
// the fit on its own and can say the work does not fit, so the fit label could
// contradict it.
//
// The fit chip is the tier of her `matches` row (lib/forecasts/matchVerdict.ts). A
// card with no row, or no longer open, carries no chip. The engine still writes the
// take line, but its own fit makes no chip and no "fits" label: that would be a
// second scale beside the matching engine's.

import { Link } from "@tanstack/react-router";
import { Bookmark, Sparkles } from "lucide-react";
import { Card } from "../ui/Card";
import { GlossTerm } from "../ui/GlossTerm";
import { MoneyText, ExpectedDatePassedChip } from "./ForecastChips";
import { OurRead } from "./OurRead";
import { WatchMarker } from "./WatchMarker";
import { FIT_CHIP, GRID, KICKER, NOT_SHARED } from "../../lib/forecasts/copy";
import type { ScoredForecast } from "../../lib/forecasts/engine";
import { matchVerdict } from "../../lib/forecasts/matchVerdict";
import type { ForecastMatchRead } from "../../lib/forecastsApi";

export function ForecastCard({
  forecast: f,
  match = null,
  aiTake,
  tracked,
  onToggleTracked,
}: {
  forecast: ScoredForecast;
  /** Her `matches` row for this forecast. Null when the engine has none. */
  match?: ForecastMatchRead | null;
  /** Hunter's AI line for this forecast, when the server gave one. */
  aiTake?: string | null;
  tracked: boolean;
  onToggleTracked: (id: string) => void;
}) {
  const open = f.lifecycle === "open";
  const ai = aiTake?.trim() || null;
  const verdict = matchVerdict(match, open);
  const good = !ai && verdict === "bid";
  const federal = f.lane === "federal";

  return (
    <Card asChild variant="compact" interactive dense data-verdict={verdict ?? undefined}>
      <Link
        to="/forecasts/$forecastId"
        params={{ forecastId: f.id }}
        className={`ui-card--opp fc-card${tracked ? " is-saved" : ""}`}
        onClick={(e) => e.currentTarget.blur()}
      >
        <div className="opp-why-block">
          <div className="opp-why-head">
            <span className="opp-why-kicker">
              <Sparkles size={12} className="opp-why-kicker__ico" aria-hidden />
              {good ? KICKER.fits : KICKER.take}
            </span>
            {verdict && (
              <span className={`fc-chip fc-fit fc-fit--${verdict}`}>{FIT_CHIP[verdict]}</span>
            )}
          </div>
          <p className="opp-why-text">
            <MoneyText text={ai ?? f.facts.why} />
          </p>
        </div>

        <div className="opp-card-hr" aria-hidden />

        <div className="opp-summary-block">
          <div className="opp-summary-head">
            <h3 className="opp-title-compact fc-card__title">{f.facts.title}</h3>
            <div className="opp-meta-right">
              <span className={`scope-pill scope-pill--${federal ? "fed" : "sled"}`}>
                {federal ? "Fed" : "SLED"}
              </span>
              {tracked && <WatchMarker oppKey={f.id} />}
              <button
                type="button"
                className={`opp-bookmark${tracked ? " is-saved" : ""}`}
                aria-label={tracked ? "Stop tracking this forecast" : "Track this forecast"}
                aria-pressed={tracked}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleTracked(f.id);
                }}
              >
                <Bookmark size={18} fill={tracked ? "currentColor" : "none"} aria-hidden />
              </button>
            </div>
          </div>

          <dl className="opp-facts-grid">
            <div className="opp-facts-grid__cell">
              <dt className="opp-facts-grid__k">
                <GlossTerm term={GRID.buyer.label} gloss={GRID.buyer.gloss}>
                  {GRID.buyer.label}
                </GlossTerm>
                :
              </dt>
              <dd className="opp-facts-grid__v">{f.record.agencyName}</dd>
            </div>
            <div className="opp-facts-grid__cell">
              <dt className="opp-facts-grid__k">
                <GlossTerm term={GRID.value.label} gloss={GRID.value.gloss}>
                  {GRID.value.label}
                </GlossTerm>
                :
              </dt>
              <dd className="opp-facts-grid__v">
                {f.value ? (
                  <MoneyText text={f.value} />
                ) : (
                  <span className="opp-facts-grid__v-none">{NOT_SHARED}</span>
                )}
              </dd>
            </div>
            <div className="opp-facts-grid__cell">
              <dt className="opp-facts-grid__k">
                <GlossTerm term={GRID.place.label} gloss={GRID.place.gloss}>
                  {GRID.place.label}
                </GlossTerm>
                :
              </dt>
              <dd className="opp-facts-grid__v">
                {f.place.label ?? <span className="opp-facts-grid__v-none">{NOT_SHARED}</span>}
                {f.place.ourRead && <OurRead />}
              </dd>
            </div>
            <div className="opp-facts-grid__cell">
              <dt className="opp-facts-grid__k">
                <GlossTerm term={GRID.expected.label} gloss={GRID.expected.gloss}>
                  {GRID.expected.label}
                </GlossTerm>
                :
              </dt>
              <dd className="opp-facts-grid__v">
                {f.timing.label}
                {f.timing.ourRead && open && <OurRead />}
              </dd>
            </div>
            <div className="opp-facts-grid__cell">
              <dt className="opp-facts-grid__k">
                <GlossTerm term={GRID.whoMayBid.label} gloss={GRID.whoMayBid.gloss}>
                  {GRID.whoMayBid.label}
                </GlossTerm>
                :
              </dt>
              <dd className="opp-facts-grid__v">
                {f.whoMayBid.kind === "not_shared" || f.whoMayBid.kind === "local" ? (
                  <span className="opp-facts-grid__v-none">{f.whoMayBid.text}</span>
                ) : (
                  f.whoMayBid.text
                )}
              </dd>
            </div>
            {federal ? (
              <div className="opp-facts-grid__cell">
                <dt className="opp-facts-grid__k">
                  <GlossTerm term={GRID.boughtBefore.label} gloss={GRID.boughtBefore.gloss}>
                    {GRID.boughtBefore.label}
                  </GlossTerm>
                  :
                </dt>
                <dd className="opp-facts-grid__v">
                  {f.boughtBefore?.text === NOT_SHARED ? (
                    <span className="opp-facts-grid__v-none">{NOT_SHARED}</span>
                  ) : (
                    f.boughtBefore?.text
                  )}
                </dd>
              </div>
            ) : (
              <div className="opp-facts-grid__cell">
                <dt className="opp-facts-grid__k">
                  <GlossTerm term={GRID.foundIn.label} gloss={GRID.foundIn.gloss}>
                    {GRID.foundIn.label}
                  </GlossTerm>
                  :
                </dt>
                <dd className="opp-facts-grid__v">
                  {f.foundIn ?? <span className="opp-facts-grid__v-none">{NOT_SHARED}</span>}
                </dd>
              </div>
            )}
          </dl>

          {!open && (
            <div className="opp-summary-chips">
              <ExpectedDatePassedChip />
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
