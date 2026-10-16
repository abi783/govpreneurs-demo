// The ranked shortlist — the `MatchesPayload` artifact on the stage.
//
// Moved here from the chat thread with its class names intact, so no CSS rule
// changes. `MatchesPayload` carries no score and no total on purpose: the
// backend keeps those for the model's own reasoning and never surfaces a raw
// score to the UI, so this card shows a tier chip and the server's own reasons
// and nothing it computed itself.

import { Link } from "@tanstack/react-router";
import type { MatchesPayload, MatchesTier } from "../../../lib/hunterChat";
import { formatDateAbsolute } from "../../../lib/format";
import { lookupOwn } from "../../../lib/lookup";
import { boundedList, MAX_MATCH_ROWS } from "../../../lib/renderLimits";
import { isForecastSource } from "../../../lib/forecasts/sourceType";
import { crossPageClick } from "../../../lib/ghlNav";

/** Chat's match-tier vocabulary. NOT the feed's retired Bid / Review verdict. */
const MATCHES_TIER_LABEL: Record<MatchesTier, string> = {
  priority: "Priority",
  strong: "Strong",
  stretch: "Stretch",
  low: "Low",
};

/** A tier the union does not name still gets a chip — an unlabelled match reads
 *  as an ordinary one, which is worse than an honestly vague one. */
const UNKNOWN_TIER_LABEL = "Match";

/** Renders the ranked best-matches shortlist on the stage. */
export function MatchesArtifact({ payload }: { payload: MatchesPayload }) {
  // Everything here is server-supplied and was once read as if it were
  // well-formed: `data: {}` from the same model that produces a valid payload
  // made `rows.map` throw, and a row with no `matchReasons` made `.length`
  // throw — either one took the whole feed route with it.
  const { shown, hidden } = boundedList(payload?.rows ?? [], MAX_MATCH_ROWS);
  // NO ROWS, NO CARD. A malformed or empty payload used to render the shell
  // anyway: an empty bordered box on the stage, which reads as "here is your
  // shortlist" and then shows nothing. The absence belongs in Hunter's reply,
  // which already carries it — not in a card that states it by being blank.
  if (shown.length === 0) return null;
  return (
    <div className="hunter-matches">
      <div className="hunter-matches__rows">
        {shown.map((row) => {
          const due = formatDateAbsolute(row.dueDate);
          // A forecast opens on the forecast page, and its date is only expected.
          const forecast = isForecastSource(row.sourceType);
          const target = forecast
            ? ({ to: "/forecasts/$forecastId", params: { forecastId: row.oppKey } } as const)
            : ({ to: "/opportunities/$noticeId", params: { noticeId: row.oppKey } } as const);
          // Hunter runs on the feed and on /forecasts, two GHL pages. A row for
          // the other page relays through the parent when embedded.
          const route = forecast ? `/forecasts/${row.oppKey}` : `/opportunities/${row.oppKey}`;
          return (
            <Link
              key={row.oppKey}
              {...target}
              className="hunter-matches__row"
              onClick={crossPageClick(route)}
            >
              <div className="hunter-matches__row-top">
                <span className={`hunter-matches__tier hunter-matches__tier--${row.tier}`}>
                  {lookupOwn(MATCHES_TIER_LABEL, row.tier) ?? UNKNOWN_TIER_LABEL}
                </span>
                <span className="hunter-matches__row-title">{row.title}</span>
              </div>
              {(row.matchReasons?.length ?? 0) > 0 && (
                <ul className="hunter-matches__reasons">
                  {row.matchReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              {(row.agency || due) && (
                <div className="hunter-matches__meta">
                  {row.agency && <span>{row.agency}</span>}
                  {row.agency && due && <span aria-hidden> · </span>}
                  {due && <span>{forecast ? `Expected ${due}` : `Due ${due}`}</span>}
                </div>
              )}
            </Link>
          );
        })}
        {hidden > 0 && <div className="hunter-matches__more">and {hidden} more not shown</div>}
      </div>
    </div>
  );
}
