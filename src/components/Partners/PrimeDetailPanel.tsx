// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { isEmbeddedInGhl, requestCrossPageNav } from "../../lib/ghlNav";
import {
  atLeastSubs,
  usd,
  VERDICT_LABEL,
  whereTheyWork,
  type PrimeCandidate,
} from "../../lib/partnersApi";
// DEMO: what the member already shares with the partner she knows (D85).
import { byMember } from "@/demo/member";
const KNOWN_CONTACT_HOOK = byMember({ caterer: "the work you did together in 2024", agency: "his note to you about the VA campaign" });

/**
 * One company, in full — the detail behind a ranked card.
 *
 * Renders as an overlay drawer (the PRD's "company drawer"), sliding in over the
 * page rather than beside it — Radix Dialog gives us Escape-to-close, a focus
 * trap and focus-return-to-trigger for free, the same pattern MobileNavDrawer
 * uses. The body scrolls independently of the header/footer so long content
 * (many reasons, a long flag list) is always reachable.
 *
 * Answers the questions in the order a member asks them: why is this company in
 * front of me · do they hire small firms · what do they win · how do I reach them.
 *
 * FOUR THINGS ARE DELIBERATELY ABSENT, because the data source cannot support them
 * and inventing them would put a fabricated fact in front of a member: a named
 * contact at the company, a subcontracting goal percentage, whether they are
 * "hiring subs now", and any numeric fit score.
 */
