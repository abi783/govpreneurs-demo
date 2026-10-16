import { Bookmark, Info, Sparkles, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import type { CSSProperties, ReactNode } from "react";
import type { OppTab } from "./OpportunitiesTabs";
import type { CardOpportunity } from "../../lib/mock/opportunities";
import { Card } from "../ui/Card";
import { GlossTerm } from "../ui/GlossTerm";
import { JargonGloss } from "./JargonGloss";
import { CategoryPill } from "./CategoryPill";
import { termGloss } from "../../lib/filterGlosses";
import { dueDateLabel, setAsideDisplayLabel } from "../../lib/oppDisplay";
import { OPP_KEY_ATTR } from "../../lib/feedSnapshot";
import { crossPageClick } from "../../lib/ghlNav";
import { WatchMarker } from "../Forecast/WatchMarker";

const CELL_CLASS = "opp-facts-grid__cell";
const WIDE_CELL_CLASS = "opp-facts-grid__cell--wide";
const VALUE_CLASS = "opp-facts-grid__v";
const SOFT_DEADLINE_CLASS = "opp-deadline--soft";
const ITALIC_VALUE: CSSProperties = { fontStyle: "italic" };

// NaN IS NOT A NUMBER OF DAYS. `responseDeadline` is `''` when the opportunity
// carries no `dueDate` (the backend mapper writes `dueDate?.toISOString() ?? ''`),
// `daysUntil('')` is NaN, and every comparison against NaN is false — so the
// value fell through each branch and the member read "Closes in NaN days".
//
// A deadline we do not hold is an ABSENCE and says so. Deliberately "on file"
// rather than "the buyer gave none": a null `dueDate` tells us what our record
// holds, not what the notice said.
const NO_DEADLINE = "No deadline on file";

function deadlineText(days: number): string {
  if (!Number.isFinite(days)) return NO_DEADLINE;
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `Closes in ${days} days`;
}
function deadlineClass(days: number): string {
  // No date, no urgency — an unknown deadline must not read as a calm one that
  // was checked, nor borrow the red of a closed notice.
  if (!Number.isFinite(days)) return SOFT_DEADLINE_CLASS;
  if (days < 0) return "opp-deadline--closed";
  if (days <= 1) return "opp-deadline--critical";
  if (days <= 6) return "opp-deadline--urgent";
  return SOFT_DEADLINE_CLASS;
}
// In the summary grid a comfortable deadline reads like any other fact. The
// soft variant would grey it out against every other value's ink, so only real
// urgency — or a closed notice — earns a colour here.
function gridDeadlineClass(days: number): string {
  const cls = deadlineClass(days);
  return cls === SOFT_DEADLINE_CLASS ? "" : cls;
}
// Forecasts aren't open for bids — their date is an expected posting month, not
// a deadline, so it renders without any urgency color (PRD CAT-4).
function expectedPostText(closeAbs: string): string {
  const d = new Date(closeAbs);
  if (Number.isNaN(d.getTime())) return closeAbs;
  return `~${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}
function dibbsFacts(dibbs: NonNullable<CardOpportunity["dibbs"]>): string {
  return [
    dibbs.quantity != null ? `${dibbs.quantity.toLocaleString()} units` : null,
    dibbs.deliverDays != null ? `deliver in ${dibbs.deliverDays} days` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The placeholder for a fact the notice does not state. It keeps the cell in place. */
function NotStated() {
  return <span className="opp-facts-grid__v-none">Not stated</span>;
}

/** One key/value cell of the summary facts grid. The label is also its gloss key. */
function FactCell({
  label,
  children,
  wide = false,
  valueClass = "",
  valueTitle,
  valueStyle,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  valueClass?: string;
  valueTitle?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div className={wide ? `${CELL_CLASS} ${WIDE_CELL_CLASS}` : CELL_CLASS}>
      <dt className="opp-facts-grid__k">
        <GlossTerm term={label}>{label}</GlossTerm>:
      </dt>
      <dd
        className={valueClass ? `${VALUE_CLASS} ${valueClass}` : VALUE_CLASS}
        title={valueTitle}
        style={valueStyle}
      >
        {children}
      </dd>
    </div>
  );
}

/** The date cell: an expected posting month for a forecast, else the deadline. */
function DateCell({ opp }: { opp: CardOpportunity }) {
  if (opp.category === "forecast") {
    return (
      <FactCell label="Expected posting" valueTitle={opp.closeDateAbsolute}>
        {expectedPostText(opp.closeDateAbsolute)}
      </FactCell>
    );
  }
  return (
    <FactCell
      label={dueDateLabel(opp.noticeType)}
      valueClass={gridDeadlineClass(opp.daysUntilClose)}
      valueTitle={opp.closeDateAbsolute}
    >
      {deadlineText(opp.daysUntilClose)}
    </FactCell>
  );
}

// Six facts, two columns, three rows. A fixed grid rather than a wrapping run of
// pairs, so a given fact sits in the same place on every card. Every cell
// renders, even when the notice states no value, because a missing cell would
// shift the five others.
function FactsGrid({ opp }: { opp: CardOpportunity }) {
  // Scope is the NAICS taxonomy description, resolved per rendered page by
  // lib/useNaicsDescriptions.ts. Until it resolves, and when it never does, the
  // cell shows the bare code — never a label the taxonomy did not supply.
  const scope = opp.naicsDescription ?? opp.naicsCode;
  const order = opp.category === "product_buy" && opp.dibbs ? dibbsFacts(opp.dibbs) : "";

  return (
    <dl className="opp-facts-grid">
      <FactCell label="Agency">
        {opp.agencyAbbrev}
        {opp.subAgency ? ` · ${opp.subAgency}` : ""}
      </FactCell>
      <FactCell
        label="Estimated Contract Value"
        valueStyle={opp.valueIsEstimate ? ITALIC_VALUE : undefined}
      >
        {opp.value}
      </FactCell>
      <FactCell label="Place of Performance">{opp.location}</FactCell>
      <DateCell opp={opp} />
      <FactCell label="Notice type">{opp.noticeType ?? <NotStated />}</FactCell>
      <FactCell label="Scope">{scope ?? <NotStated />}</FactCell>
      {/* A product buy carries an order line the six fixed facts cannot hold.
          It spans both columns instead of being dropped. */}
      {order ? (
        <FactCell label="Order" wide>
          {order}
        </FactCell>
      ) : null}
    </dl>
  );
}

export function OpportunityCard({
  opp,
  saved,
  onToggleSaved,
  hideHuntersTake = false,
  feedTab,
}: {
  opp: CardOpportunity;
  saved: boolean;
  onToggleSaved: (id: string) => void;
  hideHuntersTake?: boolean;
  /** The feed tab this card was listed under. The tab lives in component state,
   *  not the URL, so this is the only record of which tab an open came from.
   *  Required, so a new render site has to say which tab it lists. */
  feedTab: OppTab;
}) {
  const posthog = usePostHog();
  const closed = opp.closed || opp.daysUntilClose < 0;
  const cls = ["ui-card--opp", saved ? "is-saved" : "", closed ? "is-closed" : ""]
    .filter(Boolean)
    .join(" ");
  const summaryBlockClass = hideHuntersTake
    ? "opp-summary-block opp-summary-block--flush"
    : "opp-summary-block";

  // The card carries OPP_KEY_ATTR so feed scroll restoration can find this row
  // again when the member comes back (lib/feedSnapshot.ts). It is a functional
  // anchor, not a test hook — spread from the constant so the two cannot drift.
  return (
    <Card asChild variant="compact" interactive dense>
      <Link
        {...(opp.category === "forecast"
          ? ({ to: "/forecasts/$forecastId", params: { forecastId: opp.id } } as const)
          : ({ to: "/opportunities/$noticeId", params: { noticeId: opp.id } } as const))}
        className={cls}
        {...{ [OPP_KEY_ATTR]: opp.id }}
        onClick={(e) => {
          // A forecast opens on the Forecasts page, its own GHL menu link.
          crossPageClick(
            opp.category === "forecast" ? `/forecasts/${opp.id}` : `/opportunities/${opp.id}`,
          )(e);
          console.log("Open detail:", opp.id);
          // The detail page's URL is the same from every tab, so the pageview
          // cannot say where the open came from. This event does.
          // `solicitation_id` is the name ai_summary_rated already gives this
          // same id, so the two events join in PostHog without a mapping.
          // `source` names the surface, as the ai_summary and hunter_chat
          // events do. Only the feed emits this event today. Another surface
          // that opens an opportunity sends the same event with its own source.
          posthog?.capture("opportunity_opened", {
            solicitation_id: opp.id,
            feed_tab: feedTab,
            source: "opportunity_feed",
          });
        }}
      >
        {/* TOP BLOCK — why it fits */}
        {!hideHuntersTake && (
          <div className="opp-why-block">
            <div className="opp-why-head">
              <span className="opp-why-kicker">
                <Sparkles size={12} className="opp-why-kicker__ico" />
                Why Hunter thinks this fits
              </span>
            </div>
            {opp.hunterReasoning ? (
              <p className="opp-why-text">{opp.hunterReasoning}</p>
            ) : (
              <div className="opp-why-skeleton" aria-label="Hunter's take loading">
                <div className="opp-why-skeleton__line" />
                <div className="opp-why-skeleton__line" />
                <div className="opp-why-skeleton__line" />
              </div>
            )}
          </div>
        )}

        {/* Divider — only when a take sits above it. On Explore and Saved the
            take is hidden, and a rule on it would leave an orphan line across
            the top of the card. */}
        {!hideHuntersTake && <div className="opp-card-hr" aria-hidden />}

        {/* BOTTOM BLOCK — Opportunity summary (facts). With the take hidden this
            block is the whole card, so its top edge carries its own modifier. */}
        <div className={summaryBlockClass}>
          {/* No "Opportunity summary" kicker. The divider above and the title
              itself already mark where Hunter's take ends and the facts begin.
              On Explore and Saved the take is hidden, so this title is the first
              line the member reads. */}
          <div className="opp-summary-head">
            <h3 className="opp-title-compact">{opp.geminiPlainEnglishTitle || opp.title}</h3>
            <div className="opp-meta-right">
              <span
                className={`scope-pill scope-pill--${opp.scope}`}
                title={opp.scope === "fed" ? "Federal" : "State, Local & Education"}
              >
                {opp.scope === "fed" ? "Fed" : "SLED"}
              </span>
              {/* The set-aside rides beside the scope pill in the same box
                  shape. The feed sends a code, so `GlossTerm` carries the
                  definition on hover, focus AND tap — the acronym must not be
                  recoverable by hover alone. `glossFor` keys on the raw value,
                  so the term stays raw and only the TEXT is normalised. */}
              {opp.setAside && (
                <GlossTerm term={opp.setAside} className="scope-pill scope-pill--setaside">
                  {setAsideDisplayLabel(opp.setAside)}
                </GlossTerm>
              )}
              <CategoryPill category={opp.category} />
              {/* A saved forecast is a tracked one: its unseen changes show here. */}
              {saved && opp.category === "forecast" && <WatchMarker oppKey={opp.id} />}
              <button
                type="button"
                className={`opp-bookmark${saved ? " is-saved" : ""}`}
                aria-label={saved ? "Remove from saved" : "Save opportunity"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSaved(opp.id);
                }}
              >
                <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          <FactsGrid opp={opp} />

          {/* Status chips are judgements about the member, not facts about the
              notice, so they sit under the grid instead of competing inside it.
              The container always renders; `:empty` collapses it when no chip
              applies, so the take-free tabs get no phantom gap. */}
          <div className="opp-summary-chips">
            {opp.dibbs?.fastAward && (
              <JargonGloss gloss={termGloss("fastAward")!} inline>
                <span className="fast-award-chip">
                  <Zap size={11} aria-hidden /> Fast award
                </span>
              </JargonGloss>
            )}
            {!hideHuntersTake && opp.eligibilityFlag === "needs-cert" && (
              <span className="opp-elig opp-elig--cert">Need to certify</span>
            )}
            {!hideHuntersTake && opp.prereqGated && (
              <span
                className="opp-prereq-chip"
                title="Some prerequisites need to be cleared before you can bid"
              >
                <Info size={11} /> Prereq needed
              </span>
            )}
            {opp.isUpdated && opp.amendedRelative && (
              <span className="opp-updated">Updated {opp.amendedRelative}</span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
