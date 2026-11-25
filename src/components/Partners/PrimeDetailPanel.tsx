import type { ReactNode } from "react";
import { highlight, makeHighlighter } from "../Search/Highlight";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bookmark, BookmarkCheck, ChevronDown, X } from "lucide-react";
import { usd, type PrimeCandidate } from "../../lib/partnersApi";
import { dateWords, titleCaseWords } from "../../lib/format";
import { stateName } from "../../lib/vocab/usStates";
import { plainDescription, plainNaics, plainPsc } from "../../lib/vocab/plainCodes";
import { CERT_CHOICES, certIds } from "../../lib/filters/smallBusinessPrograms";
// DEMO: what the member already shares with the partner she knows (D85).
import { byMember, own } from "@/demo/member";

const copy = own(
  import.meta.glob<typeof import("../../demo/members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);
const KNOWN_CONTACT_HOOK = byMember({ caterer: "the work you did together in 2024", pack: copy.KNOWN_CONTACT_HOOK });

/**
 * One company, in full: the detail behind a ranked card.
 *
 * The panel is a centred dialog over a dimmed page. Radix Dialog supplies the
 * focus trap, Escape-to-close and focus return. The header and the footer stay
 * fixed. The body scrolls. On a phone, the dialog fills the screen.
 *
 * The key facts are always open: the numbers, why this company, and how to reach
 * them. Every other list is in a section that opens on a tap, so the window does
 * not start as a wall of data. While she searches, each section that holds a match
 * opens by itself, so a match is never hidden.
 *
 * Each fact appears one time only. The data holds no email, no phone number, no
 * subcontracting goal and no fit score, so the dialog does not show them.
 */

type Hl = ((text: string) => ReactNode) | null;

/** The SAM size band in plain words. Null when SAM does not say. */
function sizeWords(band: string | null | undefined): string | null {
  switch (band) {
    case "<500":
      return "Fewer than 500 employees";
    case "501-750":
      return "501 to 750 employees";
    case "751-1000":
      return "751 to 1,000 employees";
    case "1001-1500":
      return "1,001 to 1,500 employees";
    case ">1500":
      return "More than 1,500 employees";
    default:
      return null;
  }
}

/** "$94K": the short money words that the facts use. */
const short = (n: number | null | undefined) => (n ? usd(n) : null);

/** A section that opens on a tap. `open` is the first state; she can always change it. */
function Fold({
  title,
  count,
  open,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <details className="pdm-fold" open={open}>
      <summary className="pdm-fold__sum">
        <span className="pdm-fold__title">{title}</span>
        {count !== undefined && <span className="pdm-fold__count mono">{count}</span>}
        <ChevronDown size={18} className="pdm-fold__chev" aria-hidden />
      </summary>
      <div className="pdm-fold__body">{children}</div>
    </details>
  );
}

export function PrimeDetailPanel({
  partner,
  saved,
  onToggleSaved,
  onClose,
  backTo,
  backLabel,
  gateFailureReasons,
  q,
}: {
  /** The search text, so the words that matched stand out here too. */
  q?: string;
  partner: PrimeCandidate;
  saved: boolean;
  onToggleSaved: (partner: PrimeCandidate) => void;
  onClose: () => void;
  /** The dialog covers the page, so the back link lives here, not on the page. */
  backTo?: string;
  backLabel?: string;
  /**
   * One plain-English line per failed gate. This applies to a company that the
   * member opened from an award, not from the ranked feed. Empty or undefined
   * for a normal match.
   */
  gateFailureReasons?: string[];
}) {
  const hl: Hl = makeHighlighter(q);
  /** True when the search marks a word in one of these texts. The highlighter returns the
   *  text unchanged when nothing matches. */
  const hit = (...texts: (string | null | undefined)[]) =>
    hl !== null && texts.some((t) => t && typeof hl(t) !== "string");

  // If a card opened the dialog (no backTo), the Awards page links back to
  // this dialog's own URL.
  const awardsFrom = backTo ?? `/partners?view=find&company=${partner.awardeeKey}`;
  const awardsFromLabel = backLabel ?? partner.name;

  const website = partner.website
    ? partner.website.startsWith("http")
      ? partner.website
      : `https://${partner.website}`
    : null;

  const monthsOut = partner.economics.recompeteMonthsOut;
  const saveLabel = saved
    ? "Remove this company from My partners"
    : "Save this company to My partners";

  const hq = partner.headquarters;
  const office = hq?.city
    ? `${hq.city}, ${hq.state ?? ""}`.replace(/, $/, "")
    : hq?.state
      ? stateName(hq.state)
      : partner.geography.hqState
        ? stateName(partner.geography.hqState)
        : null;
  const size = sizeWords(partner.employeeBand);
  const headLine = [office ? `Main office: ${office}` : null, size].filter(Boolean).join(" · ");

  const expires = partner.registrationExpiresAt ? new Date(partner.registrationExpiresAt) : null;
  const expired = expires !== null && Date.now() > expires.getTime();
  const contact = partner.samContact;

  // Every list shows in full inside its section. Nothing is cut to keep it short.
  const workTypes = (partner.workTypes ?? []).filter((w) => w.name.trim());
  const trades = [...(partner.tradesHired ?? [])]
    .filter((t) => t.name.trim() && t.firms > 0)
    .sort((a, b) => b.firms - a.firms);
  // The firm list gives the official trade name. The trade list knows its code.
  const codeOfTrade = new Map(trades.map((t) => [t.name.toLowerCase(), t.naics]));
  const tradeWords = (name: string | null) =>
    name ? plainNaics(codeOfTrade.get(name.toLowerCase()), name) : null;
  const jobs = partner.recentJobs ?? [];
  const subs = partner.subsHired ?? [];
  const vehicles = partner.vehicles ?? [];
  const buyers = partner.buyers ?? [];
  const cities = partner.geography.topCitiesByCount;
  const states = partner.geography.statesPerformed.map(stateName);
  // SAM lists business types. Only the certifications show, each one time, in plain words.
  const certs = certIds(partner.certifications).map((id) => CERT_CHOICES.find((c) => c.id === id)!);
  // The certifications that the SBA checked. The rest the company only claims.
  const checked = new Set(certIds(partner.sbaCertified));

  type Detail = { label: string; term?: string; value: string; mono?: boolean };
  // The main office and the size are in the header, so they are not repeated here.
  const details = (
    [
      partner.parent ? { label: "Part of", value: partner.parent.name } : null,
      expires
        ? {
            label: "Registered with SAM",
            value: `${expired ? "Ended" : "Until"} ${dateWords(partner.registrationExpiresAt) ?? ""}`,
          }
        : null,
      partner.runsMentorProgram
        ? {
            label: "Mentor program",
            term: "SBA mentor-protégé program",
            value: "They mentor small firms",
          }
        : null,
      partner.uei ? { label: "Company ID", term: "UEI", value: partner.uei, mono: true } : null,
      partner.cageCode ? { label: "CAGE code", value: partner.cageCode, mono: true } : null,
    ] as (Detail | null)[]
  ).filter((d): d is Detail => d !== null);

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="pdm-overlay" />
        <Dialog.Content className="pdm" aria-describedby={undefined}>
          <header className="pdm-head">
            <div className="pdm-head__text">
              {backTo && backLabel && (
                <nav aria-label="Go back">
                  <Link to={backTo} className="pdm-back">
                    ← Back to {backLabel}
                  </Link>
                </nav>
              )}
              <Dialog.Title className="pdm-title">{highlight(hl, partner.name)}</Dialog.Title>
              {headLine && <p className="pdm-sub">{highlight(hl, headLine)}</p>}
            </div>
            <Dialog.Close asChild>
              <button type="button" className="pdm-close" aria-label="Close">
                <X size={18} aria-hidden />
              </button>
            </Dialog.Close>
          </header>

          <div className="pdm-body">
            <div className="pdm-body__inner">
              {gateFailureReasons && gateFailureReasons.length > 0 && (
                <section className="pdm-section pdm-notice">
                  <h3 className="pdm-h">Why they are not one of your matches</h3>
                  <ul className="pdm-list">
                    {gateFailureReasons.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </section>
              )}

              {expired && (
                <p className="pdm-warn" role="note">
                  <AlertTriangle size={16} aria-hidden />
                  <span>
                    Their SAM registration ended on {dateWords(partner.registrationExpiresAt)}.
                    Check that they still sell to the government before you contact them.
                  </span>
                </p>
              )}

              <section className="pdm-section" aria-label="Key facts">
                <dl className="pdm-facts">
                  <div className="pdm-fact">
                    <dt>Jobs on record*</dt>
                    <dd className="pdm-num">{partner.economics.awardCount}</dd>
                  </div>
                  <div className="pdm-fact">
                    <dt>Total won*</dt>
                    <dd className="pdm-num">{usd(partner.economics.totalAwardedUsd)}</dd>
                  </div>
                  <div className="pdm-fact">
                    <dt>Biggest job*</dt>
                    <dd className="pdm-num">{usd(partner.economics.maxAwardUsd)}</dd>
                  </div>
                  {monthsOut !== null && (
                    <div className="pdm-fact">
                      <dt>Next job ends</dt>
                      <dd>
                        {monthsOut <= 1
                          ? "Within a month"
                          : monthsOut <= 12
                            ? `In about ${monthsOut} months`
                            : // More than a year away: the month and year read better than "59 months".
                              new Date(Date.now() + monthsOut * 30 * 86_400_000).toLocaleDateString(
                                "en-GB",
                                {
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* DEMO: the member already knows a person here (a "your_contact" flag). */}
              {partner.flags.some((f) => f.id === "your_contact") && (
                <section className="pdm-section">
                  <h3 className="pdm-h">You already know someone here</h3>
                  <p className="t-body-sm">
                    Start with the person named under &ldquo;Worth knowing&rdquo; and mention{" "}
                    {KNOWN_CONTACT_HOOK}.
                  </p>
                </section>
              )}

              {/* The one job of this window: get her on their vendor list. Three steps, in order. */}
              <section className="pdm-section">
                <h3 className="pdm-h">How to get on their vendor list</h3>
                <ol className="pdm-steps">
                  <li>
                    <span className="pdm-steps__n" aria-hidden>
                      1
                    </span>
                    <div>
                      <p className="pdm-steps__t">
                        {website ? "Go to their website" : "Find their website"}
                      </p>
                      <p className="pdm-steps__d">
                        Look for a page named "Suppliers", "Vendors" or "Small business".
                      </p>
                    </div>
                  </li>
                  <li>
                    <span className="pdm-steps__n" aria-hidden>
                      2
                    </span>
                    <div>
                      <p className="pdm-steps__t">Register as a supplier</p>
                      <p className="pdm-steps__d">Use the details on your My Business page.</p>
                    </div>
                  </li>
                  <li>
                    <span className="pdm-steps__n" aria-hidden>
                      3
                    </span>
                    <div>
                      <p className="pdm-steps__t">Send your capability statement</p>
                      <p className="pdm-steps__d">Send it to the person who runs subcontracting.</p>
                      {contact && (
                        <p className="pdm-steps__contact">
                          Their contact in SAM: <strong>{highlight(hl, contact.name)}</strong>
                          {contact.title ? <> · {highlight(hl, contact.title)}</> : null}
                        </p>
                      )}
                    </div>
                  </li>
                </ol>
              </section>

              {partner.reasons.length > 0 && (
                <section className="pdm-section">
                  <h3 className="pdm-h">Why this company</h3>
                  <ul className="pdm-list">
                    {partner.reasons.map((r) => (
                      <li key={r.signal}>
                        <span>{emphasize(r.text, hl)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {partner.flags.length > 0 && (
                <section className="pdm-section">
                  <h3 className="pdm-h">Worth knowing</h3>
                  <ul className="pdm-list">
                    {partner.flags.map((f) => (
                      <li key={f.id}>{f.text}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="pdm-folds">
                {jobs.length > 0 && (
                  <Fold
                    title="Recent jobs"
                    count={jobs.length}
                    open={jobs.some((j) =>
                      hit(
                        j.title,
                        j.description,
                        j.workType,
                        j.buyer,
                        j.office,
                        j.city,
                        j.contractNumber,
                        j.solicitationId,
                        j.pscCode,
                        j.pscCode ? plainPsc(j.pscCode) : null,
                      ),
                    )}
                  >
                    <div className="pdm-fold__tools">
                      <Link
                        to="/awards"
                        search={
                          { q: partner.name, from: awardsFrom, fromLabel: awardsFromLabel } as never
                        }
                        className="pdm-link"
                      >
                        See all their awards →
                      </Link>
                    </div>
                    <div className="pdm-jobs-wrap">
                      <table className="pdm-jobs">
                        <thead>
                          <tr>
                            <th scope="col">Job</th>
                            <th scope="col">Buyer</th>
                            <th scope="col">Place</th>
                            <th scope="col" className="pdm-jobs__num">
                              Paid*
                            </th>
                            <th scope="col">Started</th>
                            <th scope="col">Work ends</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((j) => {
                            const bought = plainDescription(j.description);
                            const what = [
                              bought && bought.toLowerCase() !== j.title.trim().toLowerCase()
                                ? bought
                                : null,
                              j.workType ? plainNaics(j.naicsCode, j.workType) : null,
                            ].filter((x): x is string => Boolean(x));
                            const place = [j.city ? titleCaseWords(j.city) : null, j.state]
                              .filter(Boolean)
                              .join(", ");
                            return (
                              <tr key={j.awardId}>
                                <td data-label="Job">
                                  <Link
                                    to="/awards"
                                    search={{ award: j.awardId } as never}
                                    className="pdm-jobs__title"
                                  >
                                    {highlight(hl, j.title)}
                                  </Link>
                                  {what.map((w) => (
                                    <span key={w} className="pdm-jobs__sub">
                                      {highlight(hl, w)}
                                    </span>
                                  ))}
                                  {j.pscCode && (
                                    <span className="pdm-jobs__sub">
                                      {highlight(hl, plainPsc(j.pscCode))}{" "}
                                      <span className="pdm-code mono">
                                        {highlight(hl, j.pscCode)}
                                      </span>
                                    </span>
                                  )}
                                  {j.contractNumber && (
                                    <span className="pdm-jobs__sub pdm-code mono">
                                      {highlight(hl, j.contractNumber)}
                                    </span>
                                  )}
                                </td>
                                <td data-label="Buyer">
                                  {highlight(hl, j.buyer)}
                                  {j.office && (
                                    <span className="pdm-jobs__sub">{highlight(hl, j.office)}</span>
                                  )}
                                </td>
                                <td data-label="Place">{place ? highlight(hl, place) : "—"}</td>
                                <td data-label="Paid" className="pdm-jobs__num mono">
                                  {short(j.value) ?? "—"}
                                </td>
                                <td data-label="Started">{dateWords(j.awardedAt) ?? "—"}</td>
                                <td data-label="Work ends">{dateWords(j.endsAt) ?? "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Fold>
                )}

                {subs.length > 0 && (
                  <Fold
                    title="Firms they hired"
                    count={subs.length}
                    open={subs.some((f) => hit(f.name, f.trade, tradeWords(f.trade)))}
                  >
                    <ul className="pdm-rows">
                      {subs.map((f) => {
                        const small = f.employeeBand === "<500";
                        const year = f.lastAt ? new Date(f.lastAt).getFullYear() : null;
                        const trade = tradeWords(f.trade);
                        return (
                          <li key={f.name}>
                            <span className="pdm-rows__name">
                              <span className="pdm-rows__line">
                                {highlight(hl, f.name)}
                                {f.employeeBand && (
                                  <span className={`pdm-tag${small ? " pdm-tag--small" : ""}`}>
                                    {small ? "Small" : "Large"}
                                  </span>
                                )}
                              </span>
                              {trade && (
                                <span className="pdm-rows__sub">{highlight(hl, trade)}</span>
                              )}
                            </span>
                            <span className="pdm-rows__count pdm-rows__count--stack">
                              <span>
                                at least <span className="mono">{f.jobs}</span>{" "}
                                {f.jobs === 1 ? "job" : "jobs"}
                                {short(f.dollars) && (
                                  <>
                                    {" · "}
                                    <span className="mono">{short(f.dollars)}</span>
                                  </>
                                )}
                              </span>
                              {year && (
                                <span>
                                  Last hired <span className="mono">{year}</span>
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Fold>
                )}

                {trades.length > 0 && (
                  <Fold
                    title="Trades they hire"
                    count={trades.length}
                    open={trades.some((t) => hit(t.name, plainNaics(t.naics, t.name), t.naics))}
                  >
                    <ul className="pdm-rows">
                      {trades.map((t) => (
                        <li key={t.naics}>
                          <span className="pdm-rows__name">
                            {highlight(hl, plainNaics(t.naics, t.name))}{" "}
                            <span className="pdm-code mono">{highlight(hl, t.naics)}</span>
                          </span>
                          <span className="pdm-rows__count">
                            at least <span className="mono">{t.firms}</span>{" "}
                            {t.firms === 1 ? "firm" : "firms"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Fold>
                )}

                {workTypes.length > 0 && (
                  <Fold
                    title="Kinds of work they win"
                    count={workTypes.length}
                    open={workTypes.some((w) => hit(w.name, plainNaics(w.naics, w.name), w.naics))}
                  >
                    <ul className="pdm-pills">
                      {workTypes.map((w) => (
                        <li key={w.naics}>
                          {highlight(hl, plainNaics(w.naics, w.name))}{" "}
                          <span className="pdm-code mono">{highlight(hl, w.naics)}</span>
                        </li>
                      ))}
                    </ul>
                  </Fold>
                )}

                {vehicles.length > 0 && (
                  <Fold
                    title="Long contracts they hold"
                    count={vehicles.length}
                    open={vehicles.some((v) => hit(v.name, v.agency))}
                  >
                    <ul className="pdm-rows">
                      {vehicles.map((v) => {
                        const ended =
                          v.orderingEndsAt !== null &&
                          new Date(v.orderingEndsAt).getTime() < Date.now();
                        return (
                          <li key={`${v.name}-${v.agency}`}>
                            <span className="pdm-rows__name">
                              {highlight(hl, v.name)}
                              <span className="pdm-rows__sub">
                                {highlight(hl, v.agency)}
                                {v.openTo ? ` · ${v.openTo}` : ""}
                              </span>
                            </span>
                            {v.orderingEndsAt && (
                              <span className="pdm-rows__count">
                                {ended ? "Orders ended" : "Orders until"}{" "}
                                {dateWords(v.orderingEndsAt)}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </Fold>
                )}

                {buyers.length > 0 && (
                  <Fold
                    title="Who buys from them"
                    count={buyers.length}
                    open={buyers.some((b) => hit(b.name))}
                  >
                    <ul className="pdm-rows">
                      {buyers.map((b) => (
                        <li key={b.name}>
                          <span className="pdm-rows__name">{highlight(hl, b.name)}</span>
                          <span className="pdm-rows__count">
                            <span className="mono">{b.jobs}</span> {b.jobs === 1 ? "job" : "jobs"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Fold>
                )}

                {(cities.length > 0 || states.length > 0) && (
                  <Fold
                    title="Where they work"
                    count={cities.length || states.length}
                    open={hit(...cities.map((c) => titleCaseWords(c.city)), ...states)}
                  >
                    {cities.length > 0 && (
                      <ul className="pdm-rows">
                        {cities.map((c) => (
                          <li key={c.city}>
                            <span className="pdm-rows__name">
                              {highlight(hl, titleCaseWords(c.city))}
                            </span>
                            <span className="pdm-rows__count">
                              <span className="mono">{c.count}</span>{" "}
                              {c.count === 1 ? "job" : "jobs"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {states.length > 0 && (
                      <p className="pdm-p pdm-small">
                        {states.length === 1 ? "State" : "States"}:{" "}
                        {highlight(hl, states.join(", "))}
                      </p>
                    )}
                  </Fold>
                )}

                {certs.length > 0 && (
                  <Fold
                    title="Certifications"
                    count={certs.length}
                    open={certs.some((c) => hit(c.label, c.term))}
                  >
                    <ul className="pdm-pills">
                      {certs.map((c) => (
                        <li key={c.id}>
                          {highlight(hl, c.label)}
                          {c.term && (
                            <>
                              {" "}
                              <span className="pdm-code">{highlight(hl, c.term)}</span>
                            </>
                          )}
                          {checked.has(c.id) && (
                            <>
                              {" "}
                              <span className="pdm-tag pdm-tag--small">SBA-certified</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Fold>
                )}

                {details.length > 0 && (
                  <Fold title="Company details" open={details.some((d) => hit(d.value))}>
                    <dl className="pdm-ids">
                      {details.map((d) => (
                        <div key={d.label}>
                          <dt>
                            {d.label}
                            {d.term && <span className="pdm-term">{d.term}</span>}
                          </dt>
                          <dd className={d.mono ? "mono" : undefined}>{highlight(hl, d.value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </Fold>
                )}
              </div>
            </div>
          </div>

          <footer className="pdm-foot">
            <div className="pdm-actions">
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary pdm-cta"
                >
                  Visit their website
                </a>
              ) : (
                <p className="pdm-nosite">We do not have a website for this company.</p>
              )}
              <button
                type="button"
                className={`pdm-save${saved ? " is-saved" : ""}`}
                aria-label={saveLabel}
                aria-pressed={saved}
                title={saveLabel}
                onClick={() => onToggleSaved(partner)}
              >
                {saved ? (
                  <BookmarkCheck size={18} aria-hidden />
                ) : (
                  <Bookmark size={18} aria-hidden />
                )}
                <span>{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
            <p className="pdm-footnote">
              * Based on contract awards published by the government. Firm and job counts are a
              minimum.
            </p>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The counts and the kind of work in a reason, in bold. The search marks still apply. */
const KEY_FACT =
  /(at least \d[\d,]* (?:smaller |small )?firms?|went back to \d[\d,]* of them|\d[\d,]* of them small|\d+ of their \d+ jobs|All of their jobs|(?<=kind of work: )[^.]+)/;

function emphasize(text: string, hl: ((t: string) => ReactNode) | null): ReactNode {
  return text
    .split(KEY_FACT)
    .map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i}>{highlight(hl, part)}</strong>
      ) : (
        <span key={i}>{highlight(hl, part)}</span>
      ),
    );
}