export function PrimeDetailPanel({
  partner,
  saved,
  onToggleSaved,
  onClose,
  backTo,
  backLabel,
  gateFailureReasons,
}: {
  partner: PrimeCandidate;
  saved: boolean;
  onToggleSaved: (partner: PrimeCandidate) => void;
  onClose: () => void;
  /** The trail lives HERE, not on the page: this panel covers the page behind it,
   *  so a page-level back link would be visible but unclickable. */
  backTo?: string;
  backLabel?: string;
  /**
   * One plain-English line per failed gate — for a company opened by its award
   * (not from the ranked feed) that did not clear every gate. Undefined/empty
   * for a normal in-feed candidate, which failed nothing.
   */
  gateFailureReasons?: string[];
}) {
  // Item 13: when the drawer was opened by clicking a card (no backTo), the
  // Awards trail defaulted to nothing. Fall back to the drawer's own URL — same
  // shape MyPartnersView's company link builds — so Awards always has a way back.
  const awardsFrom = backTo ?? `/partners?view=find&company=${partner.awardeeKey}`;
  const awardsFromLabel = backLabel ?? partner.name;

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="prime-detail-overlay" />
        <Dialog.Content className="prime-detail" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{`About ${partner.name}`}</Dialog.Title>
          {backTo && backLabel && (
            <nav className="backnav" aria-label="Go back">
              <Link to={backTo} className="backlink">
                ← Back to {backLabel}
              </Link>
            </nav>
          )}

          <div className="prime-detail__head">
            <div>
              <h2 className="t-heading">{partner.name}</h2>
              <p className="prime-detail__verdict">{VERDICT_LABEL[partner.verdict]}</p>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="prime-detail__close" aria-label="Close">
                <X size={16} aria-hidden />
              </button>
            </Dialog.Close>
          </div>
          <div className="prime-detail__scroll">
            {/* A company opened from an award it won, not from the ranked feed — it did
          not clear every gate. One plain sentence per failed gate, ahead of the
          reasons, so the member reads a real fact instead of a guessed one. */}
            {gateFailureReasons && gateFailureReasons.length > 0 && (
              <section className="prime-detail__block">
                <h3 className="prime-detail__h">Why they&rsquo;re not one of your matches</h3>
                <ul className="prime-card__reasons">
                  {gateFailureReasons.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* The reasons ARE the explanation — no score is shown, ever. D10: why
          recommended, why now, why better than the next one. */}
            <section className="prime-detail__block">
              <h3 className="prime-detail__h">Why this company?</h3>
              {/* The card shows the first three. The panel shows every one — this is the
            page a member opens when three was not enough. */}
              <ul className="prime-card__reasons">
                {partner.reasons.map((r) => (
                  <li key={r.signal}>{r.text}</li>
                ))}
              </ul>
              {/* D10 — the comparative sentence: the largest scoreBreakdown delta vs. the
            next-ranked company, in plain English. Null for the last company. */}
              {partner.whyAboveNext && (
                <p className="prime-detail__compare">{partner.whyAboveNext}</p>
              )}
              {partner.reasons.length > 0 && (
                <details className="prime-detail__why">
                  <summary>Why this order?</summary>
                  {/* Evidence, not a score. A bare number tells a member nothing and
                invites them to argue with it instead of reading the reason. */}
                  <ul className="prime-detail__why-list">
                    {partner.reasons.map((r) => (
                      <li key={r.signal}>
                        <b>{r.text}</b>
                        <span>{r.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            <section className="prime-detail__block">
              <h3 className="prime-detail__h">Do they hire small firms?</h3>
              {/* DEMO: a company with no subcontracts on record says so, not "at least 0 firms". */}
              {partner.bench.distinctSubs === 0 ? (
                <p className="t-body-sm">We have no record of them hiring outside firms.</p>
              ) : (
                <p className="t-body-sm">
                  They have brought in {atLeastSubs(partner.bench)} on work like this
                  {partner.bench.repeatSubs > 0
                    ? `, and went back to ${partner.bench.repeatSubs} of them more than once.`
                    : "."}
                </p>
              )}
              <p className="award-note">
                Counts come from public filings that only cover the largest subcontracts, so treat
                them as &ldquo;at least this many&rdquo;.
              </p>
            </section>

            <section className="prime-detail__block">
              <h3 className="prime-detail__h">What they win</h3>
              <dl className="award-facts">
                <div>
                  <dt>Jobs on record</dt>
                  <dd>{partner.economics.awardCount}</dd>
                </div>
                <div>
                  <dt>Biggest job</dt>
                  <dd className="mono">{usd(partner.economics.maxAwardUsd)}</dd>
                </div>
                <div>
                  <dt>Where they work</dt>
                  <dd>{whereTheyWork(partner)}</dd>
                </div>
                {partner.economics.recompeteMonthsOut !== null && (
                  <div>
                    <dt>Next job ending</dt>
                    {/* Never "about 0 months" — a stored 0 (ranked before the backend
                  stopped rounding down) reads as broken, not as urgent. */}
                    <dd>
                      {partner.economics.recompeteMonthsOut <= 1
                        ? "within a month"
                        : `about ${partner.economics.recompeteMonthsOut} months`}
                    </dd>
                  </div>
                )}
              </dl>
              {/* Awards search matches on the winner's name, so this lands on their record.
            Awards is now a SEPARATE GHL custom-menu-link from Partners, and this app
            runs inside a GHL iframe. A plain in-app nav here would only change the
            route inside the CURRENT iframe — the sidebar would stay on "Partners"
            while Awards rendered nested inside it. So when embedded we use the parent
            relay: requestCrossPageNav posts a REQUEST_NAVIGATION intent to
            window.parent (whose custom JS maps the "awards" page key to the Awards
            menu-link and navigates the TOP frame), and stashes the in-app route in
            shared-origin localStorage. The Awards app then boots and
            consumePendingNavIntent (__root.tsx) lands on that route. Standalone
            (local dev, not iframed) the native <Link> navigation reaches it directly,
            so we only intercept the click when embedded. */}
              <Link
                to="/awards"
                search={{ q: partner.name, from: awardsFrom, fromLabel: awardsFromLabel } as never}
                className="prime-detail__awards-link"
                onClick={(e) => {
                  if (!isEmbeddedInGhl()) return;
                  e.preventDefault();
                  const params = new URLSearchParams({
                    q: partner.name,
                    from: awardsFrom,
                    fromLabel: awardsFromLabel,
                  });
                  requestCrossPageNav("awards", `/awards?${params.toString()}`);
                }}
              >
                See every award they&rsquo;ve won →
              </Link>
            </section>

            {partner.flags.length > 0 && (
              <section className="prime-detail__block">
                <h3 className="prime-detail__h">Worth knowing</h3>
                <ul className="prime-card__flags">
                  {partner.flags.map((f) => (
                    <li key={f.id}>{f.text}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="prime-detail__block">
              <h3 className="prime-detail__h">How to reach them</h3>
              {/* We cannot name a person: the government publishes company records, not
            people, and a plausible-looking name would be invented. */}
              {/* DEMO: Amira already knows a person at Carolina Dining Group (a "your_contact" flag). */}
              {partner.flags.some((f) => f.id === "your_contact") ? (
                <p className="t-body-sm">
                  You already know someone here. Start with the person named under &ldquo;Worth
                  knowing&rdquo; and mention {KNOWN_CONTACT_HOOK}.
                </p>
              ) : (
                <p className="t-body-sm">
                  We cannot tell you who to call — the government publishes company records, not
                  people. Start at their website and ask for whoever handles subcontracting.
                </p>
              )}
              {partner.website && (
                <p className="t-body-sm">
                  <a
                    href={
                      partner.website.startsWith("http")
                        ? partner.website
                        : `https://${partner.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {partner.website}
                  </a>
                </p>
              )}
            </section>

            <button
              type="button"
              className={`btn btn-sm ${saved ? "btn-secondary" : "btn-primary"}`}
              onClick={() => onToggleSaved(partner)}
            >
              {saved ? "Remove from my partners" : "Save to my partners"}
            </button>

            <p className="award-note">Based on contract awards published by the government.</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
